<?php

namespace App\Http\Controllers;

use App\Models\Meeting;
use App\Models\MeetingAttendance;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;

class PublicMeetingController extends Controller
{
    /**
     * Check-in a una reunión vía QR (requiere autenticación)
     */
    public function checkIn(Request $request, string $qrToken): JsonResponse
    {
        // Validar token QR
        $meeting = Meeting::where('qr_code', $qrToken)->first();

        if (!$meeting) {
            return response()->json([
                'success' => false,
                'message' => 'Código QR inválido.',
            ], 404);
        }

        if (!$meeting->isQrValid()) {
            return response()->json([
                'success' => false,
                'message' => 'El código QR ha expirado.',
            ], 400);
        }

        $user = null;

        // Intentar autenticar con token JWT si está presente
        try {
            $token = $request->bearerToken() ?? $request->header('Authorization');
            if ($token) {
                // Remover "Bearer " si está presente
                $token = str_replace('Bearer ', '', $token);
                $user = JWTAuth::setToken($token)->authenticate();
            }
        } catch (\Exception $e) {
            // Si falla la autenticación con token, continuar con credenciales
        }

        // Si no hay usuario autenticado, intentar con credenciales
        if (!$user) {
            // Validar credenciales
            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
                'password' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Credenciales inválidas.',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Autenticar usuario con credenciales
            $credentials = $request->only('email', 'password');
            
            try {
                if (!$token = JWTAuth::attempt($credentials)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Credenciales incorrectas.',
                    ], 401);
                }
                $user = Auth::user();
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error al autenticar.',
                ], 500);
            }
        }

        // Verificar que el usuario esté relacionado con el evento
        // El coordinador siempre puede hacer check-in
        $isCoordinator = $meeting->event->coordinator_id === $user->id;
        // También verificar si es participante del evento
        $isParticipant = $meeting->event->users()->where('users.id', $user->id)->exists();
        
        if (!$isCoordinator && !$isParticipant) {
            return response()->json([
                'success' => false,
                'message' => 'No estás participando en este evento.',
            ], 403);
        }

        // Verificar si ya registró asistencia
        $existingAttendance = MeetingAttendance::where('meeting_id', $meeting->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existingAttendance) {
            return response()->json([
                'success' => true,
                'message' => 'Asistencia ya registrada anteriormente.',
                'data' => [
                    'attendance' => [
                        'id' => $existingAttendance->id,
                        'checked_in_at' => $existingAttendance->checked_in_at->toIso8601String(),
                        'checked_in_via' => $existingAttendance->checked_in_via,
                    ],
                ],
            ]);
        }

        // Registrar asistencia
        $attendance = MeetingAttendance::create([
            'meeting_id' => $meeting->id,
            'user_id' => $user->id,
            'checked_in_at' => now(),
            'checked_in_via' => 'qr',
            'device_info' => $request->header('User-Agent'),
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Asistencia registrada exitosamente.',
            'data' => [
                'attendance' => [
                    'id' => $attendance->id,
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                    ],
                    'meeting' => [
                        'id' => $meeting->id,
                        'title' => $meeting->title,
                    ],
                    'checked_in_at' => $attendance->checked_in_at->toIso8601String(),
                    'checked_in_via' => $attendance->checked_in_via,
                ],
            ],
        ]);
    }

    /**
     * Validar token QR (sin autenticación)
     */
    public function validateQrToken(string $qrToken): JsonResponse
    {
        $meeting = Meeting::where('qr_code', $qrToken)
            ->with('event')
            ->first();

        if (!$meeting) {
            return response()->json([
                'success' => false,
                'message' => 'Código QR inválido.',
            ], 404);
        }

        if (!$meeting->isQrValid()) {
            return response()->json([
                'success' => false,
                'message' => 'El código QR ha expirado.',
                'data' => [
                    'expired_at' => $meeting->qr_expires_at->toIso8601String(),
                ],
            ], 400);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'meeting' => [
                    'id' => $meeting->id,
                    'title' => $meeting->title,
                    'scheduled_at' => $meeting->scheduled_at->toIso8601String(),
                    'location' => $meeting->location,
                ],
                'event' => [
                    'id' => $meeting->event->id,
                    'name' => $meeting->event->name,
                ],
            ],
        ]);
    }
}
