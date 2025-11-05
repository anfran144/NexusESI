<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Incident;
use App\Models\Task;
use App\Mail\IncidentReportMail;
use App\Mail\IncidentResolvedMail;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class IncidentController extends Controller
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
        
        $query = Incident::with(['task.event', 'task.committee.event', 'reportedBy', 'solutionTask']);

        // Filtrar por institución del usuario
        $query->where(function ($q) use ($user) {
            // Verificar evento directamente o a través del comité
            $q->whereHas('task.event', function ($subQ) use ($user) {
                $subQ->where('institution_id', $user->institution_id);
            })->orWhereHas('task.committee.event', function ($subQ) use ($user) {
                $subQ->where('institution_id', $user->institution_id);
            });
        });

        // Filtros opcionales avanzados
        
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

        // Excluir estados específicos
        if ($request->filled('exclude_statuses')) {
            $excludeStatuses = is_array($request->exclude_statuses) 
                ? $request->exclude_statuses 
                : explode(',', $request->exclude_statuses);
            $excludeStatuses = array_filter($excludeStatuses);
            if (!empty($excludeStatuses)) {
                $query->whereNotIn('status', $excludeStatuses);
            }
        }

        // Filtro por múltiples tareas
        if ($request->filled('task_ids')) {
            $taskIds = is_array($request->task_ids) 
                ? $request->task_ids 
                : explode(',', $request->task_ids);
            $taskIds = array_filter(array_map('intval', $taskIds));
            if (!empty($taskIds)) {
                $query->whereIn('task_id', $taskIds);
            }
        } elseif ($request->filled('task_id')) {
            // Mantener compatibilidad con filtro único
            $query->where('task_id', $request->task_id);
        }

        // Filtros por fecha de creación
        if ($request->filled('created_from')) {
            $query->whereDate('created_at', '>=', $request->created_from);
        }

        if ($request->filled('created_to')) {
            $query->whereDate('created_at', '<=', $request->created_to);
        }

        // Filtros predefinidos por rango de fechas
        if ($request->filled('date_range')) {
            $now = now();
            switch ($request->date_range) {
                case 'today':
                    $query->whereDate('created_at', $now->toDateString());
                    break;
                case 'this-week':
                    $weekStart = $now->copy()->startOfWeek();
                    $weekEnd = $now->copy()->endOfWeek();
                    $query->whereBetween('created_at', [
                        $weekStart->toDateString(),
                        $weekEnd->toDateString()
                    ]);
                    break;
                case 'this-month':
                    $query->whereMonth('created_at', $now->month)
                          ->whereYear('created_at', $now->year);
                    break;
                case 'last-week':
                    $lastWeekStart = $now->copy()->subWeek()->startOfWeek();
                    $lastWeekEnd = $now->copy()->subWeek()->endOfWeek();
                    $query->whereBetween('created_at', [
                        $lastWeekStart->toDateString(),
                        $lastWeekEnd->toDateString()
                    ]);
                    break;
                case 'last-month':
                    $lastMonth = $now->copy()->subMonth();
                    $query->whereMonth('created_at', $lastMonth->month)
                          ->whereYear('created_at', $lastMonth->year);
                    break;
            }
        }

        // Filtro por múltiples comités (a través de tareas)
        if ($request->filled('committee_ids')) {
            $committeeIds = is_array($request->committee_ids) 
                ? $request->committee_ids 
                : explode(',', $request->committee_ids);
            $committeeIds = array_filter(array_map('intval', $committeeIds));
            if (!empty($committeeIds)) {
                $query->whereHas('task', function ($q) use ($committeeIds) {
                    $q->whereIn('committee_id', $committeeIds);
                });
            }
        }

        // Si es líder de semillero, solo ver incidencias de sus tareas
        if ($user->hasRole('seedbed_leader')) {
            $query->whereHas('task', function ($qwi) use ($user) {
                $qwi->where('assigned_to_id', $user->id);
            });
        }

        $incidents = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $incidents,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'description' => 'required|string',
            'task_id' => 'required|exists:tasks,id',
            'file' => 'nullable|file|max:10240', // 10MB max
        ]);

        // Verificar que el usuario puede reportar incidencias en esta tarea
        $task = Task::with('event', 'committee.event')->findOrFail($request->task_id);
        $user = Auth::user();

        // Solo el usuario asignado a la tarea puede reportar incidencias
        if ($task->assigned_to_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Solo el usuario asignado a la tarea puede reportar incidencias',
            ], 403);
        }

        $filePath = null;
        $fileName = null;

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $fileName = $file->getClientOriginalName();
            $filePath = $file->store('incidents', 'public');
        }

        $incident = Incident::create([
            'description' => $request->description,
            'task_id' => $request->task_id,
            'reported_by_id' => $user->id,
            'file_name' => $fileName,
            'file_path' => $filePath,
            'status' => 'Reported',
        ]);

        // Enviar email de notificación del incidente (usando cola)
        try {
            // Enviar al coordinador del evento
            $event = $task->event ?? $task->committee?->event;
            if ($event && $event->coordinator && $event->coordinator->email) {
                Mail::to($event->coordinator->email)->queue(new IncidentReportMail($incident));
            }
        } catch (\Exception $e) {
            \Log::error("Failed to queue incident report email: " . $e->getMessage());
        }

        // Enviar notificación en tiempo real
        try {
            app(NotificationService::class)->sendIncidentNotification($incident);
        } catch (\Exception $e) {
            \Log::error("Failed to send real-time incident notification: " . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'data' => $incident->load(['task.event', 'task.committee.event', 'reportedBy']),
            'message' => 'Incidencia reportada exitosamente',
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Incident $incident): JsonResponse
    {
        $user = Auth::user();

        // Verificar que el usuario puede ver esta incidencia
        $event = $incident->task->event ?? $incident->task->committee?->event;
        if (!$event || $event->institution_id !== $user->institution_id) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para ver esta incidencia',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $incident->load(['task.event', 'task.committee.event', 'reportedBy', 'solutionTask']),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Incident $incident): JsonResponse
    {
        $user = Auth::user();

        // Solo coordinadores pueden resolver incidencias
        if (!$user->hasPermissionTo('incidents.resolve')) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para resolver incidencias',
            ], 403);
        }

        // Verificar que la incidencia pertenece a la institución del usuario
        $event = $incident->task->event ?? $incident->task->committee?->event;
        if (!$event || $event->institution_id !== $user->institution_id) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para modificar esta incidencia',
            ], 403);
        }

        $request->validate([
            'status' => 'sometimes|required|in:Reported,Resolved',
            'solution_task_id' => 'nullable|exists:tasks,id',
        ]);

        $incident->update($request->only(['status', 'solution_task_id']));

        return response()->json([
            'success' => true,
            'data' => $incident->load(['task.event', 'task.committee.event', 'reportedBy', 'solutionTask']),
            'message' => 'Incidencia actualizada exitosamente',
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Incident $incident): JsonResponse
    {
        $user = Auth::user();

        // Solo coordinadores pueden eliminar incidencias
        if (!$user->hasPermissionTo('incidents.resolve')) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para eliminar incidencias',
            ], 403);
        }

        // Verificar que la incidencia pertenece a la institución del usuario
        $event = $incident->task->event ?? $incident->task->committee?->event;
        if (!$event || $event->institution_id !== $user->institution_id) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para eliminar esta incidencia',
            ], 403);
        }

        $incident->delete();

        return response()->json([
            'success' => true,
            'message' => 'Incidencia eliminada exitosamente',
        ]);
    }

    /**
     * Resolver incidencia
     */
    public function resolve(Request $request, Incident $incident): JsonResponse
    {
        $user = Auth::user();

        // Solo coordinadores pueden resolver incidencias
        if (!$user->hasPermissionTo('incidents.resolve')) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para resolver incidencias',
            ], 403);
        }

        // Verificar que la incidencia pertenece a la institución del usuario
        $event = $incident->task->event ?? $incident->task->committee?->event;
        if (!$event || $event->institution_id !== $user->institution_id) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para resolver esta incidencia',
            ], 403);
        }

        $request->validate([
            'solution_task_id' => 'nullable|exists:tasks,id',
        ]);

        // Si se proporciona solution_task_id, solo vincular la tarea pero NO resolver la incidencia aún
        // La incidencia se resolverá automáticamente cuando se complete la tarea de solución
        if ($request->solution_task_id) {
            $incident->update([
                'solution_task_id' => $request->solution_task_id,
                // NO cambiar el status - permanece como 'Reported' hasta que se complete la tarea de solución
            ]);

            // Cargar la tarea de solución y relaciones necesarias
            $solutionTask = Task::with('assignedTo')->findOrFail($request->solution_task_id);
            
            // Notificar al líder original que su incidencia está siendo gestionada (Flujo 4.6 Opción B)
            try {
                $incident->load('task.event', 'task.committee.event', 'reportedBy');
                
                if ($incident->reportedBy) {
                    // Enviar notificación interna al líder (sin correo, solo notificación en sistema)
                    app(NotificationService::class)->sendIncidentBeingManagedNotification($incident, $solutionTask);
                    
                    Log::info("Incident {$incident->id} linked to solution task {$request->solution_task_id}. Internal notification sent to leader {$incident->reported_by_id}");
                }
            } catch (\Exception $e) {
                Log::error("Failed to send incident being managed notification: " . $e->getMessage(), [
                    'incident_id' => $incident->id,
                    'solution_task_id' => $request->solution_task_id,
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => $incident->load(['task.event', 'task.committee.event', 'reportedBy', 'solutionTask']),
                'message' => 'Tarea de solución vinculada exitosamente. La incidencia se resolverá automáticamente cuando se complete la tarea.',
            ]);
        }

        // Si NO se proporciona solution_task_id, resolver directamente
        $incident->update([
            'status' => 'Resolved',
        ]);

        // Refrescar el incidente para obtener datos actualizados
        $incident->refresh();
        
        // Cargar todas las relaciones necesarias antes de continuar
        $incident->load('task.event', 'task.committee.event', 'reportedBy');

        // Verificar que tenemos los datos necesarios
        if (!$incident->reportedBy) {
            Log::error("Incident {$incident->id} has no reportedBy user. reported_by_id: " . ($incident->reported_by_id ?? 'NULL'));
        }

        // Actualizar la tarea original cuando se resuelve directamente
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
                
                Log::info("Attempting to send notification for resolved incident", [
                    'incident_id' => $incident->id,
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
                Log::info("Email queued for incident resolution to {$reportedBy->email}");
                
                // Enviar notificación en tiempo real usando NotificationService
                app(NotificationService::class)->sendIncidentResolvedNotification($incident);
                
                Log::info("Incident {$incident->id} resolved directly. Notification sent to leader {$reportedById}");
            } catch (\Exception $e) {
                Log::error("Failed to send notification after incident resolution", [
                    'incident_id' => $incident->id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }
        } else {
            Log::error("Cannot send notification: originalTask is null for incident {$incident->id}");
        }

        return response()->json([
            'success' => true,
            'data' => $incident->load(['task.event', 'task.committee.event', 'reportedBy', 'solutionTask']),
            'message' => 'Incidencia resuelta exitosamente',
        ]);
    }
}
