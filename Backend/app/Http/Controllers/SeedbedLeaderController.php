<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Event;
use App\Http\Resources\EventResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SeedbedLeaderController extends Controller
{
    /**
     * Get dashboard data for seedbed leader
     */
    public function dashboard(): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user->hasRole('seedbed_leader')) {
            return response()->json([
                'success' => false,
                'message' => 'Solo los líderes de semillero pueden acceder a este dashboard.',
            ], 403);
        }

        // Verificar si tiene un evento activo
        $activeEvent = $user->activeEvent();
        $hasActiveEvent = $activeEvent !== null;

        if ($hasActiveEvent) {
            // Si tiene evento activo, solo devolver ese evento
            return response()->json([
                'success' => true,
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'institution_id' => $user->institution_id,
                    ],
                    'has_active_event' => true,
                    'active_event' => new EventResource($activeEvent->event->load(['coordinator', 'institution'])),
                    'available_events' => [], // No mostrar eventos disponibles si tiene uno activo
                    'participated_events' => $user->eventParticipations()
                        ->with(['event.coordinator', 'event.institution'])
                        ->get()
                        ->pluck('event')
                        ->map(fn($event) => new EventResource($event)),
                ]
            ]);
        } else {
            // Si no tiene evento activo, mostrar eventos disponibles de su institución
            $availableEvents = Event::with(['coordinator', 'institution'])
                ->where('institution_id', $user->institution_id)
                ->whereIn('status', ['active', 'inactive'])
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'institution_id' => $user->institution_id,
                    ],
                    'has_active_event' => false,
                    'active_event' => null,
                    'available_events' => EventResource::collection($availableEvents),
                    'participated_events' => $user->eventParticipations()
                        ->with(['event.coordinator', 'event.institution'])
                        ->get()
                        ->pluck('event')
                        ->map(fn($event) => new EventResource($event)),
                ]
            ]);
        }
    }

    /**
     * Get active event details for seedbed leader
     */
    public function activeEvent(): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user->hasRole('seedbed_leader')) {
            return response()->json([
                'success' => false,
                'message' => 'Solo los líderes de semillero pueden acceder a esta información.',
            ], 403);
        }

        $activeEvent = $user->activeEvent();
        
        if (!$activeEvent) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes un evento activo.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new EventResource($activeEvent->event->load(['coordinator', 'institution', 'committees.users'])),
        ]);
    }
}
