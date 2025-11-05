<?php

namespace App\Services;

use App\Models\Alert;
use App\Models\Incident;
use App\Models\TaskProgress;
use App\Models\Notification;
use App\Models\Task;
use App\Models\Event;
use App\Events\EventMetricsUpdated;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    private bool $broadcastingEnabled = false;
    private string $driver;

    public function __construct()
    {
        // Obtener el driver de broadcasting configurado
        $this->driver = config('broadcasting.default', 'pusher');
        
        // Verificar si el broadcasting está habilitado
        $this->broadcastingEnabled = $this->checkBroadcastingAvailability();
        
        if (!$this->broadcastingEnabled) {
            Log::warning("Broadcasting not available. Push notifications will be disabled. Driver: {$this->driver}");
        } else {
            Log::info("Broadcasting enabled with driver: {$this->driver}");
        }
    }

    /**
     * Verificar si el broadcasting está disponible según el driver configurado
     */
    private function checkBroadcastingAvailability(): bool
    {
        switch ($this->driver) {
            case 'pusher':
                $key = config('broadcasting.connections.pusher.key');
                $secret = config('broadcasting.connections.pusher.secret');
                $appId = config('broadcasting.connections.pusher.app_id');
                $cluster = config('broadcasting.connections.pusher.options.cluster');
                return !empty($key) && !empty($secret) && !empty($appId) && !empty($cluster);
                
            case 'redis':
                // Redis siempre está disponible si está configurado (usa la conexión default)
                return config('database.redis.default.host') !== null;
                
            case 'log':
            case 'null':
                // Estos drivers siempre están disponibles
                return true;
                
            case 'ably':
                return !empty(config('broadcasting.connections.ably.key'));
                
            default:
                return false;
        }
    }

    /**
     * Enviar notificación de alerta en tiempo real
     */
    public function sendAlertNotification(Alert $alert): void
    {
        if (!$this->broadcastingEnabled) {
            Log::debug("Broadcasting disabled. Skipping alert notification for user {$alert->user_id}");
            return;
        }

        try {
            // Cargar relaciones si no están cargadas
            if (!$alert->relationLoaded('task')) {
                $alert->load('task');
            }

            // Crear notificación persistente
            $notification = Notification::create([
                'title' => "Alerta {$alert->type}",
                'message' => $alert->message,
                'type' => 'alert',
                'user_id' => $alert->user_id,
                'task_id' => $alert->task_id,
                'alert_id' => $alert->id,
                'is_read' => false,
                'metadata' => [
                    'alert_type' => $alert->type,
                    'task_title' => $alert->task?->title ?? 'Tarea',
                ],
            ]);

            $this->broadcastToUser(
                $alert->user_id,
                'alert.created',
                [
                    'notification' => [
                        'id' => $notification->id,
                        'title' => $notification->title,
                        'type' => $notification->type,
                        'created_at' => $notification->created_at->toISOString(),
                    ],
                    'alert' => [
                        'id' => $alert->id,
                        'message' => $alert->message,
                        'type' => $alert->type,
                        'task_title' => $alert->task->title,
                        'created_at' => $alert->created_at->toISOString(),
                        'is_read' => $alert->is_read,
                    ]
                ]
            );

            Log::info("Alert notification sent to user {$alert->user_id} via {$this->driver}");
        } catch (\Exception $e) {
            Log::error("Failed to send alert notification: " . $e->getMessage(), [
                'user_id' => $alert->user_id,
                'alert_id' => $alert->id,
                'driver' => $this->driver,
                'exception' => $e
            ]);
        }
    }

    /**
     * Enviar notificación de incidente en tiempo real
     * Notifica al coordinador cuando un líder reporta una incidencia
     */
    public function sendIncidentNotification(Incident $incident): void
    {
        try {
            // Cargar relaciones si no están cargadas
            if (!$incident->relationLoaded('task')) {
                $incident->load('task.event', 'task.committee.event', 'reportedBy');
            }

            // Notificar al coordinador del evento
            $event = $incident->task->event ?? $incident->task->committee?->event;
            $coordinatorId = $event?->coordinator_id;
            
            if ($coordinatorId) {
                // Crear notificación persistente (aunque broadcasting esté deshabilitado)
                $notification = Notification::create([
                    'title' => 'Nueva incidencia reportada',
                    'message' => "Incidencia reportada en: {$incident->task->title}",
                    'type' => 'incident',
                    'user_id' => $coordinatorId,
                    'task_id' => $incident->task_id,
                    'incident_id' => $incident->id,
                    'is_read' => false,
                    'metadata' => [
                        'reported_by' => $incident->reportedBy->name,
                        'description' => $incident->description,
                        'status' => $incident->status,
                    ],
                ]);

                // Broadcast en tiempo real si está habilitado
                if ($this->broadcastingEnabled) {
                    $this->broadcastToUser(
                        $coordinatorId,
                        'incident.created',
                        [
                            'notification' => [
                                'id' => $notification->id,
                                'title' => $notification->title,
                                'type' => $notification->type,
                                'created_at' => $notification->created_at->toISOString(),
                            ],
                            'incident' => [
                                'id' => $incident->id,
                                'description' => $incident->description,
                                'status' => $incident->status,
                                'task_title' => $incident->task->title,
                                'reported_by' => $incident->reportedBy->name,
                                'created_at' => $incident->created_at->toISOString(),
                            ]
                        ]
                    );
                }

                Log::info("Incident notification sent to coordinator {$coordinatorId} via {$this->driver}");
            }
        } catch (\Exception $e) {
            Log::error("Failed to send incident notification: " . $e->getMessage(), [
                'incident_id' => $incident->id,
                'driver' => $this->driver,
                'exception' => $e
            ]);
        }
    }

    /**
     * Enviar notificación interna al líder cuando su incidencia está siendo gestionada
     * Flujo 4.6 Opción B: Notificación interna cuando se vincula una tarea de solución
     */
    public function sendIncidentBeingManagedNotification(Incident $incident, Task $solutionTask): void
    {
        try {
            // Cargar relaciones si no están cargadas
            if (!$incident->relationLoaded('task')) {
                $incident->load('task.event', 'task.committee.event', 'reportedBy');
            }
            if (!$solutionTask->relationLoaded('assignedTo')) {
                $solutionTask->load('assignedTo');
            }

            // Verificar que el líder que reportó la incidencia existe
            if (!$incident->reportedBy) {
                Log::warning("Incident {$incident->id} has no reportedBy user");
                return;
            }

            $leaderId = $incident->reported_by_id;
            $originalTask = $incident->task;
            $event = $originalTask->event ?? $originalTask->committee?->event;
            $solutionLeaderName = $solutionTask->assignedTo?->name ?? 'un líder asignado';

            // Crear notificación persistente (notificación interna, sin correo)
            $notification = Notification::create([
                'title' => 'Incidencia en gestión',
                'message' => "Tu incidencia en la tarea '{$originalTask->title}' está siendo gestionada. Se ha asignado una tarea de solución a {$solutionLeaderName}.",
                'type' => 'info',
                'user_id' => $leaderId,
                'task_id' => $originalTask->id,
                'incident_id' => $incident->id,
                'is_read' => false,
                'metadata' => [
                    'incident_description' => $incident->description,
                    'original_task_title' => $originalTask->title,
                    'solution_task_id' => $solutionTask->id,
                    'solution_task_title' => $solutionTask->title,
                    'solution_leader' => $solutionLeaderName,
                    'status' => 'Reported',
                    'event_name' => $event?->name ?? 'Sin evento',
                ],
            ]);

            // Enviar notificación en tiempo real si está habilitado
            if ($this->broadcastingEnabled) {
                $this->broadcastToUser(
                    $leaderId,
                    'incident.managed',
                    [
                        'notification' => [
                            'id' => $notification->id,
                            'title' => $notification->title,
                            'type' => $notification->type,
                            'created_at' => $notification->created_at->toISOString(),
                        ],
                        'incident' => [
                            'id' => $incident->id,
                            'description' => $incident->description,
                            'status' => 'Reported',
                            'task_title' => $originalTask->title,
                            'solution_task_title' => $solutionTask->title,
                            'solution_leader' => $solutionLeaderName,
                        ]
                    ]
                );
            }

            Log::info("Incident being managed notification sent to leader {$leaderId} via {$this->driver}");
        } catch (\Exception $e) {
            Log::error("Failed to send incident being managed notification: " . $e->getMessage(), [
                'incident_id' => $incident->id,
                'solution_task_id' => $solutionTask->id ?? null,
                'driver' => $this->driver,
                'exception' => $e
            ]);
        }
    }

    /**
     * Enviar notificación de incidencia resuelta al líder
     * Flujo 4.6: El Líder de Semillero recibe un correo cuando su incidencia ha sido marcada como Resolved
     */
    public function sendIncidentResolvedNotification(Incident $incident): void
    {
        try {
            // Asegurar que el incidente tiene el ID (puede que no esté persistido)
            if (!$incident->id) {
                Log::error("Cannot send notification: incident has no ID");
                return;
            }

            // Cargar relaciones si no están cargadas (siempre recargar para asegurar datos frescos)
            $incident->load('task.event', 'task.committee.event', 'reportedBy');

            // Verificar que el líder que reportó la incidencia existe
            if (!$incident->reportedBy) {
                Log::error("Incident {$incident->id} has no reportedBy user. reported_by_id: " . ($incident->reported_by_id ?? 'NULL'));
                return;
            }

            $leaderId = $incident->reported_by_id;
            
            if (!$leaderId) {
                Log::error("Incident {$incident->id} has no reported_by_id");
                return;
            }

            $originalTask = $incident->task;
            
            if (!$originalTask) {
                Log::error("Incident {$incident->id} has no task");
                return;
            }

            $event = $originalTask->event ?? $originalTask->committee?->event;
            $taskTitle = $originalTask->title ?? 'Tarea';

            Log::info("Creating notification for resolved incident", [
                'incident_id' => $incident->id,
                'leader_id' => $leaderId,
                'task_id' => $originalTask->id,
                'task_title' => $taskTitle,
            ]);

            // Crear notificación persistente (aunque broadcasting esté deshabilitado)
            $notification = Notification::create([
                'title' => 'Incidencia resuelta',
                'message' => "Tu incidencia en la tarea '{$taskTitle}' ha sido resuelta. Puedes continuar con tu tarea.",
                'type' => 'incident',
                'user_id' => $leaderId,
                'task_id' => $originalTask->id,
                'incident_id' => $incident->id,
                'is_read' => false,
                'metadata' => [
                    'incident_description' => $incident->description,
                    'original_task_title' => $taskTitle,
                    'status' => 'Resolved',
                    'event_name' => $event?->name ?? 'Sin evento',
                ],
            ]);

            Log::info("Notification created in database", [
                'notification_id' => $notification->id,
                'user_id' => $leaderId,
            ]);

            // Enviar notificación en tiempo real si está habilitado
            if ($this->broadcastingEnabled) {
                try {
                    $this->broadcastToUser(
                        $leaderId,
                        'incident.resolved',
                        [
                            'notification' => [
                                'id' => $notification->id,
                                'title' => $notification->title,
                                'type' => $notification->type,
                                'created_at' => $notification->created_at->toISOString(),
                            ],
                            'incident' => [
                                'id' => $incident->id,
                                'description' => $incident->description,
                                'status' => 'Resolved',
                                'task_title' => $taskTitle,
                                'task_status' => $originalTask->status ?? 'N/A',
                                'created_at' => $incident->created_at->toISOString(),
                                'resolved_at' => now()->toISOString(),
                            ]
                        ]
                    );
                    Log::info("Push notification sent to user {$leaderId} via {$this->driver}");
                } catch (\Exception $pushError) {
                    Log::error("Failed to send push notification", [
                        'leader_id' => $leaderId,
                        'error' => $pushError->getMessage(),
                    ]);
                    // No lanzar excepción - la notificación persistente ya está creada
                }
            } else {
                Log::info("Broadcasting disabled, skipping push notification. Notification created in DB.");
            }

            Log::info("Incident resolved notification processed successfully", [
                'incident_id' => $incident->id,
                'leader_id' => $leaderId,
                'notification_id' => $notification->id,
                'driver' => $this->driver,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to send incident resolved notification", [
                'incident_id' => $incident->id,
                'reported_by_id' => $incident->reported_by_id ?? 'NULL',
                'driver' => $this->driver,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            // Re-lanzar para que el código que llama pueda manejarlo
            throw $e;
        }
    }

    /**
     * Enviar notificación de reporte de progreso en tiempo real
     */
    public function sendProgressNotification(TaskProgress $progress): void
    {
        if (!$this->broadcastingEnabled) {
            Log::debug("Broadcasting disabled. Skipping progress notification");
            return;
        }

        try {
            // Cargar relaciones si no están cargadas
            if (!$progress->relationLoaded('task')) {
                $progress->load('task.event', 'task.committee.event', 'user');
            }

            // Notificar al coordinador del evento
            $event = $progress->task->event ?? $progress->task->committee?->event;
            $coordinatorId = $event?->coordinator_id;
            
            if ($coordinatorId) {
                // Crear notificación persistente
                $notification = Notification::create([
                    'title' => 'Nuevo reporte de progreso',
                    'message' => "El líder reportó progreso en: {$progress->task->title}",
                    'type' => 'progress',
                    'user_id' => $coordinatorId,
                    'task_id' => $progress->task_id,
                    'progress_id' => $progress->id,
                    'is_read' => false,
                    'metadata' => [
                        'reported_by' => $progress->user->name,
                        'description' => $progress->description,
                    ],
                ]);

                // Broadcast en tiempo real
                $this->broadcastToUser(
                    $coordinatorId,
                    'progress.updated',
                    [
                        'notification' => [
                            'id' => $notification->id,
                            'title' => $notification->title,
                            'type' => $notification->type,
                            'created_at' => $notification->created_at->toISOString(),
                        ],
                        'progress' => [
                            'id' => $progress->id,
                            'description' => $progress->description,
                            'task_title' => $progress->task->title,
                            'reported_by' => $progress->user->name,
                            'created_at' => $progress->created_at->toISOString(),
                        ]
                    ]
                );

                Log::info("Progress notification sent to coordinator {$coordinatorId} via {$this->driver}");
            }
        } catch (\Exception $e) {
            Log::error("Failed to send progress notification: " . $e->getMessage(), [
                'progress_id' => $progress->id,
                'driver' => $this->driver,
                'exception' => $e
            ]);
        }
    }

    /**
     * Enviar notificación de actualización de tarea en tiempo real
     */
    public function sendTaskUpdateNotification(int $userId, array $taskData): void
    {
        if (!$this->broadcastingEnabled) {
            Log::debug("Broadcasting disabled. Skipping task update notification for user {$userId}");
            return;
        }

        try {
            $this->broadcastToUser(
                $userId,
                'task.updated',
                [
                    'task' => $taskData
                ]
            );

            Log::info("Task update notification sent to user {$userId} via {$this->driver}");
        } catch (\Exception $e) {
            Log::error("Failed to send task update notification: " . $e->getMessage(), [
                'user_id' => $userId,
                'driver' => $this->driver,
                'exception' => $e
            ]);
        }
    }

    /**
     * Enviar notificación general a un usuario
     */
    public function sendGeneralNotification(int $userId, string $event, array $data): void
    {
        if (!$this->broadcastingEnabled) {
            Log::debug("Broadcasting disabled. Skipping general notification for user {$userId}");
            return;
        }

        try {
            $this->broadcastToUser($userId, $event, $data);
            Log::info("General notification sent to user {$userId} via {$this->driver}");
        } catch (\Exception $e) {
            Log::error("Failed to send general notification: " . $e->getMessage(), [
                'user_id' => $userId,
                'event' => $event,
                'driver' => $this->driver,
                'exception' => $e
            ]);
        }
    }

    /**
     * Enviar notificación de asignación a comité (Flujo 1)
     * Un Líder de Semillero recibe una notificación cuando un Coordinador lo asigna a un nuevo comité
     */
    public function sendCommitteeAssignmentNotification(int $leaderId, $committee, $event): void
    {
        try {
            // Crear notificación persistente (aunque broadcasting esté deshabilitado)
            $notification = Notification::create([
                'title' => 'Asignado a comité',
                'message' => "Has sido asignado al comité '{$committee->name}' del evento '{$event->name}'",
                'type' => 'info',
                'user_id' => $leaderId,
                'is_read' => false,
                'metadata' => [
                    'committee_id' => $committee->id,
                    'committee_name' => $committee->name,
                    'event_id' => $event->id,
                    'event_name' => $event->name,
                ],
            ]);

            // Enviar notificación en tiempo real si está habilitado
            if ($this->broadcastingEnabled) {
                $this->broadcastToUser(
                    $leaderId,
                    'committee.assigned',
                    [
                        'notification' => [
                            'id' => $notification->id,
                            'title' => $notification->title,
                            'type' => $notification->type,
                            'created_at' => $notification->created_at->toISOString(),
                        ],
                        'committee' => [
                            'id' => $committee->id,
                            'name' => $committee->name,
                            'event_name' => $event->name,
                        ]
                    ]
                );
            }

            Log::info("Committee assignment notification sent to leader {$leaderId} via {$this->driver}");
        } catch (\Exception $e) {
            Log::error("Failed to send committee assignment notification: " . $e->getMessage(), [
                'leader_id' => $leaderId,
                'committee_id' => $committee->id ?? null,
                'driver' => $this->driver,
                'exception' => $e
            ]);
        }
    }

    /**
     * Enviar notificación de asignación de tarea (Flujo 3)
     * Un Líder de Semillero recibe una notificación cuando se le asigna la responsabilidad de una tarea
     */
    public function sendTaskAssignmentNotification($task, int $leaderId): void
    {
        try {
            // Cargar relaciones si no están cargadas
            if (!$task->relationLoaded('committee')) {
                $task->load('committee.event', 'event');
            }

            $event = $task->event ?? $task->committee?->event;
            $committeeName = $task->committee?->name ?? 'Sin comité';

            // Crear notificación persistente (aunque broadcasting esté deshabilitado)
            $notification = Notification::create([
                'title' => 'Tarea asignada',
                'message' => "Se te ha asignado la tarea '{$task->title}' del comité '{$committeeName}'",
                'type' => 'task_update',
                'user_id' => $leaderId,
                'task_id' => $task->id,
                'is_read' => false,
                'metadata' => [
                    'task_title' => $task->title,
                    'task_status' => $task->status,
                    'due_date' => $task->due_date,
                    'committee_name' => $committeeName,
                    'event_name' => $event?->name ?? 'Sin evento',
                ],
            ]);

            // Enviar notificación en tiempo real si está habilitado
            if ($this->broadcastingEnabled) {
                $this->broadcastToUser(
                    $leaderId,
                    'task.assigned',
                    [
                        'notification' => [
                            'id' => $notification->id,
                            'title' => $notification->title,
                            'type' => $notification->type,
                            'created_at' => $notification->created_at->toISOString(),
                        ],
                        'task' => [
                            'id' => $task->id,
                            'title' => $task->title,
                            'status' => $task->status,
                            'due_date' => $task->due_date,
                            'committee_name' => $committeeName,
                        ]
                    ]
                );
            }

            Log::info("Task assignment notification sent to leader {$leaderId} via {$this->driver}");
        } catch (\Exception $e) {
            Log::error("Failed to send task assignment notification: " . $e->getMessage(), [
                'leader_id' => $leaderId,
                'task_id' => $task->id ?? null,
                'driver' => $this->driver,
                'exception' => $e
            ]);
        }
    }

    /**
     * Calcular y disparar evento de métricas actualizadas para un evento
     */
    public function broadcastEventMetricsUpdated(int $eventId): void
    {
        if (!$this->broadcastingEnabled) {
            return;
        }

        try {
            $event = Event::find($eventId);
            if (!$event) {
                return;
            }

            // Calcular métricas actuales (similar a EventController::statistics)
            $tasksQuery = Task::where('event_id', $eventId);
            $totalTasks = (clone $tasksQuery)->count();
            $completedTasks = (clone $tasksQuery)->where('status', 'Completed')->count();
            $progressPercentage = $totalTasks > 0 
                ? round(($completedTasks / $totalTasks) * 100, 1) 
                : 0.0;

            $activeCommittees = Task::where('event_id', $eventId)
                ->whereNotNull('committee_id')
                ->where('status', '!=', 'Completed')
                ->distinct('committee_id')
                ->count('committee_id');

            $openIncidents = Incident::whereHas('task', function ($q) use ($eventId) {
                $q->where('event_id', $eventId);
            })
                ->where('status', 'Reported')
                ->count();

            $metrics = [
                'progress_percentage' => $progressPercentage,
                'total_tasks' => $totalTasks,
                'completed_tasks' => $completedTasks,
                'active_committees' => $activeCommittees,
                'open_incidents' => $openIncidents,
            ];

            // Disparar evento de broadcast (canal público event-{eventId})
            event(new EventMetricsUpdated($eventId, $metrics));

            Log::info("Event metrics updated broadcast sent for event {$eventId}", [
                'metrics' => $metrics,
                'driver' => $this->driver,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to broadcast event metrics updated: " . $e->getMessage(), [
                'event_id' => $eventId,
                'driver' => $this->driver,
                'exception' => $e,
            ]);
        }
    }

    /**
     * Método helper para enviar notificaciones a un usuario específico
     * Compatible con múltiples drivers (Pusher, Redis, Log, etc.)
     */
    private function broadcastToUser(int $userId, string $event, array $data): void
    {
        $channel = 'user-' . $userId;
        
        switch ($this->driver) {
            case 'pusher':
                // Para Pusher, usar el cliente directamente
                try {
                    $pusher = new \Pusher\Pusher(
                        config('broadcasting.connections.pusher.key'),
                        config('broadcasting.connections.pusher.secret'),
                        config('broadcasting.connections.pusher.app_id'),
                        [
                            'cluster' => config('broadcasting.connections.pusher.options.cluster'),
                            'useTLS' => true
                        ]
                    );
                    $pusher->trigger($channel, $event, $data);
                } catch (\Exception $e) {
                    Log::error("Pusher trigger failed: " . $e->getMessage());
                    throw $e;
                }
                break;
                
            case 'redis':
                // Usar Redis Pub/Sub directamente (alternativa temporal)
                try {
                    $redis = \Illuminate\Support\Facades\Redis::connection();
                    $message = json_encode([
                        'event' => $event,
                        'data' => $data,
                        'channel' => $channel
                    ]);
                    $redis->publish($channel, $message);
                } catch (\Exception $e) {
                    Log::error("Redis publish failed: " . $e->getMessage());
                    throw $e;
                }
                break;
                
            case 'log':
                Log::info("Broadcast [{$channel}] Event: {$event}", $data);
                break;
                
            case 'null':
                // No hacer nada (silencioso)
                break;
                
            case 'ably':
                // Ably usa su propia implementación, pero por ahora logueamos
                Log::info("Ably broadcast [{$channel}] Event: {$event}", $data);
                // TODO: Implementar cliente Ably si se necesita
                break;
                
            default:
                Log::warning("Unknown broadcast driver: {$this->driver}. Using log fallback.");
                Log::info("Broadcast [{$channel}] Event: {$event}", $data);
        }
    }
}
