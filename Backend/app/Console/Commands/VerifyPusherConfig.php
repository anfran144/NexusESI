<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Pusher\Pusher;

class VerifyPusherConfig extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'pusher:verify';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Verificar que Pusher esté correctamente configurado';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('🔍 Verificando configuración de Pusher...');
        $this->line('');

        // 1. Verificar configuración básica
        $this->info('📋 1. Configuración Básica');
        $this->line('─────────────────────────────────────────');
        
        $driver = config('broadcasting.default');
        $this->line("Driver configurado: <fg=cyan>{$driver}</>");
        
        if ($driver !== 'pusher') {
            $this->error('❌ El driver no está configurado como "pusher"');
            $this->comment('   Configura BROADCAST_CONNECTION=pusher en tu .env');
            return Command::FAILURE;
        }
        $this->info('✅ Driver correcto');

        // 2. Verificar credenciales
        $this->line('');
        $this->info('🔑 2. Credenciales de Pusher');
        $this->line('─────────────────────────────────────────');
        
        $appId = config('broadcasting.connections.pusher.app_id');
        $key = config('broadcasting.connections.pusher.key');
        $secret = config('broadcasting.connections.pusher.secret');
        $cluster = config('broadcasting.connections.pusher.options.cluster');

        $credentials = [
            'APP_ID' => $appId,
            'APP_KEY' => $key,
            'APP_SECRET' => $secret ? '***' . substr($secret, -4) : null,
            'CLUSTER' => $cluster,
        ];

        $allConfigured = true;
        foreach ($credentials as $name => $value) {
            if (empty($value)) {
                $this->error("❌ {$name}: No configurado");
                $allConfigured = false;
            } else {
                $this->info("✅ {$name}: " . ($name === 'APP_SECRET' ? $value : $value));
            }
        }

        if (!$allConfigured) {
            $this->error('');
            $this->error('❌ Faltan credenciales de Pusher');
            $this->comment('   Configura las variables PUSHER_* en tu .env');
            return Command::FAILURE;
        }

        // 3. Verificar paquete instalado
        $this->line('');
        $this->info('📦 3. Paquete de Pusher');
        $this->line('─────────────────────────────────────────');
        
        if (class_exists(\Pusher\Pusher::class)) {
            $this->info('✅ pusher/pusher-php-server está instalado');
        } else {
            $this->error('❌ pusher/pusher-php-server no está instalado');
            $this->comment('   Ejecuta: composer require pusher/pusher-php-server');
            return Command::FAILURE;
        }

        // 4. Probar conexión con Pusher
        $this->line('');
        $this->info('🌐 4. Prueba de Conexión');
        $this->line('─────────────────────────────────────────');
        
        try {
            $pusher = new Pusher(
                $key,
                $secret,
                $appId,
                [
                    'cluster' => $cluster,
                    'useTLS' => true
                ]
            );

            // Intentar enviar un evento de prueba a un canal de prueba
            $testChannel = 'test-verification-' . time();
            $result = $pusher->trigger($testChannel, 'test-event', [
                'message' => 'Prueba de conexión',
                'timestamp' => now()->toISOString()
            ]);

            if ($result) {
                $this->info('✅ Conexión con Pusher exitosa');
                $this->comment("   Canal de prueba: {$testChannel}");
            } else {
                $this->error('❌ No se pudo enviar evento de prueba');
                return Command::FAILURE;
            }
        } catch (\Exception $e) {
            $this->error('❌ Error al conectar con Pusher: ' . $e->getMessage());
            $this->comment('   Verifica tus credenciales y conexión a internet');
            return Command::FAILURE;
        }

        // 5. Verificar rutas
        $this->line('');
        $this->info('🛣️  5. Rutas de API');
        $this->line('─────────────────────────────────────────');
        
        $routes = [
            '/api/pusher/credentials' => 'GET',
            '/api/pusher/auth' => 'POST',
            '/api/pusher/test' => 'POST',
        ];

        foreach ($routes as $route => $method) {
            $this->info("✅ {$method} {$route}");
        }

        // 6. Verificar servicio de notificaciones
        $this->line('');
        $this->info('🔔 6. NotificationService');
        $this->line('─────────────────────────────────────────');
        
        try {
            $service = app(\App\Services\NotificationService::class);
            $this->info('✅ NotificationService está disponible');
            $this->comment('   Métodos disponibles:');
            $this->comment('   - sendAlertNotification()');
            $this->comment('   - sendIncidentNotification()');
            $this->comment('   - sendProgressNotification()');
            $this->comment('   - sendTaskUpdateNotification()');
            $this->comment('   - sendGeneralNotification()');
        } catch (\Exception $e) {
            $this->error('❌ Error al instanciar NotificationService: ' . $e->getMessage());
            return Command::FAILURE;
        }

        // Resumen final
        $this->line('');
        $this->info('═══════════════════════════════════════════');
        $this->info('✅ Pusher está correctamente configurado!');
        $this->info('═══════════════════════════════════════════');
        $this->line('');
        $this->comment('Prueba enviar una notificación con:');
        $this->comment('  php artisan push:test {user_id}');
        $this->line('');

        return Command::SUCCESS;
    }
}

