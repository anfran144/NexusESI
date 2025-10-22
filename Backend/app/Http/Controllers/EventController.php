<?php

namespace App\Http\Controllers;

use App\Http\Requests\EventRequest;
use App\Http\Resources\EventParticipantResource;
use App\Http\Resources\EventResource;
use App\Models\Event;
use App\Models\EventParticipant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EventController extends Controller
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
        $this->authorize('viewAny', Event::class);

        $user = Auth::user();
        $query = Event::with(['coordinator', 'institution']);

        // Aplicar filtros directos en la consulta según el rol del usuario
        if ($user->hasRole('seedbed_leader')) {
            // Los líderes de semillero solo ven eventos de su institución, excluyendo finalizados
            $query->where('institution_id', $user->institution_id)
                ->where('status', '!=', 'finalizado');
        } elseif ($user->hasRole('coordinator')) {
            // Los coordinadores solo ven eventos que han creado y de su institución
            $query->where('coordinator_id', $user->id)
                ->where('institution_id', $user->institution_id);
        }

        // Filtros adicionales opcionales
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $events = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => EventResource::collection($events),
            'meta' => [
                'current_page' => $events->currentPage(),
                'last_page' => $events->lastPage(),
                'per_page' => $events->perPage(),
                'total' => $events->total(),
            ],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(EventRequest $request): JsonResponse
    {
        $this->authorize('create', Event::class);

        $event = Event::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Evento creado exitosamente.',
            'data' => new EventResource($event->load(['coordinator', 'institution'])),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Event $event): JsonResponse
    {
        $this->authorize('view', $event);

        $event->load([
            'coordinator',
            'institution',
            'committees.users',
            'participants.user.institution',
        ]);

        return response()->json([
            'success' => true,
            'data' => new EventResource($event),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(EventRequest $request, Event $event): JsonResponse
    {
        $this->authorize('update', $event);

        $event->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Evento actualizado exitosamente.',
            'data' => new EventResource($event->load(['coordinator', 'institution'])),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Event $event): JsonResponse
    {
        $this->authorize('delete', $event);

        if ($event->status !== 'planificación') {
            return response()->json([
                'success' => false,
                'message' => 'Solo se pueden eliminar eventos en estado de planificación.',
            ], 422);
        }

        $event->delete();

        return response()->json([
            'success' => true,
            'message' => 'Evento eliminado exitosamente.',
        ]);
    }

    /**
     * Participate in an event.
     */
    public function participate(Event $event): JsonResponse
    {
        $this->authorize('participate', $event);

        $user = Auth::user();

        // Verificar si ya tiene una participación
        $existingParticipation = EventParticipant::where('user_id', $user->id)
            ->where('event_id', $event->id)
            ->first();

        if ($existingParticipation) {
            return response()->json([
                'success' => false,
                'message' => 'Ya estás participando en este evento.',
            ], 422);
        }

        $participant = EventParticipant::create([
            'user_id' => $user->id,
            'event_id' => $event->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tu participación ha sido registrada exitosamente.',
            'data' => new EventParticipantResource($participant->load(['user', 'event'])),
        ], 201);
    }

    /**
     * Get event participants.
     */
    public function participants(Event $event): JsonResponse
    {
        $this->authorize('manageParticipants', $event);

        $participants = $event->participants()->with(['user.institution'])->get();

        return response()->json([
            'success' => true,
            'data' => EventParticipantResource::collection($participants),
        ]);
    }

    /**
     * Get available events for participation.
     */
    public function available(): JsonResponse
    {
        $user = Auth::user();

        if (! $user->hasRole('seedbed_leader')) {
            return response()->json([
                'success' => false,
                'message' => 'Solo los líderes de semillero pueden ver eventos disponibles.',
            ], 403);
        }

        // Verificar si ya tiene un evento activo
        $activeEvent = $user->activeEvent();
        if ($activeEvent) {
            return response()->json([
                'success' => false,
                'message' => 'Ya tienes un evento activo. No puedes participar en otro evento.',
                'active_event' => new EventResource($activeEvent),
            ], 422);
        }

        // Obtener eventos disponibles (excluyendo finalizados)
        $participatedEventIds = $user->eventParticipations()->pluck('event_id');

        $availableEvents = Event::with(['coordinator', 'institution'])
            ->where('institution_id', $user->institution_id)
            ->whereIn('status', ['planificación', 'en_progreso'])
            ->whereNotIn('id', $participatedEventIds)
            ->get();

        return response()->json([
            'success' => true,
            'data' => EventResource::collection($availableEvents),
        ]);
    }
}
