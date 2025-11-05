<?php

namespace App\Console\Commands;

use App\Services\NotificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Auth;

class TestPushNotification extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'push:test {user_id? : ID del usuario al que enviar la notificación}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Enviar una notificación push de prueba a un usuario';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $userId = $this->argument('user_id');
        
        if (!$userId) {
            // Intentar obtener el usuario desde la sesión o preguntar
            $userId = $this->ask('Ingresa el ID del usuario al que enviar la notificación');
        }

        $userId = (int) $userId;

        $this->info("🚀 Enviando notificación de prueba al usuario ID: {$userId}");
        $this->line('');

        try {
            $notificationService = app(NotificationService::class);
            
            $message = "🧪 Notificación de prueba - " . now()->format('H:i:s');
            
            $notificationService->sendGeneralNotification(
                $userId,
                'test.notification',
                [
                    'message' => $message,
                    'type' => 'test',
                    'timestamp' => now()->toISOString(),
                    'user_id' => $userId,
                ]
            );

            $this->info('✅ Notificación enviada exitosamente!');
            $this->line('');
            $this->comment("Mensaje: {$message}");
            $this->comment("Evento: test.notification");
            $this->comment("Canal: user-{$userId}");
            $this->comment("Driver: " . config('broadcasting.default'));
            $this->line('');

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error('❌ Error al enviar notificación: ' . $e->getMessage());
            $this->line('');
            $this->comment("Verifica que:");
            $this->comment("1. El broadcasting esté configurado correctamente");
            $this->comment("2. Las credenciales de Pusher/Redis estén correctas");
            $this->comment("3. El usuario ID {$userId} exista");
            
            return Command::FAILURE;
        }
    }
}

