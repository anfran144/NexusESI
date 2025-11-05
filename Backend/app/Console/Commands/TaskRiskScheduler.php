<?php

namespace App\Console\Commands;

use App\Models\Task;
use App\Models\Alert;
use App\Models\Event;
use App\Mail\TaskAlertMail;
use App\Services\NotificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class TaskRiskScheduler extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tasks:calculate-risks';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Calcula automáticamente los niveles de riesgo de las tareas y genera alertas';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🚀 Iniciando cálculo de riesgos de tareas...');

        $updatedTasks = 0;
        $generatedAlerts = 0;

        // Obtener todas las tareas activas
        $tasks = Task::with(['assignedTo', 'committee.event', 'event.coordinator'])
            ->where('status', '!=', 'Completed')
            ->get();

        foreach ($tasks as $task) {
            $oldRiskLevel = $task->risk_level;
            $newRiskLevel = $this->calculateRiskLevel($task->due_date);
            
            // Actualizar nivel de riesgo si cambió
            if ($oldRiskLevel !== $newRiskLevel) {
                $task->update(['risk_level' => $newRiskLevel]);
                $updatedTasks++;
                
                $this->line("📝 Tarea '{$task->title}' - Riesgo actualizado: {$oldRiskLevel} → {$newRiskLevel}");

                // Si el riesgo cambió a High, cambiar el estado a Delayed
                if ($newRiskLevel === 'High' && $task->status !== 'Delayed' && $task->status !== 'Paused') {
                    $task->update(['status' => 'Delayed']);
                    $this->line("⚠️  Tarea '{$task->title}' marcada como Delayed debido a riesgo alto");
                }
            }

            // Generar alertas según el nivel de riesgo
            $alertsGenerated = $this->generateAlerts($task, $newRiskLevel);
            $generatedAlerts += $alertsGenerated;
        }

        // Verificar eventos que han terminado su fase de planificación
        $this->handleFinishedEvents();

        $this->info("✅ Proceso completado:");
        $this->info("   - Tareas actualizadas: {$updatedTasks}");
        $this->info("   - Alertas generadas: {$generatedAlerts}");

        Log::info('TaskRiskScheduler ejecutado', [
            'updated_tasks' => $updatedTasks,
            'generated_alerts' => $generatedAlerts,
            'timestamp' => now(),
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
        
        // Riesgo Alto: Menos de 2 días (pero no vencida)
        if ($daysUntilDue < 2) return 'High';
        
        // Riesgo Bajo: Más de 5 días
        return 'Low';
    }

    /**
     * Generar alertas según el nivel de riesgo
     */
    private function generateAlerts(Task $task, string $riskLevel): int
    {
        $alertsGenerated = 0;
        $now = now();

        // Alertas preventivas (entre 2 y 5 días)
        if ($riskLevel === 'Medium' && $this->shouldGeneratePreventiveAlert($task)) {
            $daysRemaining = now()->diffInDays($task->due_date, false);
            $this->createAlert(
                $task,
                $task->assignedTo,
                'Preventive',
                "⚠️ Tarea '{$task->title}' se acerca a su fecha límite ({$daysRemaining} días restantes)"
            );
            $alertsGenerated++;
        }

        // Alertas críticas (vencidas)
        // Según NexusEsi.md: El Líder responsable Y el Coordinador reciben un correo cuando una tarea ha vencido
        if ($riskLevel === 'High') {
            $event = $task->event ?? $task->committee?->event;
            
            // Verificar si debemos generar alertas para el líder
            $shouldAlertLeader = $task->assignedTo && $this->shouldGenerateCriticalAlertForUser($task, $task->assignedTo->id);
            
            // Verificar si debemos generar alertas para el coordinador
            $shouldAlertCoordinator = $event && $event->coordinator && $this->shouldGenerateCriticalAlertForUser($task, $event->coordinator->id);
            
            // Notificar al líder responsable
            if ($shouldAlertLeader) {
                $this->createAlert(
                    $task,
                    $task->assignedTo,
                    'Critical',
                    "🚨 Tarea '{$task->title}' está vencida y requiere atención inmediata"
                );
                $alertsGenerated++;
            }

            // También notificar al coordinador del evento
            if ($shouldAlertCoordinator) {
                $message = $task->assignedTo
                    ? "🚨 Tarea vencida: '{$task->title}' asignada a {$task->assignedTo->name} requiere atención inmediata"
                    : "🚨 Tarea vencida sin asignar: '{$task->title}' requiere atención inmediata";
                    
                $this->createAlert(
                    $task,
                    $event->coordinator,
                    'Critical',
                    $message
                );
                $alertsGenerated++;
            }
        }

        return $alertsGenerated;
    }

    /**
     * Verificar si se debe generar alerta preventiva
     */
    private function shouldGeneratePreventiveAlert(Task $task): bool
    {
        // Solo generar una alerta preventiva por día
        return !Alert::where('task_id', $task->id)
            ->where('type', 'Preventive')
            ->whereDate('created_at', now()->toDateString())
            ->exists();
    }

    /**
     * Verificar si se debe generar alerta crítica
     * @deprecated Usar shouldGenerateCriticalAlertForUser en su lugar
     */
    private function shouldGenerateCriticalAlert(Task $task): bool
    {
        // Solo generar una alerta crítica por día para la tarea
        return !Alert::where('task_id', $task->id)
            ->where('type', 'Critical')
            ->whereDate('created_at', now()->toDateString())
            ->exists();
    }

    /**
     * Verificar si se debe generar alerta crítica para un usuario específico
     */
    private function shouldGenerateCriticalAlertForUser(Task $task, int $userId): bool
    {
        // Solo generar una alerta crítica por día por usuario y tarea
        return !Alert::where('task_id', $task->id)
            ->where('type', 'Critical')
            ->where('user_id', $userId)
            ->whereDate('created_at', now()->toDateString())
            ->exists();
    }

    /**
     * Crear una alerta
     */
    private function createAlert(Task $task, $user, string $type, string $message): void
    {
        if ($user) {
            $alert = Alert::create([
                'message' => $message,
                'type' => $type,
                'task_id' => $task->id,
                'user_id' => $user->id,
                'is_read' => false,
            ]);

            // Enviar email de alerta (usando cola)
            if ($user->email) {
                try {
                    Mail::to($user->email)->queue(new TaskAlertMail($alert));
                    $this->info("Email alert queued to: {$user->email}");
                } catch (\Exception $e) {
                    Log::error("Failed to queue alert email: " . $e->getMessage());
                    $this->error("Failed to queue alert email to: {$user->email}");
                }
            }

            // Enviar notificación en tiempo real
            try {
                app(NotificationService::class)->sendAlertNotification($alert);
                $this->info("Real-time alert notification sent to user: {$user->id}");
            } catch (\Exception $e) {
                Log::error("Failed to send real-time alert notification: " . $e->getMessage());
            }
        }
    }

    /**
     * Manejar eventos que han terminado su fase de planificación
     */
    private function handleFinishedEvents(): void
    {
        $today = now()->toDateString();
        
        // Buscar eventos que terminaron hoy
        $finishedEvents = Event::where('end_date', $today)
            ->where('status', '!=', 'finished')
            ->get();

        foreach ($finishedEvents as $event) {
            // Marcar todas las tareas pendientes como "Delayed"
            Task::whereHas('committee', function ($query) use ($event) {
                $query->where('event_id', $event->id);
            })
            ->where('status', '!=', 'Completed')
            ->update(['status' => 'Delayed']);

            // Cambiar estado del evento a "finished"
            $event->update(['status' => 'finished']);

            $this->line("🏁 Evento '{$event->name}' finalizado - Tareas pendientes marcadas como 'Delayed'");
        }
    }
}
