<?php

use App\Http\Controllers\TaskController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Tasks Management Routes
|--------------------------------------------------------------------------
|
| Rutas para la gestión del sistema de tareas:
| - CRUD de tareas
| - Asignación de tareas
| - Reporte de progreso
| - Gestión de estados
|
*/

// Todas las rutas requieren autenticación
Route::middleware('auth:api')->group(function () {

    // Rutas de tareas
    Route::prefix('tasks')->group(function () {
        // CRUD básico de tareas
        Route::get('/', [TaskController::class, 'index']);
        Route::post('/', [TaskController::class, 'store']);
        Route::get('/{task}', [TaskController::class, 'show']);
        Route::put('/{task}', [TaskController::class, 'update']);
        Route::delete('/{task}', [TaskController::class, 'destroy']);

        // Acciones específicas de tareas
        Route::post('/{task}/assign', [TaskController::class, 'assign']);
        Route::put('/{task}/complete', [TaskController::class, 'complete']);
        Route::post('/{task}/progress', [TaskController::class, 'reportProgress']);
    });
});
