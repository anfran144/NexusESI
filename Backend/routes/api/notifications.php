<?php

use App\Http\Controllers\NotificationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Notifications Management Routes
|--------------------------------------------------------------------------
|
| Rutas para la gestión del sistema de notificaciones:
| - Listar notificaciones
| - Marcar como leídas
|
*/

// Todas las rutas requieren autenticación
Route::middleware('auth:api')->group(function () {

    // Rutas de notificaciones
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::put('/{notification}/read', [NotificationController::class, 'markAsRead']);
        Route::put('/read-all', [NotificationController::class, 'markAllAsRead']);
    });
});

