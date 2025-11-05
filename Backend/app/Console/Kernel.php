<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     * 
     * NOTA: En Laravel 11, el scheduler principal está configurado en bootstrap/app.php
     * Este método se mantiene para compatibilidad, pero el scheduler de riesgos
     * de tareas está correctamente configurado en bootstrap/app.php para ejecutarse
     * diariamente según NexusEsi.md
     */
    protected function schedule(Schedule $schedule): void
    {
        // El scheduler principal está en bootstrap/app.php
        // Aquí solo se pueden agregar tareas adicionales si es necesario en el futuro
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
