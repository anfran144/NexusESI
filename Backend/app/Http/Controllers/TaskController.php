<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\Committee;
use App\Models\Event;
use App\Models\TaskProgress;
use App\Models\Incident;
use App\Mail\TaskProgressReportMail;
use App\Mail\IncidentResolvedMail;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class TaskController extends Controller
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
        $this->authorize('viewAny', Task::class);

        $user = Auth::user();
        $query = Task::with(['assignedTo', 'committee.event', 'event', 'progress.user', 'incidents.reportedBy']);

        // Filtrar por institución del usuario (a través de evento)
        $query->whereHas('event', function ($q) use ($user) {
            $q->where('institution_id', $user->institution_id);
        });

        // Si es líder de semillero
        if ($user->hasRole('seedbed_leader')) {
            // Si está solicitando tareas sin asignar (para panel de "Tareas del Comité")
            if ($request->filled('assigned_to_id') && $request->assigned_to_id === 'null') {
                // Mostrar solo tareas sin asignar de los comités del usuario
                $committeeIds = $user->committees->pluck('id');
                if ($committeeIds->isEmpty()) {
                    // Si el usuario no tiene comités asignados, no devolver ninguna tarea
                    $query->whereRaw('1 = 0');
                } else {
                    $query->whereIn('committee_id', $committeeIds)
                          ->whereNull('assigned_to_id');
                }
            } else {
                // Por defecto, mostrar solo tareas asignadas a él
                $query->where('assigned_to_id', $user->id);
            }
        } else {
            // Para otros roles, aplicar filtros avanzados
            
            // Filtro por múltiples comités (committee_ids como array JSON o separado por comas)
            if ($request->filled('committee_ids')) {
                $committeeIds = is_array($request->committee_ids) 
                    ? $request->committee_ids 
                    : explode(',', $request->committee_ids);
                $committeeIds = array_filter(array_map('intval', $committeeIds));
                if (!empty($committeeIds)) {
                    $query->whereIn('committee_id', $committeeIds);
                }
            } elseif ($request->filled('committee_id')) {
                // Mantener compatibilidad con filtro único
                $query->where('committee_id', $request->committee_id);
            }

            if ($request->filled('event_id')) {
                $query->where('event_id', $request->event_id);
            }

            // Filtro por múltiples estados (statuses como array JSON o separado por comas)
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

            // Excluir estados específicos (exclude_statuses como array JSON o separado por comas)
            if ($request->filled('exclude_statuses')) {
                $excludeStatuses = is_array($request->exclude_statuses) 
                    ? $request->exclude_statuses 
                    : explode(',', $request->exclude_statuses);
                $excludeStatuses = array_filter($excludeStatuses);
                if (!empty($excludeStatuses)) {
                    $query->whereNotIn('status', $excludeStatuses);
                }
            }

            if ($request->filled('risk_level')) {
                $query->where('risk_level', $request->risk_level);
            }

            if ($request->filled('assigned_to_id')) {
                $query->where('assigned_to_id', $request->assigned_to_id);
            }

            // Filtros por fecha de vencimiento
            if ($request->filled('due_date_from')) {
                $query->whereDate('due_date', '>=', $request->due_date_from);
            }

            if ($request->filled('due_date_to')) {
                $query->whereDate('due_date', '<=', $request->due_date_to);
            }

            // Filtros predefinidos por rango de fechas
            if ($request->filled('date_range')) {
                $now = now();
                switch ($request->date_range) {
                    case 'today':
                        $query->whereDate('due_date', $now->toDateString());
                        break;
                    case 'this-week':
                        $weekStart = $now->copy()->startOfWeek();
                        $weekEnd = $now->copy()->endOfWeek();
                        $query->whereBetween('due_date', [
                            $weekStart->toDateString(),
                            $weekEnd->toDateString()
                        ]);
                        break;
                    case 'this-month':
                        $query->whereMonth('due_date', $now->month)
                              ->whereYear('due_date', $now->year);
                        break;
                    case 'last-week':
                        $lastWeekStart = $now->copy()->subWeek()->startOfWeek();
                        $lastWeekEnd = $now->copy()->subWeek()->endOfWeek();
                        $query->whereBetween('due_date', [
                            $lastWeekStart->toDateString(),
                            $lastWeekEnd->toDateString()
                        ]);
                        break;
                    case 'last-month':
                        $lastMonth = $now->copy()->subMonth();
                        $query->whereMonth('due_date', $lastMonth->month)
                              ->whereYear('due_date', $lastMonth->year);
                        break;
                    case 'overdue':
                        $query->whereDate('due_date', '<', $now->toDateString())
                              ->where('status', '!=', 'Completed');
                        break;
                }
            }
        }

        $tasks = $query->orderBy('due_date', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $tasks,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Task::class);

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'due_date' => 'nullable|date',
            'event_id' => 'required_without:committee_id|exists:events,id',
            'committee_id' => 'nullable|exists:committees,id',
        ]);

        // Obtener el evento
        if ($request->filled('committee_id')) {
            // Si hay committee_id, obtener el evento desde el comité
            $committee = Committee::with('event')->findOrFail($request->committee_id);
            $event = $committee->event;
            // Asegurar que event_id coincida si se proporcionó
            if ($request->filled('event_id') && $request->event_id != $event->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'El comité no pertenece al evento especificado',
                ], 422);
            }
        } else {
            // Si no hay committee_id, debe haber event_id
            $event = Event::findOrFail($request->event_id);
        }

        // Validar que el evento permita crear tareas
        if (!$event->canPerformAction('manage_tasks')) {
            return response()->json([
                'success' => false,
                'message' => 'No se pueden crear tareas en este estado del evento. Solo se permite durante la fase de planificación.',
            ], 422);
        }

        // Validar que la fecha esté dentro del rango del evento (solo si se proporciona)
        if ($request->filled('due_date')) {
            $request->validate([
                'due_date' => "after_or_equal:{$event->start_date}|before_or_equal:{$event->end_date}",
            ]);
        }

        // Validar que no se creen tareas después de la fecha de fin
        if (now()->greaterThan($event->end_date)) {
            return response()->json([
                'success' => false,
                'message' => 'No se pueden crear tareas después de la fecha de finalización del evento.',
            ], 422);
        }

        // Crear tarea con risk_level inicial
        $task = Task::create([
            'title' => $request->title,
            'description' => $request->description,
            'due_date' => $request->due_date,
            'event_id' => $event->id,
            'committee_id' => $request->committee_id,
            'status' => 'Pending',
            'risk_level' => $this->calculateRiskLevel($request->due_date),
        ]);

        return response()->json([
            'success' => true,
            'data' => $task->load(['assignedTo', 'committee.event', 'event']),
            'message' => 'Tarea creada exitosamente',
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Task $task): JsonResponse
    {
        $this->authorize('view', $task);

        return response()->json([
            'success' => true,
            'data' => $task->load(['assignedTo', 'committee.event', 'event', 'progress.user', 'incidents.reportedBy']),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Task $task): JsonResponse
    {
        $this->authorize('update', $task);

        // Obtener el evento (puede venir de committee o directamente de event)
        $event = $task->event ?? $task->committee?->event;
        
        if (!$event) {
            return response()->json([
                'success' => false,
                'message' => 'No se pudo encontrar el evento asociado a la tarea',
            ], 404);
        }

        // Validar que el evento permita modificar tareas
        $hasStructuralChanges = $request->has('title') || $request->has('description') || $request->has('due_date') || $request->has('committee_id');
        
        if ($hasStructuralChanges && !$event->canPerformAction('manage_tasks')) {
            return response()->json([
                'success' => false,
                'message' => 'No se pueden modificar tareas en este estado del evento. Solo se permite durante la fase de planificación.',
            ], 422);
        }

        // Validar que el evento permita ejecutar tareas (cambios de estado)
        if ($request->has('status') && !$event->canPerformAction('execute_tasks')) {
            return response()->json([
                'success' => false,
                'message' => 'No se pueden cambiar estados de tareas en este estado del evento. Solo se permite durante la fase de ejecución.',
            ], 422);
        }

        $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string',
            'due_date' => "sometimes|required|date|after_or_equal:{$event->start_date}|before_or_equal:{$event->end_date}",
            'status' => 'sometimes|required|in:Pending,InProgress,Completed,Delayed,Paused',
            'committee_id' => 'nullable|exists:committees,id',
        ]);

        $updateData = $request->only(['title', 'description', 'due_date', 'status', 'committee_id']);
        
        // Validar que si se asigna un committee_id, pertenezca al mismo evento
        if ($request->has('committee_id') && $request->committee_id) {
            $committee = Committee::findOrFail($request->committee_id);
            if ($committee->event_id != $event->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'El comité no pertenece al evento de la tarea',
                ], 422);
            }
        }

        $task->update($updateData);

        // Recalcular risk_level si cambió la fecha
        if ($request->has('due_date')) {
            $task->update(['risk_level' => $this->calculateRiskLevel($request->due_date)]);
        }

        // Disparar evento de métricas actualizadas
        $event = $task->event ?? $task->committee?->event;
        if ($event) {
            try {
                app(NotificationService::class)->broadcastEventMetricsUpdated($event->id);
            } catch (\Exception $e) {
                Log::error("Failed to broadcast event metrics after task update: " . $e->getMessage());
            }
        }

        return response()->json([
            'success' => true,
            'data' => $task->load(['assignedTo', 'committee.event', 'event']),
            'message' => 'Tarea actualizada exitosamente',
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Task $task): JsonResponse
    {
        $this->authorize('delete', $task);

        $task->delete();

        return response()->json([
            'success' => true,
            'message' => 'Tarea eliminada exitosamente',
        ]);
    }

    /**
     * Asignar tarea a un usuario
     */
    public function assign(Request $request, Task $task): JsonResponse
    {
        $this->authorize('assign', $task);

        $request->validate([
            'assigned_to_id' => 'required|exists:users,id',
        ]);

        $user = Auth::user();

        // Si es líder de semillero, solo puede asignarse a sí mismo
        if ($user->hasRole('seedbed_leader')) {
            if ($request->assigned_to_id != $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Como líder de semillero, solo puedes asignarte tareas a ti mismo',
                ], 403);
            }

            // Verificar que la tarea pertenece a uno de sus comités y está sin asignar
            $userCommitteeIds = $user->committees->pluck('id')->toArray();
            if (!$task->committee_id || !in_array($task->committee_id, $userCommitteeIds)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Esta tarea no pertenece a ninguno de tus comités',
                ], 403);
            }

            if ($task->assigned_to_id !== null) {
                return response()->json([
                    'success' => false,
                    'message' => 'Esta tarea ya está asignada',
                ], 422);
            }
        }

        // Actualizar asignación y cambiar estado a InProgress cuando se asigna
        $task->update([
            'assigned_to_id' => $request->assigned_to_id,
            'status' => 'InProgress',
        ]);

        // Cargar relaciones necesarias
        $task->load(['assignedTo', 'committee.event', 'event']);

        // Disparar evento de métricas actualizadas
        $event = $task->event ?? $task->committee?->event;
        if ($event) {
            try {
                app(NotificationService::class)->broadcastEventMetricsUpdated($event->id);
            } catch (\Exception $e) {
                Log::error("Failed to broadcast event metrics after task assignment: " . $e->getMessage());
            }
        }

        // Enviar notificación al líder cuando una tarea es asignada (Flujo 3)
        try {
            app(NotificationService::class)->sendTaskAssignmentNotification(
                $task,
                $request->assigned_to_id
            );
        } catch (\Exception $e) {
            Log::error("Failed to send task assignment notification: " . $e->getMessage(), [
                'leader_id' => $request->assigned_to_id,
                'task_id' => $task->id,
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $task,
            'message' => 'Tarea asignada exitosamente',
        ]);
    }

    /**
     * Marcar tarea como completada
     */
    public function complete(Task $task): JsonResponse
    {
        $this->authorize('complete', $task);

        $task->update(['status' => 'Completed']);

        // Detectar si esta tarea es una tarea de solución (solution_task)
        // Buscar incidencias que tengan esta tarea como solution_task_id
        $incidents = Incident::with(['task', 'reportedBy'])
            ->where('solution_task_id', $task->id)
            ->where('status', 'Reported')
            ->get();

        if ($incidents->count() > 0) {
            foreach ($incidents as $incident) {
                // Resolver la incidencia automáticamente
                $incident->update(['status' => 'Resolved']);
                
                // Refrescar el incidente para obtener datos actualizados
                $incident->refresh();
                
                // Cargar todas las relaciones necesarias antes de continuar
                $incident->load('task.event', 'task.committee.event', 'reportedBy');

                // Verificar que tenemos los datos necesarios
                if (!$incident->reportedBy) {
                    Log::error("Incident {$incident->id} has no reportedBy user. reported_by_id: " . ($incident->reported_by_id ?? 'NULL'));
                }

                // Actualizar la tarea original cuando se resuelve automáticamente
                $originalTask = $incident->task;
                
                // Nota: La notificación debe enviarse SIEMPRE que se resuelva una incidencia,
                // independientemente del estado de la tarea. La condición de Paused solo afecta
                // si se debe cambiar el estado de la tarea.
                if ($originalTask) {
                    // Si la tarea está pausada, reactivarla
                    if ($originalTask->status === 'Paused') {
                        // Determinar si la tarea está retrasada
                        $newStatus = $originalTask->due_date < now()->toDateString() 
                            ? 'Delayed' 
                            : 'InProgress';
                        
                        $originalTask->update(['status' => $newStatus]);
                    }

                    // Notificar al líder original que su incidencia ha sido resuelta
                    // Esto debe hacerse SIEMPRE cuando se resuelve una incidencia
                    try {
                        // Verificar datos antes de enviar
                        $reportedById = $incident->reported_by_id;
                        $reportedBy = $incident->reportedBy;
                        
                        Log::info("Attempting to send notification for auto-resolved incident", [
                            'incident_id' => $incident->id,
                            'solution_task_id' => $task->id,
                            'reported_by_id' => $reportedById,
                            'has_reportedBy' => $reportedBy ? 'yes' : 'no',
                            'reportedBy_email' => $reportedBy?->email ?? 'N/A',
                            'task_title' => $originalTask->title ?? 'N/A',
                        ]);

                        if (!$reportedBy) {
                            Log::error("Cannot send notification: reportedBy is null for incident {$incident->id}");
                            throw new \Exception("reportedBy is null for incident {$incident->id}");
                        }

                        if (!$reportedBy->email) {
                            Log::error("Cannot send notification: reportedBy has no email for incident {$incident->id}");
                            throw new \Exception("reportedBy has no email for incident {$incident->id}");
                        }

                        // Enviar correo de notificación (usando cola)
                        Mail::to($reportedBy->email)->queue(new IncidentResolvedMail($incident));
                        Log::info("Email queued for auto-resolved incident to {$reportedBy->email}");
                        
                        // Enviar notificación en tiempo real usando NotificationService
                        app(NotificationService::class)->sendIncidentResolvedNotification($incident);
                        
                        Log::info("Incident {$incident->id} automatically resolved after solution task {$task->id} was completed. Notification sent to leader {$reportedById}");
                    } catch (\Exception $e) {
                        Log::error("Failed to send notification after automatic incident resolution", [
                            'incident_id' => $incident->id,
                            'task_id' => $task->id,
                            'error' => $e->getMessage(),
                            'trace' => $e->getTraceAsString(),
                        ]);
                    }
                } else {
                    Log::error("Cannot send notification: originalTask is null for incident {$incident->id}");
                }
            }
        }

        // Disparar evento de métricas actualizadas
        $event = $task->event ?? $task->committee?->event;
        if ($event) {
            try {
                app(NotificationService::class)->broadcastEventMetricsUpdated($event->id);
            } catch (\Exception $e) {
                Log::error("Failed to broadcast event metrics after task completion: " . $e->getMessage());
            }
        }

        return response()->json([
            'success' => true,
            'data' => $task->load(['assignedTo', 'committee.event', 'event']),
            'message' => 'Tarea marcada como completada',
        ]);
    }

    /**
     * Reportar progreso de la tarea
     */
    public function reportProgress(Request $request, Task $task): JsonResponse
    {
        $this->authorize('reportProgress', $task);

        $request->validate([
            'description' => 'required|string',
            'file' => 'nullable|file|max:10240', // 10MB max
        ]);

        $filePath = null;
        $fileName = null;

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $fileName = $file->getClientOriginalName();
            $filePath = $file->store('task-progress', 'public');
        }

        $progress = $task->progress()->create([
            'description' => $request->description,
            'file_name' => $fileName,
            'file_path' => $filePath,
            'user_id' => Auth::id(),
        ]);

        // Enviar email de notificación del reporte de progreso (usando cola)
        try {
            // Enviar al coordinador del evento (obtener desde event o committee)
            $event = $task->event ?? $task->committee?->event;
            if ($event && $event->coordinator && $event->coordinator->email) {
                Mail::to($event->coordinator->email)->queue(new TaskProgressReportMail($task, $progress));
            }
        } catch (\Exception $e) {
            \Log::error("Failed to queue progress report email: " . $e->getMessage());
        }

        // Enviar notificación en tiempo real
        try {
            app(NotificationService::class)->sendProgressNotification($progress);
        } catch (\Exception $e) {
            \Log::error("Failed to send real-time progress notification: " . $e->getMessage());
        }

        // Disparar evento de métricas actualizadas (aunque no cambien las métricas, puede haber cambios en el historial)
        $event = $task->event ?? $task->committee?->event;
        if ($event) {
            try {
                app(NotificationService::class)->broadcastEventMetricsUpdated($event->id);
            } catch (\Exception $e) {
                \Log::error("Failed to broadcast event metrics after progress report: " . $e->getMessage());
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Progreso reportado exitosamente',
        ]);
    }

    /**
     * Calcular el nivel de riesgo basado en la fecha límite
     * Según NexusEsi.md:
     * - Riesgo Bajo (Low): Más de 5 días
     * - Riesgo Medio (Medium): Entre 2 y 5 días
     * - Riesgo Alto (High): Menos de 2 días o vencida
     */
    private function calculateRiskLevel(string $dueDate): string
    {
        $daysUntilDue = now()->diffInDays($dueDate, false);
        
        // Riesgo Alto: Fecha vencida (negativo)
        if ($daysUntilDue < 0) return 'High';
        
        // Riesgo Medio: Entre 2 y 5 días (inclusive)
        if ($daysUntilDue >= 2 && $daysUntilDue <= 5) return 'Medium';
        
        // Riesgo Bajo: Más de 5 días
        return 'Low';
    }
}
