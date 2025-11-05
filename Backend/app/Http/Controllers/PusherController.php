<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use App\Services\NotificationService;

class PusherController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api');
    }

    /**
     * Obtener las credenciales de Pusher para autenticación
     */
    public function auth(Request $request): JsonResponse
    {
        $socketId = $request->input('socket_id');
        $channelName = $request->input('channel_name');

        if (!$socketId || !$channelName) {
            return response()->json([
                'success' => false,
                'message' => 'Socket ID and Channel Name are required'
            ], 400);
        }

        // Verificar que el usuario puede acceder al canal
        if (!$this->canAccessChannel($channelName)) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied to this channel'
            ], 403);
        }

        // Generar autenticación para Pusher
        $pusher = new \Pusher\Pusher(
            config('broadcasting.connections.pusher.key'),
            config('broadcasting.connections.pusher.secret'),
            config('broadcasting.connections.pusher.app_id'),
            [
                'cluster' => config('broadcasting.connections.pusher.options.cluster'),
                'useTLS' => true
            ]
        );

        $auth = $pusher->authorizeChannel($channelName, $socketId);

        return response()->json([
            'success' => true,
            'auth' => $auth
        ]);
    }

    /**
     * Verificar si el usuario puede acceder al canal
     */
    private function canAccessChannel(string $channelName): bool
    {
        $user = Auth::user();
        
        // Verificar si es un canal de usuario específico
        if (preg_match('/^user-(\d+)$/', $channelName, $matches)) {
            $userId = (int) $matches[1];
            return $user->id === $userId;
        }

        // Verificar si es un canal de comité
        if (preg_match('/^committee-(\d+)$/', $channelName, $matches)) {
            $committeeId = (int) $matches[1];
            // Aquí podrías agregar lógica para verificar si el usuario pertenece al comité
            return true; // Por ahora permitir acceso
        }

        // Verificar si es un canal de evento
        if (preg_match('/^event-(\d+)$/', $channelName, $matches)) {
            $eventId = (int) $matches[1];
            // Aquí podrías agregar lógica para verificar si el usuario tiene acceso al evento
            return true; // Por ahora permitir acceso
        }

        return false;
    }

    /**
     * Obtener las credenciales públicas de Pusher
     */
    public function credentials(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'key' => config('broadcasting.connections.pusher.key'),
                'cluster' => config('broadcasting.connections.pusher.options.cluster'),
            ]
        ]);
    }

    /**
     * Enviar una notificación de prueba al usuario autenticado
     * Útil para probar que el sistema de push funciona correctamente
     */
    public function testNotification(Request $request): JsonResponse
    {
        $user = Auth::user();
        $event = $request->input('event', 'test.notification');
        $message = $request->input('message', '🧪 Esta es una notificación de prueba');

        try {
            $notificationService = app(NotificationService::class);
            
            // Enviar notificación de prueba
            $notificationService->sendGeneralNotification(
                $user->id,
                $event,
                [
                    'message' => $message,
                    'type' => 'test',
                    'timestamp' => now()->toISOString(),
                    'user_id' => $user->id,
                    'user_name' => $user->name,
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Notificación de prueba enviada exitosamente',
                'data' => [
                    'user_id' => $user->id,
                    'user_name' => $user->name,
                    'event' => $event,
                    'message' => $message,
                    'driver' => config('broadcasting.default'),
                    'channel' => 'user-' . $user->id,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al enviar notificación de prueba',
                'error' => $e->getMessage(),
                'driver' => config('broadcasting.default'),
            ], 500);
        }
    }
}
