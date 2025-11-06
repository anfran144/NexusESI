<?php

namespace App\Http\Controllers;

use App\Http\Requests\EventRequest;
use App\Http\Resources\EventParticipantResource;
use App\Http\Resources\EventResource;
use App\Models\Event;
use App\Models\EventParticipant;
use App\Models\Task;
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
        $query = Event::with(['coordinator', 'institution', 'committees', 'participants', 'tasks']);

        // Aplicar filtros directos en la consulta según el rol del usuario
        if ($user->hasRole('seedbed_leader')) {
            // Los líderes de semillero solo ven eventos de su institución, excluyendo finalizados
            $query->where('institution_id', $user->institution_id)
                ->where('status', '!=', 'finished');
        } elseif ($user->hasRole('coordinator')) {
            // Los coordinadores solo ven eventos que han creado y de su institución
            $query->where('coordinator_id', $user->id)
                ->where('institution_id', $user->institution_id);
        }

        // Filtros adicionales opcionales avanzados
        
        // Filtro por múltiples estados
        if ($request->filled('statuses')) {
            $statuses = is_array($request->statuses) 
                ? $request->statuses 
                : explode(',', $request->statuses);
            $statuses = array_filter($statuses);
            if (!empty($statuses)) {
                $query->whereIn('status', $statuses);
            }
        } elseif ($request->filled('status')) {
            // Mantener compatibilidad con filtro único
            $query->where('status', $request->status);
        }

        // Filtros por período del evento
        if ($request->filled('start_date_from')) {
            $query->whereDate('start_date', '>=', $request->start_date_from);
        }

        if ($request->filled('start_date_to')) {
            $query->whereDate('start_date', '<=', $request->start_date_to);
        }

        if ($request->filled('end_date_from')) {
            $query->whereDate('end_date', '>=', $request->end_date_from);
        }

        if ($request->filled('end_date_to')) {
            $query->whereDate('end_date', '<=', $request->end_date_to);
        }

        // Filtros predefinidos por período
        if ($request->filled('period')) {
            $now = now();
            switch ($request->period) {
                case 'active':
                    $query->where('start_date', '<=', $now->toDateString())
                          ->where('end_date', '>=', $now->toDateString());
                    break;
                case 'upcoming':
                    $query->where('start_date', '>', $now->toDateString());
                    break;
                case 'past':
                    $query->where('end_date', '<', $now->toDateString());
                    break;
                case 'this-month':
                    $query->whereMonth('start_date', $now->month)
                          ->whereYear('start_date', $now->year);
                    break;
                case 'next-month':
                    $nextMonth = $now->copy()->addMonth();
                    $query->whereMonth('start_date', $nextMonth->month)
                          ->whereYear('start_date', $nextMonth->year);
                    break;
            }
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

        // Validar que no se puedan hacer cambios estructurales si el evento ya inició
        $hasStructuralChanges = $request->has('start_date') || $request->has('end_date') || $request->has('name');
        
        if ($hasStructuralChanges && $event->isInExecutionPhase()) {
            return response()->json([
                'success' => false,
                'message' => 'No se pueden modificar las fechas o estructura del evento mientras está en ejecución.',
            ], 422);
        }

        // Si el evento está finalizado, solo permitir correcciones menores (descripción)
        if ($event->status === 'finished' && $hasStructuralChanges) {
            return response()->json([
                'success' => false,
                'message' => 'No se pueden modificar eventos finalizados. Solo se permite actualizar la descripción.',
            ], 422);
        }

        // Si el evento está inactivo, solo permitir reactivación
        if ($event->status === 'inactive' && !$request->has('status')) {
            return response()->json([
                'success' => false,
                'message' => 'No se pueden modificar eventos inactivos. Solo se permite reactivarlos.',
            ], 422);
        }

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

        if ($event->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Solo se pueden eliminar eventos en estado activo.',
            ], 422);
        }

        // Solo permitir eliminar si está en fase de planificación (antes de start_date)
        if (!$event->isInPlanningPhase()) {
            return response()->json([
                'success' => false,
                'message' => 'Solo se pueden eliminar eventos que aún no han iniciado.',
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
        // Permitir ver participantes si tiene acceso al evento (solo lectura)
        // La gestión (crear/modificar/eliminar) se valida en los métodos específicos
        $this->authorize('view', $event);

        $participants = $event->participants()->with(['user.institution'])->get();

        return response()->json([
            'success' => true,
            'data' => EventParticipantResource::collection($participants),
            'can_manage' => $event->canPerformAction('manage_participants'), // Información para el frontend
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
            ->whereIn('status', ['active', 'inactive'])
            ->whereNotIn('id', $participatedEventIds)
            ->get();

        return response()->json([
            'success' => true,
            'data' => EventResource::collection($availableEvents),
        ]);
    }

    /**
     * Get tasks for a specific event.
     */
    public function tasks(Event $event): JsonResponse
    {
        $this->authorize('view', $event);

        $user = Auth::user();

        // Verificar que el usuario pertenece a la institución del evento
        if ($user->institution_id !== $event->institution_id) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes acceso a este evento.',
            ], 403);
        }

        // Cargar tareas del evento (tanto directas como a través de comités)
        $tasks = \App\Models\Task::where('event_id', $event->id)
            ->with(['event', 'committee', 'assignedTo', 'progress', 'incidents', 'alerts'])
            ->orderBy('due_date', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => \App\Http\Resources\TaskResource::collection($tasks),
            'event' => [
                'id' => $event->id,
                'name' => $event->name,
                'start_date' => $event->start_date,
                'end_date' => $event->end_date,
            ],
        ]);
    }

    /**
     * Get my tasks for a specific event.
     */
    public function myTasks(Event $event): JsonResponse
    {
        $user = Auth::user();

        // Verificar acceso al evento
        if ($user->institution_id !== $event->institution_id) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes acceso a este evento.',
            ], 403);
        }

        // Obtener tareas asignadas al usuario en este evento
        $tasks = \App\Models\Task::where('event_id', $event->id)
            ->where('assigned_to_id', $user->id)
            ->with(['event', 'committee', 'progress', 'incidents'])
            ->orderBy('due_date', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => \App\Http\Resources\TaskResource::collection($tasks),
            'event' => [
                'id' => $event->id,
                'name' => $event->name,
            ],
        ]);
    }

    /**
     * Get alerts for a specific event.
     */
    public function alerts(Event $event): JsonResponse
    {
        $user = Auth::user();

        // Verificar acceso al evento
        if ($user->institution_id !== $event->institution_id) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes acceso a este evento.',
            ], 403);
        }

        // Obtener alertas del evento
        $alerts = \App\Models\Alert::whereHas('task', function ($query) use ($event) {
            $query->where('event_id', $event->id);
        })
            ->where('user_id', $user->id)
            ->with(['task.event', 'task.committee'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => \App\Http\Resources\AlertResource::collection($alerts),
            'event' => [
                'id' => $event->id,
                'name' => $event->name,
            ],
        ]);
    }

    /**
     * Get statistics for a specific event.
     */
    public function statistics(Event $event): JsonResponse
    {
        $this->authorize('view', $event);

        $user = Auth::user();

        // Verificar acceso al evento
        if ($user->institution_id !== $event->institution_id) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes acceso a este evento.',
            ], 403);
        }

        // Obtener tareas del evento directamente (no a través de comités)
        $tasksQuery = Task::where('event_id', $event->id);

        $totalTasks = (clone $tasksQuery)->count();
        $completedTasks = (clone $tasksQuery)->where('status', 'Completed')->count();
        $inProgressTasks = (clone $tasksQuery)->where('status', 'InProgress')->count();
        $delayedTasks = (clone $tasksQuery)->where('status', 'Delayed')->count();
        $pausedTasks = (clone $tasksQuery)->where('status', 'Paused')->count();
        $overdueTasks = (clone $tasksQuery)
            ->whereDate('due_date', '<', now()->toDateString())
            ->where('status', '!=', 'Completed')
            ->count();

        // Progreso como porcentaje de tareas completadas
        $progressPercentage = $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100, 1) : 0.0;

        // Comités activos: comités con al menos 1 tarea no completada
        $activeCommittees = Task::where('event_id', $event->id)
            ->whereNotNull('committee_id')
            ->where('status', '!=', 'Completed')
            ->distinct('committee_id')
            ->count('committee_id');

        // Participantes activos: usuarios con ≥1 tarea no completada
        $activeParticipants = Task::where('event_id', $event->id)
            ->whereNotNull('assigned_to_id')
            ->where('status', '!=', 'Completed')
            ->distinct('assigned_to_id')
            ->count('assigned_to_id');

        // Incidencias abiertas (Reported) del evento
        $openIncidents = \App\Models\Incident::whereHas('task', function ($q) use ($event) {
                $q->where('event_id', $event->id);
            })
            ->where('status', 'Reported')
            ->count();

        // Mis tareas en este evento
        $myTasksCount = Task::where('event_id', $event->id)
            ->where('assigned_to_id', $user->id)
            ->count();

        // Métricas de alertas por tipo
        $alerts = \App\Models\Alert::whereHas('task', function ($query) use ($event) {
            $query->where('event_id', $event->id);
        })->get();

        $criticalAlertsCount = $alerts->where('type', 'Critical')->count();
        $preventiveAlertsCount = $alerts->where('type', 'Preventive')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_tasks' => $totalTasks,
                'completed_tasks' => $completedTasks,
                'in_progress_tasks' => $inProgressTasks,
                'delayed_tasks' => $delayedTasks,
                'paused_tasks' => $pausedTasks,
                'overdue' => $overdueTasks,
                'progress_percentage' => $progressPercentage,
                'active_committees' => $activeCommittees,
                'active_participants' => $activeParticipants,
                'open_incidents' => $openIncidents,
                'my_tasks' => $myTasksCount,
                'critical_alerts' => $criticalAlertsCount,
                'preventive_alerts' => $preventiveAlertsCount,
            ],
            'event' => [
                'id' => $event->id,
                'name' => $event->name,
            ],
        ]);
    }

    /**
     * Obtener datos del calendario para un evento
     */
    public function calendar(Event $event): JsonResponse
    {
        $this->authorize('view', $event);

        $user = Auth::user();

        // Filtrar tareas según el rol del usuario
        $tasksQuery = Task::where('event_id', $event->id)
            ->with(['assignedTo', 'committee', 'event']);

        // Si es líder de semillero, solo ver sus tareas asignadas Y de sus comités
        if ($user->hasRole('seedbed_leader')) {
            // Obtener IDs de los comités del líder en este evento
            $leaderCommitteeIds = $user->committees()->where('event_id', $event->id)->pluck('id');
            
            // Filtrar: tareas asignadas al líder Y que pertenezcan a sus comités
            $tasksQuery->where('assigned_to_id', $user->id)
                ->where(function($query) use ($leaderCommitteeIds) {
                    if ($leaderCommitteeIds->isEmpty()) {
                        // Si no tiene comités, solo mostrar tareas sin comité asignado
                        $query->whereNull('committee_id');
                    } else {
                        // Mostrar tareas de sus comités (NO incluir tareas sin comité si tiene comités)
                        // El líder solo ve tareas de sus comités
                        $query->whereIn('committee_id', $leaderCommitteeIds);
                    }
                });
        }
        // Coordinadores y otros roles ven todas las tareas (sin filtro adicional)

        $tasks = $tasksQuery->get();

        // Obtener incidencias relacionadas con las tareas del evento
        // Si es líder, solo incidencias de sus tareas
        $incidentTaskIds = $tasks->pluck('id')->toArray();
        
        if (empty($incidentTaskIds)) {
            $incidents = collect();
        } else {
            $incidentsQuery = \App\Models\Incident::whereIn('task_id', $incidentTaskIds)
                ->with(['task', 'reportedBy']);
            
            // Si es líder, solo ver incidencias de sus tareas (ya filtradas arriba)
            // No necesita filtro adicional porque las tareas ya están filtradas
            $incidents = $incidentsQuery->get();
        }

        // Obtener comités del evento para colores
        // Si es líder, solo mostrar sus comités
        if ($user->hasRole('seedbed_leader')) {
            $committees = $user->committees()->where('event_id', $event->id)->get();
        } else {
            // Coordinadores y otros roles ven todos los comités del evento
            $committees = $event->committees()->get();
        }

        // Formatear eventos del calendario
        $calendarEvents = [];

        // Evento principal
        $calendarEvents[] = [
            'id' => 'event-' . $event->id,
            'title' => $event->name,
            'start' => $event->start_date,
            'end' => date('Y-m-d', strtotime($event->end_date . ' +1 day')), // FullCalendar usa end exclusivo
            'allDay' => true,
            'type' => 'event',
            'color' => '#3b82f6', // Azul para el evento principal
            'extendedProps' => [
                'eventId' => $event->id,
                'description' => $event->description,
                'status' => $event->status,
            ],
        ];

        // Tareas
        foreach ($tasks as $task) {
            $committeeColor = null;
            if ($task->committee_id && $committees->contains('id', $task->committee_id)) {
                $committee = $committees->firstWhere('id', $task->committee_id);
                // Usar un color basado en el ID del comité para consistencia
                $colors = ['#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];
                $committeeColor = $colors[$committee->id % count($colors)];
            }

            $calendarEvents[] = [
                'id' => 'task-' . $task->id,
                'title' => $task->title,
                'start' => $task->due_date,
                'allDay' => true,
                'type' => 'task',
                'color' => $committeeColor ?? '#6366f1',
                'textColor' => '#ffffff',
                'extendedProps' => [
                    'taskId' => $task->id,
                    'description' => $task->description,
                    'status' => $task->status,
                    'riskLevel' => $task->risk_level,
                    'committeeId' => $task->committee_id,
                    'committeeName' => $task->committee?->name,
                    'assignedToId' => $task->assigned_to_id,
                    'assignedToName' => $task->assignedTo?->name,
                ],
            ];
        }

        // Incidencias (usar created_at como fecha)
        foreach ($incidents as $incident) {
            $calendarEvents[] = [
                'id' => 'incident-' . $incident->id,
                'title' => '⚠️ ' . ($incident->task ? substr($incident->task->title, 0, 30) : 'Incidencia') . '...',
                'start' => $incident->created_at->format('Y-m-d'),
                'allDay' => true,
                'type' => 'incident',
                'color' => '#ef4444', // Rojo para incidencias
                'textColor' => '#ffffff',
                'extendedProps' => [
                    'incidentId' => $incident->id,
                    'description' => $incident->description,
                    'status' => $incident->status,
                    'taskId' => $incident->task_id,
                    'taskTitle' => $incident->task?->title,
                    'reportedById' => $incident->reported_by_id,
                    'reportedByName' => $incident->reportedBy?->name,
                ],
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'events' => $calendarEvents,
                'event' => [
                    'id' => $event->id,
                    'name' => $event->name,
                    'start_date' => $event->start_date,
                    'end_date' => $event->end_date,
                ],
                'committees' => $committees->map(function ($committee) {
                    return [
                        'id' => $committee->id,
                        'name' => $committee->name,
                    ];
                }),
            ],
        ]);
    }

    /**
     * Obtener eventos finalizados similares para reutilizar datos
     */
    public function getFinishedSimilar(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Event::class);

        $user = Auth::user();
        $searchQuery = $request->get('search', '');

        // Buscar eventos finalizados de la misma institución
        $query = Event::where('status', 'finished')
            ->where('institution_id', $user->institution_id)
            ->with(['coordinator', 'institution', 'committees', 'tasks']);

        // Si hay búsqueda, filtrar por nombre similar
        if ($searchQuery) {
            $query->where('name', 'like', "%{$searchQuery}%");
        }

        $events = $query->orderBy('end_date', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => EventResource::collection($events),
        ]);
    }

    /**
     * Obtener datos de un evento finalizado para reutilizar
     */
    public function getEventDataForReuse(Event $event): JsonResponse
    {
        $this->authorize('view', $event);

        // Verificar que el evento esté finalizado
        if ($event->status !== 'finished') {
            return response()->json([
                'success' => false,
                'message' => 'Solo se pueden reutilizar datos de eventos finalizados.',
            ], 422);
        }

        // Cargar todas las relaciones necesarias
        $event->load([
            'committees.users',
            'tasks' => function ($query) {
                $query->with(['committee', 'assignedTo']);
            },
        ]);

        // Preparar datos para reutilización
        $reusableData = [
            'event' => [
                'name' => $event->name,
                'description' => $event->description,
            ],
            'committees' => $event->committees->map(function ($committee) {
                return [
                    'name' => $committee->name,
                    'members' => $committee->users->map(function ($user) {
                        return [
                            'name' => $user->name,
                            'email' => $user->email,
                        ];
                    })->toArray(),
                ];
            })->toArray(),
            'tasks' => $event->tasks->map(function ($task) {
                return [
                    'title' => $task->title,
                    'description' => $task->description,
                    'committee_name' => $task->committee?->name,
                ];
            })->toArray(),
        ];

        return response()->json([
            'success' => true,
            'data' => $reusableData,
        ]);
    }

    /**
     * Obtener eventos que necesitan finalización
     */
    public function suggestedFinalizations(): JsonResponse
    {
        $this->authorize('viewAny', Event::class);

        $user = Auth::user();

        // Obtener eventos que necesitan finalización (del coordinador)
        $events = Event::where('coordinator_id', $user->id)
            ->where('institution_id', $user->institution_id)
            ->where('status', '!=', 'finished')
            ->where('end_date', '<', now())
            ->with(['coordinator', 'institution'])
            ->orderBy('end_date', 'desc')
            ->get()
            ->filter(function ($event) {
                return $event->shouldSuggestFinalization();
            });

        return response()->json([
            'success' => true,
            'data' => EventResource::collection($events),
        ]);
    }

    /**
     * Confirmar transición de estado del evento
     */
    public function confirmStatusTransition(Event $event, Request $request): JsonResponse
    {
        $this->authorize('update', $event);

        $request->validate([
            'new_status' => 'required|in:finished,inactive,active',
        ]);

        $newStatus = $request->new_status;

        // Validar transiciones permitidas
        $allowedTransitions = [
            'active' => ['inactive', 'finished'],
            'inactive' => ['active'],
            'finished' => [], // No se puede cambiar un evento finalizado
        ];

        if (!in_array($newStatus, $allowedTransitions[$event->status] ?? [])) {
            return response()->json([
                'success' => false,
                'message' => "No se puede cambiar el estado de '{$event->status}' a '{$newStatus}'.",
            ], 422);
        }

        // Validaciones específicas para finalización
        if ($newStatus === 'finished' && !$event->isPostExecution()) {
            return response()->json([
                'success' => false,
                'message' => 'Solo se puede finalizar un evento después de su fecha de fin.',
            ], 422);
        }

        $event->update(['status' => $newStatus]);

        return response()->json([
            'success' => true,
            'message' => "Estado del evento cambiado a '{$newStatus}' exitosamente.",
            'data' => new EventResource($event->load(['coordinator', 'institution'])),
        ]);
    }
}
