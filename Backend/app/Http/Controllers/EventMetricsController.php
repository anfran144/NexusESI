<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Task;
use App\Models\TaskProgress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EventMetricsController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api');
    }

    /**
     * Obtener métricas avanzadas por comité
     */
    public function committees(Event $event): JsonResponse
    {
        // Autorización
        $this->authorize('view', $event);

        // Calcular métricas por comité
        $committees = $event->committees()->with(['tasks'])->get();

        $metrics = $committees->map(function ($committee) {
            $tasks = $committee->tasks;
            $totalTasks = $tasks->count();
            $completedTasks = $tasks->where('status', 'Completed')->count();
            $inProgressTasks = $tasks->where('status', 'InProgress')->count();
            $pendingTasks = $tasks->whereNotIn('status', ['Completed', 'InProgress'])->count();
            $delayedTasks = $tasks->where('status', 'Delayed')->count();

            // Miembros activos: usuarios con al menos 1 tarea no completada
            $activeMembers = $tasks
                ->whereNotIn('status', ['Completed'])
                ->pluck('assigned_to_id')
                ->filter()
                ->unique()
                ->count();

            return [
                'committee_id' => $committee->id,
                'committee_name' => $committee->name,
                'total_tasks' => $totalTasks,
                'completed_tasks' => $completedTasks,
                'in_progress_tasks' => $inProgressTasks,
                'pending_tasks' => $pendingTasks,
                'delayed_tasks' => $delayedTasks,
                // Porcentaje sin decimales para métricas generales
                'progress_percentage' => $totalTasks > 0
                    ? (int) round(($completedTasks / $totalTasks) * 100)
                    : 0,
                'active_members' => $activeMembers,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $metrics,
        ]);
    }

    /**
     * Obtener historial de progreso del evento
     */
    public function progressHistory(Event $event, Request $request): JsonResponse
    {
        // Autorización
        $this->authorize('view', $event);

        $days = (int) $request->get('days', 30);
        $startDate = now()->subDays($days)->startOfDay();
        $endDate = now()->endOfDay();

        // Obtener todas las tareas del evento
        $allTasks = Task::where('event_id', $event->id)->get();
        $totalTasks = $allTasks->count();

        // Obtener reportes de progreso en el rango de fechas
        $progressReports = TaskProgress::whereHas('task', function ($query) use ($event) {
            $query->where('event_id', $event->id);
        })
            ->whereBetween('created_at', [$startDate, $endDate])
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(DISTINCT task_id) as tasks_with_progress')
            )
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date')
            ->get();

        // Obtener tareas completadas por fecha
        $completedTasksByDate = Task::where('event_id', $event->id)
            ->where('status', 'Completed')
            ->whereBetween('updated_at', [$startDate, $endDate])
            ->select(
                DB::raw('DATE(updated_at) as date'),
                DB::raw('COUNT(*) as completed_count')
            )
            ->groupBy(DB::raw('DATE(updated_at)'))
            ->get()
            ->keyBy('date');

        // Construir el historial día por día
        $history = [];
        $cumulativeCompleted = Task::where('event_id', $event->id)
            ->where('status', 'Completed')
            ->whereDate('updated_at', '<', $startDate)
            ->count();

        $currentDate = $startDate->copy();
        while ($currentDate <= $endDate) {
            $dateStr = $currentDate->format('Y-m-d');

            // Tareas completadas en este día
            $completedToday = $completedTasksByDate->get($dateStr);
            $completedCount = $completedToday ? (int) $completedToday->completed_count : 0;
            $cumulativeCompleted += $completedCount;

            // Calcular porcentaje de progreso (mantener 1 decimal para historial detallado)
            $progressPercentage = $totalTasks > 0
                ? round(($cumulativeCompleted / $totalTasks) * 100, 1)
                : 0;

            $history[] = [
                'date' => $dateStr,
                'completed_tasks' => $cumulativeCompleted,
                'total_tasks' => $totalTasks,
                'progress_percentage' => $progressPercentage,
            ];

            $currentDate->addDay();
        }

        return response()->json([
            'success' => true,
            'data' => $history,
        ]);
    }

    /**
     * Obtener distribución de carga de trabajo por usuario
     */
    public function workload(Event $event): JsonResponse
    {
        // Autorización
        $this->authorize('view', $event);

        // Obtener todas las tareas del evento con sus usuarios asignados
        $tasks = Task::where('event_id', $event->id)
            ->whereNotNull('assigned_to_id')
            ->with('assignedTo')
            ->get();

        // Agrupar por usuario
        $workloadByUser = $tasks->groupBy('assigned_to_id')->map(function ($userTasks, $userId) {
            $user = $userTasks->first()->assignedTo;
            $totalTasks = $userTasks->count();
            $completedTasks = $userTasks->where('status', 'Completed')->count();
            $pendingTasks = $userTasks->whereNotIn('status', ['Completed'])->count();
            $overdueTasks = $userTasks->filter(function ($task) {
                return $task->due_date && $task->isOverdue();
            })->count();

            return [
                'user_id' => (int) $userId,
                'user_name' => $user->name ?? 'Usuario desconocido',
                'total_tasks' => $totalTasks,
                'completed_tasks' => $completedTasks,
                'pending_tasks' => $pendingTasks,
                'overdue_tasks' => $overdueTasks,
            ];
        })->values();

        return response()->json([
            'success' => true,
            'data' => $workloadByUser,
        ]);
    }

    /**
     * Obtener métricas de alertas críticas por tipo
     */
    public function alerts(Event $event): JsonResponse
    {
        // Autorización
        $this->authorize('view', $event);

        // Obtener alertas del evento (a través de tareas)
        $alerts = \App\Models\Alert::whereHas('task', function ($query) use ($event) {
            $query->where('event_id', $event->id);
        })->get();

        $criticalCount = $alerts->where('type', 'Critical')->count();
        $preventiveCount = $alerts->where('type', 'Preventive')->count();
        $criticalUnreadCount = $alerts->where('type', 'Critical')->where('is_read', false)->count();
        $preventiveUnreadCount = $alerts->where('type', 'Preventive')->where('is_read', false)->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_critical' => $criticalCount,
                'total_preventive' => $preventiveCount,
                'unread_critical' => $criticalUnreadCount,
                'unread_preventive' => $preventiveUnreadCount,
                'total_alerts' => $alerts->count(),
            ],
        ]);
    }

    /**
     * Obtener timeline de hitos importantes del evento
     */
    public function milestones(Event $event): JsonResponse
    {
        // Autorización
        $this->authorize('view', $event);

        $milestones = [];

        // 1. Fecha de inicio del evento
        if ($event->start_date) {
            $milestones[] = [
                'id' => 'event-start',
                'type' => 'event_start',
                'title' => 'Inicio del Evento',
                'description' => "Evento \"{$event->name}\" iniciado",
                'date' => $event->start_date->format('Y-m-d'),
                'timestamp' => $event->start_date->toISOString(),
                'icon' => 'play',
                'color' => 'blue',
            ];
        }

        // 2. Creación del evento
        if ($event->created_at) {
            $milestones[] = [
                'id' => 'event-created',
                'type' => 'event_created',
                'title' => 'Evento Creado',
                'description' => "Evento \"{$event->name}\" creado",
                'date' => $event->created_at->format('Y-m-d'),
                'timestamp' => $event->created_at->toISOString(),
                'icon' => 'plus',
                'color' => 'gray',
            ];
        }

        // 3. Creación de comités (fecha de creación del primer comité)
        $firstCommittee = $event->committees()->orderBy('created_at', 'asc')->first();
        if ($firstCommittee && $firstCommittee->created_at) {
            $committeesCount = $event->committees()->count();
            $milestones[] = [
                'id' => 'first-committee',
                'type' => 'committee_created',
                'title' => 'Primer Comité Creado',
                'description' => "Comité \"{$firstCommittee->name}\" creado",
                'date' => $firstCommittee->created_at->format('Y-m-d'),
                'timestamp' => $firstCommittee->created_at->toISOString(),
                'icon' => 'users',
                'color' => 'green',
                'metadata' => [
                    'committee_id' => $firstCommittee->id,
                    'committee_name' => $firstCommittee->name,
                    'total_committees' => $committeesCount,
                ],
            ];
        }

        // 4. Primera tarea completada (tarea importante)
        $firstCompletedTask = Task::where('event_id', $event->id)
            ->where('status', 'Completed')
            ->orderBy('updated_at', 'asc')
            ->first();
        if ($firstCompletedTask && $firstCompletedTask->updated_at) {
            $milestones[] = [
                'id' => 'first-task-completed',
                'type' => 'task_completed',
                'title' => 'Primera Tarea Completada',
                'description' => "Tarea \"{$firstCompletedTask->title}\" completada",
                'date' => $firstCompletedTask->updated_at->format('Y-m-d'),
                'timestamp' => $firstCompletedTask->updated_at->toISOString(),
                'icon' => 'check-circle',
                'color' => 'green',
                'metadata' => [
                    'task_id' => $firstCompletedTask->id,
                    'task_title' => $firstCompletedTask->title,
                ],
            ];
        }

        // 5. Primera incidencia reportada (sin resolver)
        $firstIncident = \App\Models\Incident::whereHas('task', function ($query) use ($event) {
            $query->where('event_id', $event->id);
        })
            ->where('status', 'Reported')
            ->orderBy('created_at', 'asc')
            ->first();
        if ($firstIncident && $firstIncident->created_at) {
            $milestones[] = [
                'id' => 'first-incident',
                'type' => 'incident_reported',
                'title' => 'Primera Incidencia Reportada',
                'description' => "Incidencia reportada: {$firstIncident->description}",
                'date' => $firstIncident->created_at->format('Y-m-d'),
                'timestamp' => $firstIncident->created_at->toISOString(),
                'icon' => 'alert-triangle',
                'color' => 'red',
                'metadata' => [
                    'incident_id' => $firstIncident->id,
                    'incident_description' => $firstIncident->description,
                ],
            ];
        }

        // 6. Primera alerta crítica
        $firstCriticalAlert = \App\Models\Alert::whereHas('task', function ($query) use ($event) {
            $query->where('event_id', $event->id);
        })
            ->where('type', 'Critical')
            ->orderBy('created_at', 'asc')
            ->first();
        if ($firstCriticalAlert && $firstCriticalAlert->created_at) {
            $milestones[] = [
                'id' => 'first-critical-alert',
                'type' => 'alert_critical',
                'title' => 'Primera Alerta Crítica',
                'description' => $firstCriticalAlert->message,
                'date' => $firstCriticalAlert->created_at->format('Y-m-d'),
                'timestamp' => $firstCriticalAlert->created_at->toISOString(),
                'icon' => 'bell',
                'color' => 'orange',
                'metadata' => [
                    'alert_id' => $firstCriticalAlert->id,
                ],
            ];
        }

        // 7. Fecha de fin del evento (si está configurada)
        if ($event->end_date) {
            $milestones[] = [
                'id' => 'event-end',
                'type' => 'event_end',
                'title' => 'Fin del Evento',
                'description' => "Evento \"{$event->name}\" finalizado",
                'date' => $event->end_date->format('Y-m-d'),
                'timestamp' => $event->end_date->toISOString(),
                'icon' => 'flag',
                'color' => $event->end_date->isPast() ? 'red' : 'blue',
            ];
        }

        // Ordenar por fecha (más antiguo primero)
        usort($milestones, function ($a, $b) {
            return strtotime($a['timestamp']) - strtotime($b['timestamp']);
        });

        return response()->json([
            'success' => true,
            'data' => $milestones,
        ]);
    }
}
