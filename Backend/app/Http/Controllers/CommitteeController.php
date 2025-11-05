<?php

namespace App\Http\Controllers;

use App\Http\Requests\CommitteeRequest;
use App\Http\Resources\CommitteeResource;
use App\Models\Committee;
use App\Models\Event;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class CommitteeController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api');
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();

        if ($request->filled('event_id')) {
            // Si se especifica un evento, verificar permisos para gestionar comités
            $event = Event::findOrFail($request->event_id);
            $this->authorize('manageCommittees', $event);

            $committees = Committee::where('event_id', $request->event_id)
                ->with(['event', 'users'])
                ->get();
        } else {
            // Filtrar según el rol del usuario
            if ($user->hasRole('coordinator')) {
                // Los coordinadores ven comités de sus eventos
                $eventIds = $user->coordinatedEvents()->pluck('id');
                $committees = Committee::whereIn('event_id', $eventIds)
                    ->with(['event', 'users'])
                    ->get();
            } elseif ($user->hasRole('seedbed_leader')) {
                // Los líderes de semillero ven comités donde están asignados
                $committees = $user->committees()->with(['event', 'users'])->get();
            } else {
                // Admins ven todos los comités
                $committees = Committee::with(['event', 'users'])->get();
            }
        }

        return response()->json([
            'success' => true,
            'data' => CommitteeResource::collection($committees),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(CommitteeRequest $request): JsonResponse
    {
        $event = Event::findOrFail($request->event_id);
        $this->authorize('manageCommittees', $event);

        $committee = Committee::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Comité creado exitosamente.',
            'data' => new CommitteeResource($committee->load(['event', 'users'])),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Committee $committee): JsonResponse
    {
        $this->authorize('manageCommittees', $committee->event);

        $committee->load(['event', 'users']);

        return response()->json([
            'success' => true,
            'data' => new CommitteeResource($committee),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(CommitteeRequest $request, Committee $committee): JsonResponse
    {
        $this->authorize('manageCommittees', $committee->event);

        $committee->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Comité actualizado exitosamente.',
            'data' => new CommitteeResource($committee->load(['event', 'users'])),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Committee $committee): JsonResponse
    {
        $this->authorize('manageCommittees', $committee->event);

        $committee->delete();

        return response()->json([
            'success' => true,
            'message' => 'Comité eliminado exitosamente.',
        ]);
    }

    /**
     * Assign a user to a committee.
     */
    public function assignUser(Request $request, Committee $committee): JsonResponse
    {
        $this->authorize('manageCommittees', $committee->event);

        $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $user = User::findOrFail($request->user_id);

        // Verificar que el usuario sea un participante del evento
        $isParticipant = $committee->event->participants()
            ->where('user_id', $user->id)
            ->exists();

        if (! $isParticipant) {
            return response()->json([
                'success' => false,
                'message' => 'El usuario debe ser un participante del evento.',
            ], 422);
        }

        // Verificar que no esté ya asignado al comité
        if ($committee->users()->where('user_id', $user->id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'El usuario ya está asignado a este comité.',
            ], 422);
        }

        $committee->users()->attach($user->id, [
            'assigned_at' => now(),
        ]);

        // Cargar relaciones necesarias
        $committee->load('event');

        // Enviar notificación al líder cuando es asignado a un comité (Flujo 1)
        try {
            app(NotificationService::class)->sendCommitteeAssignmentNotification(
                $user->id,
                $committee,
                $committee->event
            );
        } catch (\Exception $e) {
            Log::error("Failed to send committee assignment notification: " . $e->getMessage(), [
                'leader_id' => $user->id,
                'committee_id' => $committee->id,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Usuario asignado al comité exitosamente.',
            'data' => new CommitteeResource($committee->load(['event', 'users'])),
        ]);
    }

    /**
     * Remove a user from a committee.
     */
    public function removeUser(Committee $committee, User $user): JsonResponse
    {
        $this->authorize('manageCommittees', $committee->event);

        if (! $committee->users()->where('user_id', $user->id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'El usuario no está asignado a este comité.',
            ], 422);
        }

        $committee->users()->detach($user->id);

        return response()->json([
            'success' => true,
            'message' => 'Usuario removido del comité exitosamente.',
        ]);
    }

    /**
     * Get committee members.
     */
    public function members(Committee $committee): JsonResponse
    {
        $this->authorize('manageCommittees', $committee->event);

        $members = $committee->users()->withPivot(['assigned_at'])->get();

        return response()->json([
            'success' => true,
            'data' => $members->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'assigned_at' => $user->pivot->assigned_at,
                ];
            }),
        ]);
    }
}
