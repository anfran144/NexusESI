<?php

namespace App\Console\Commands;

use App\Models\Event;
use App\Models\Notification;
use App\Services\NotificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckEventStatusTransitions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'events:check-status-transitions';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Verifica eventos que necesitan transición de estado y envía notificaciones a coordinadores';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Verificando transiciones de estado de eventos...');

        $eventsNeedingFinalization = Event::where('status', '!=', 'finished')
            ->where('end_date', '<', now())
            ->with('coordinator')
            ->get()
            ->filter(function ($event) {
                return $event->shouldSuggestFinalization();
            });

        $notificationsCreated = 0;

        foreach ($eventsNeedingFinalization as $event) {
            // Verificar si ya existe una notificación reciente para este evento (últimos 7 días)
            $recentNotification = Notification::where('user_id', $event->coordinator_id)
                ->where('type', 'event_status_transition')
                ->where('metadata->event_id', $event->id)
                ->where('created_at', '>=', now()->subDays(7))
                ->exists();

            if ($recentNotification) {
                $this->line("  - Evento '{$event->name}' ya tiene notificación reciente, omitiendo...");
                continue;
            }

            // Calcular días desde la fecha de fin
            $daysSinceEnd = now()->diffInDays($event->end_date);
            
            // Crear notificación
            $notification = Notification::create([
                'title' => 'Evento requiere finalización',
                'message' => "El evento '{$event->name}' finalizó hace {$daysSinceEnd} día" . ($daysSinceEnd !== 1 ? 's' : '') . ". Por favor, finaliza el evento en el sistema.",
                'type' => 'event_status_transition',
                'user_id' => $event->coordinator_id,
                'is_read' => false,
                'metadata' => [
                    'event_id' => $event->id,
                    'event_name' => $event->name,
                    'end_date' => $event->end_date->toDateString(),
                    'days_since_end' => $daysSinceEnd,
                    'suggested_status' => 'finished',
                ],
            ]);

            // Enviar notificación en tiempo real si está disponible
            try {
                $notificationService = app(NotificationService::class);
                $notificationService->sendEventStatusTransitionNotification($event, $notification);
            } catch (\Exception $e) {
                Log::warning("No se pudo enviar notificación en tiempo real para evento {$event->id}: " . $e->getMessage());
            }

            $notificationsCreated++;
            $this->info("  ✓ Notificación creada para evento '{$event->name}' (Coordinador: {$event->coordinator->name})");
        }

        if ($notificationsCreated === 0) {
            $this->info('No se encontraron eventos que requieran transición de estado.');
        } else {
            $this->info("Total de notificaciones creadas: {$notificationsCreated}");
        }

        return Command::SUCCESS;
    }
}

