<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Console\Scheduling\Schedule;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Registrar middleware personalizado de roles y autenticación
        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
            'auth.jwt' => \App\Http\Middleware\AuthMiddleware::class,
            'auth' => \App\Http\Middleware\Authenticate::class,
        ]);

        // Excluir rutas de API de la verificación CSRF
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })
    ->withSchedule(function (Schedule $schedule): void {
        // Ejecutar el scheduler de riesgos de tareas cada 24 horas
        // Según NexusEsi.md: "se ejecuta cada 24 horas"
        $schedule->command('tasks:calculate-risks')
            ->daily()
            ->withoutOverlapping()
            ->runInBackground();

        // Ejecutar verificación de transiciones de estado de eventos diariamente
        $schedule->command('events:check-status-transitions')
            ->daily()
            ->withoutOverlapping()
            ->runInBackground();
    })->create();
