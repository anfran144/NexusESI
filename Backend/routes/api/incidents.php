<?php

use App\Http\Controllers\IncidentController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Incidents Management Routes
|--------------------------------------------------------------------------
|
| Rutas para la gestión del sistema de incidencias:
| - CRUD de incidencias
| - Reportar incidencias
| - Resolver incidencias
|
*/

// Todas las rutas requieren autenticación
Route::middleware('auth:api')->group(function () {

    // Rutas de incidencias
    Route::prefix('incidents')->group(function () {
        // CRUD básico de incidencias
        Route::get('/', [IncidentController::class, 'index']);
        Route::post('/', [IncidentController::class, 'store']);
        Route::get('/{incident}', [IncidentController::class, 'show']);
        Route::put('/{incident}', [IncidentController::class, 'update']);
        Route::delete('/{incident}', [IncidentController::class, 'destroy']);

        // Acciones específicas de incidencias
        Route::put('/{incident}/resolve', [IncidentController::class, 'resolve']);
    });
});
