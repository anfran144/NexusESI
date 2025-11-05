<?php

use App\Http\Controllers\AlertController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Alerts Management Routes
|--------------------------------------------------------------------------
|
| Rutas para la gestión del sistema de alertas:
| - CRUD de alertas
| - Marcar como leídas
| - Estadísticas
|
*/

// Todas las rutas requieren autenticación
Route::middleware('auth:api')->group(function () {

    // Rutas de alertas
    Route::prefix('alerts')->group(function () {
        // CRUD básico de alertas
        Route::get('/', [AlertController::class, 'index']);
        Route::post('/', [AlertController::class, 'store']);
        Route::get('/{alert}', [AlertController::class, 'show']);
        Route::put('/{alert}', [AlertController::class, 'update']);
        Route::delete('/{alert}', [AlertController::class, 'destroy']);

        // Acciones específicas de alertas
        Route::put('/{alert}/read', [AlertController::class, 'markAsRead']);
        Route::put('/read-all', [AlertController::class, 'markAllAsRead']);
        Route::get('/statistics/overview', [AlertController::class, 'statistics']);
    });
});
