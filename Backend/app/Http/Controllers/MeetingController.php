<?php

namespace App\Http\Controllers;

use App\Http\Requests\MeetingRequest;
use App\Models\Meeting;
use App\Models\MeetingInvitation;
use App\Models\MeetingAttendance;
use App\Models\Event;
use App\Models\Committee;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class MeetingController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->middleware('auth:api');
        $this->notificationService = $notificationService;
    }

    /**
     * Listar reuniones de un evento
     */
    public function index(Request $request, Event $event): JsonResponse
    {
        $this->authorize('view', $event);

        $user = Auth::user();
        
        $meetingsQuery = Meeting::where('event_id', $event->id)
            ->where('status', '!=', 'cancelled')
            ->with(['coordinator', 'invitations.user', 'attendances.user']);

        // Si es líder, solo ver reuniones donde está invitado
        if ($user->hasRole('seedbed_leader')) {
            $meetingsQuery->whereHas('invitations', function($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        }

        $meetings = $meetingsQuery->orderBy('scheduled_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $meetings->map(function ($meeting) use ($user) {
                $invitation = $meeting->invitations()->where('user_id', $user->id)->first();
                return [
                    'id' => $meeting->id,
                    'title' => $meeting->title,
                    'description' => $meeting->description,
                    'scheduled_at' => $meeting->scheduled_at->toIso8601String(),
                    'location' => $meeting->location,
                    'meeting_type' => $meeting->meeting_type,
                    'status' => $meeting->status,
                    'has_qr_code' => !empty($meeting->qr_code),
                    'qr_expires_at' => $meeting->qr_expires_at?->toIso8601String(),
                    'invitation_status' => $invitation?->status,
                    'total_invited' => $meeting->invitations()->count(),
                    'total_attended' => $meeting->attendances()->count(),
                ];
            }),
        ]);
    }

    /**
     * Crear nueva reunión
     */
    public function store(MeetingRequest $request, Event $event): JsonResponse
    {
        $this->authorize('create', Meeting::class);
        $this->authorize('view', $event);

        $user = Auth::user();

        // Verificar que el usuario sea coordinador del evento
        if ($event->coordinator_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Solo el coordinador del evento puede crear reuniones.',
            ], 403);
        }

        $validated = $request->validated();

        // Crear la reunión
        $meeting = Meeting::create([
            'event_id' => $event->id,
            'coordinator_id' => $user->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'scheduled_at' => $validated['scheduled_at'],
            'location' => $validated['location'] ?? null,
            'meeting_type' => $validated['meeting_type'],
            'status' => 'scheduled',
        ]);

        // Generar QR code
        $meeting->generateQrCode();

        // Invitar participantes según el tipo
        $this->inviteParticipantsByType($meeting, $validated);

        // Enviar notificaciones
        $this->sendMeetingNotifications($meeting);

        $meeting->load(['coordinator', 'invitations.user', 'event']);

        return response()->json([
            'success' => true,
            'message' => 'Reunión creada exitosamente.',
            'data' => [
                'id' => $meeting->id,
                'title' => $meeting->title,
                'description' => $meeting->description,
                'scheduled_at' => $meeting->scheduled_at->toIso8601String(),
                'location' => $meeting->location,
                'meeting_type' => $meeting->meeting_type,
                'status' => $meeting->status,
                'qr_code' => $meeting->qr_code,
                'qr_url' => $meeting->getCheckInUrl(),
                'qr_expires_at' => $meeting->qr_expires_at->toIso8601String(),
                'total_invited' => $meeting->invitations()->count(),
            ],
        ], 201);
    }

    /**
     * Mostrar detalles de una reunión
     */
    public function show(Meeting $meeting): JsonResponse
    {
        $this->authorize('view', $meeting);

        $user = Auth::user();
        $invitation = $meeting->invitations()->where('user_id', $user->id)->first();

        $meeting->load(['coordinator', 'event', 'invitations.user', 'invitations.committee', 'attendances.user']);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $meeting->id,
                'title' => $meeting->title,
                'description' => $meeting->description,
                'scheduled_at' => $meeting->scheduled_at->toIso8601String(),
                'location' => $meeting->location,
                'meeting_type' => $meeting->meeting_type,
                'status' => $meeting->status,
                'has_qr_code' => !empty($meeting->qr_code),
                'qr_code' => $meeting->qr_code,
                'qr_url' => $meeting->getCheckInUrl(),
                'qr_expires_at' => $meeting->qr_expires_at?->toIso8601String(),
                'is_qr_valid' => $meeting->isQrValid(),
                'coordinator' => [
                    'id' => $meeting->coordinator->id,
                    'name' => $meeting->coordinator->name,
                    'email' => $meeting->coordinator->email,
                ],
                'event' => [
                    'id' => $meeting->event->id,
                    'name' => $meeting->event->name,
                ],
                'invitation_status' => $invitation?->status,
                'invitations' => $meeting->invitations->map(function ($inv) {
                    return [
                        'id' => $inv->id,
                        'user' => [
                            'id' => $inv->user->id,
                            'name' => $inv->user->name,
                            'email' => $inv->user->email,
                        ],
                        'committee' => $inv->committee ? [
                            'id' => $inv->committee->id,
                            'name' => $inv->committee->name,
                        ] : null,
                        'status' => $inv->status,
                        'invited_at' => $inv->invited_at?->toIso8601String(),
                        'responded_at' => $inv->responded_at?->toIso8601String(),
                    ];
                }),
                'attendances' => $meeting->attendances->map(function ($attendance) {
                    return [
                        'id' => $attendance->id,
                        'user' => [
                            'id' => $attendance->user->id,
                            'name' => $attendance->user->name,
                            'email' => $attendance->user->email,
                        ],
                        'checked_in_at' => $attendance->checked_in_at->toIso8601String(),
                        'checked_in_via' => $attendance->checked_in_via,
                    ];
                }),
                'total_invited' => $meeting->invitations()->count(),
                'total_attended' => $meeting->attendances()->count(),
            ],
        ]);
    }

    /**
     * Actualizar reunión
     */
    public function update(MeetingRequest $request, Meeting $meeting): JsonResponse
    {
        $this->authorize('update', $meeting);

        $validated = $request->validated();
        $oldScheduledAt = $meeting->scheduled_at;

        // Actualizar campos
        $meeting->update([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'scheduled_at' => $validated['scheduled_at'],
            'location' => $validated['location'] ?? null,
            'meeting_type' => $validated['meeting_type'],
        ]);

        // Si cambió la fecha, regenerar QR
        if ($oldScheduledAt->ne($meeting->scheduled_at)) {
            $meeting->generateQrCode();
        }

        // Si cambió el tipo o comités, actualizar invitaciones
        if (isset($validated['committee_ids'])) {
            // Eliminar invitaciones existentes
            $meeting->invitations()->delete();
            // Crear nuevas invitaciones
            $this->inviteParticipantsByType($meeting, $validated);
            // Enviar notificaciones
            $this->sendMeetingNotifications($meeting);
        }

        $meeting->load(['coordinator', 'invitations.user', 'event']);

        return response()->json([
            'success' => true,
            'message' => 'Reunión actualizada exitosamente.',
            'data' => [
                'id' => $meeting->id,
                'title' => $meeting->title,
                'description' => $meeting->description,
                'scheduled_at' => $meeting->scheduled_at->toIso8601String(),
                'location' => $meeting->location,
                'meeting_type' => $meeting->meeting_type,
                'status' => $meeting->status,
                'qr_code' => $meeting->qr_code,
                'qr_url' => $meeting->getCheckInUrl(),
            ],
        ]);
    }

    /**
     * Cancelar reunión
     */
    public function destroy(Meeting $meeting): JsonResponse
    {
        $this->authorize('delete', $meeting);

        $meeting->update(['status' => 'cancelled']);

        // Enviar notificaciones de cancelación
        foreach ($meeting->invitations as $invitation) {
            $this->notificationService->sendGeneralNotification(
                $invitation->user_id,
                'meeting_cancelled',
                [
                    'meeting_id' => $meeting->id,
                    'title' => $meeting->title,
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Reunión cancelada exitosamente.',
        ]);
    }

    /**
     * Generar/Regenerar QR code
     */
    public function generateQr(Meeting $meeting): JsonResponse
    {
        $this->authorize('update', $meeting);

        $qrCode = $meeting->generateQrCode();

        return response()->json([
            'success' => true,
            'message' => 'QR code generado exitosamente.',
            'data' => [
                'qr_code' => $qrCode,
                'qr_url' => $meeting->getCheckInUrl(),
                'qr_expires_at' => $meeting->qr_expires_at->toIso8601String(),
            ],
        ]);
    }

    /**
     * Obtener imagen del QR en base64
     */
    public function getQrImage(Meeting $meeting): JsonResponse
    {
        $this->authorize('view', $meeting);

        if (!$meeting->qr_code) {
            return response()->json([
                'success' => false,
                'message' => 'La reunión no tiene un código QR.',
            ], 404);
        }

        // Generar QR usando una librería (Simple QrCode o similar)
        // Por ahora retornamos la URL, el frontend puede generar la imagen
        return response()->json([
            'success' => true,
            'data' => [
                'qr_code' => $meeting->qr_code,
                'qr_url' => $meeting->getCheckInUrl(),
                'qr_expires_at' => $meeting->qr_expires_at->toIso8601String(),
            ],
        ]);
    }

    /**
     * Listar asistencias de una reunión
     */
    public function attendances(Meeting $meeting): JsonResponse
    {
        $this->authorize('viewAttendances', $meeting);

        $attendances = $meeting->attendances()
            ->with('user')
            ->orderBy('checked_in_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'meeting' => [
                    'id' => $meeting->id,
                    'title' => $meeting->title,
                    'scheduled_at' => $meeting->scheduled_at->toIso8601String(),
                ],
                'attendances' => $attendances->map(function ($attendance) {
                    return [
                        'id' => $attendance->id,
                        'user' => [
                            'id' => $attendance->user->id,
                            'name' => $attendance->user->name,
                            'email' => $attendance->user->email,
                        ],
                        'checked_in_at' => $attendance->checked_in_at->toIso8601String(),
                        'checked_in_via' => $attendance->checked_in_via,
                        'device_info' => $attendance->device_info,
                        'ip_address' => $attendance->ip_address,
                    ];
                }),
                'total_attended' => $attendances->count(),
                'total_invited' => $meeting->invitations()->count(),
            ],
        ]);
    }

    /**
     * Aceptar invitación
     */
    public function acceptInvitation(Meeting $meeting): JsonResponse
    {
        $user = Auth::user();
        $this->authorize('respondInvitation', $meeting);

        $invitation = $meeting->invitations()->where('user_id', $user->id)->firstOrFail();

        if ($invitation->isAccepted()) {
            return response()->json([
                'success' => false,
                'message' => 'Ya has aceptado esta invitación.',
            ], 400);
        }

        $invitation->accept();

        return response()->json([
            'success' => true,
            'message' => 'Invitación aceptada exitosamente.',
            'data' => [
                'invitation_status' => $invitation->status,
            ],
        ]);
    }

    /**
     * Rechazar invitación
     */
    public function declineInvitation(Meeting $meeting): JsonResponse
    {
        $user = Auth::user();
        $this->authorize('respondInvitation', $meeting);

        $invitation = $meeting->invitations()->where('user_id', $user->id)->firstOrFail();

        if ($invitation->isDeclined()) {
            return response()->json([
                'success' => false,
                'message' => 'Ya has rechazado esta invitación.',
            ], 400);
        }

        $invitation->decline();

        return response()->json([
            'success' => true,
            'message' => 'Invitación rechazada exitosamente.',
            'data' => [
                'invitation_status' => $invitation->status,
            ],
        ]);
    }

    /**
     * Invitar participantes según el tipo de reunión
     */
    private function inviteParticipantsByType(Meeting $meeting, array $data): void
    {
        $committeeIds = $data['committee_ids'] ?? [];

        switch ($meeting->meeting_type) {
            case 'planning':
                // Invitar TODOS los líderes del evento
                $leaders = $meeting->event->users()
                    ->whereHas('roles', function($q) {
                        $q->where('name', 'seedbed_leader');
                    })
                    ->get();

                foreach ($leaders as $leader) {
                    MeetingInvitation::create([
                        'meeting_id' => $meeting->id,
                        'user_id' => $leader->id,
                        'status' => 'pending',
                        'invited_at' => now(),
                    ]);
                }
                break;

            case 'coordination':
                // Invitar líderes de comités específicos
                foreach ($committeeIds as $committeeId) {
                    $committee = Committee::find($committeeId);
                    if (!$committee) continue;

                    $leaders = $committee->users()
                        ->whereHas('roles', function($q) {
                            $q->where('name', 'seedbed_leader');
                        })
                        ->get();

                    foreach ($leaders as $leader) {
                        MeetingInvitation::firstOrCreate(
                            [
                                'meeting_id' => $meeting->id,
                                'user_id' => $leader->id,
                            ],
                            [
                                'committee_id' => $committeeId,
                                'status' => 'pending',
                                'invited_at' => now(),
                            ]
                        );
                    }
                }
                break;

            case 'committee':
                // Invitar SOLO líderes del comité específico
                foreach ($committeeIds as $committeeId) {
                    $committee = Committee::find($committeeId);
                    if (!$committee) continue;

                    $leaders = $committee->users()
                        ->whereHas('roles', function($q) {
                            $q->where('name', 'seedbed_leader');
                        })
                        ->get();

                    foreach ($leaders as $leader) {
                        MeetingInvitation::firstOrCreate(
                            [
                                'meeting_id' => $meeting->id,
                                'user_id' => $leader->id,
                            ],
                            [
                                'committee_id' => $committeeId,
                                'status' => 'pending',
                                'invited_at' => now(),
                            ]
                        );
                    }
                }
                break;

            case 'general':
                // Invitar TODOS los participantes del evento
                $participants = $meeting->event->users()->get();
                foreach ($participants as $participant) {
                    MeetingInvitation::create([
                        'meeting_id' => $meeting->id,
                        'user_id' => $participant->id,
                        'status' => 'pending',
                        'invited_at' => now(),
                    ]);
                }
                break;
        }
    }

    /**
     * Enviar notificaciones de reunión
     */
    private function sendMeetingNotifications(Meeting $meeting): void
    {
        foreach ($meeting->invitations as $invitation) {
            try {
                $this->notificationService->sendMeetingInvitation($meeting, $invitation->user);
            } catch (\Exception $e) {
                Log::error("Error sending meeting notification: " . $e->getMessage());
            }
        }
    }
}
