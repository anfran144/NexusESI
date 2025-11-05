<?php

use App\Http\Controllers\PusherController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:api')->group(function () {
    // Obtener credenciales públicas de Pusher
    Route::get('/pusher/credentials', [PusherController::class, 'credentials']);
    
    // Autenticación para canales privados
    Route::post('/pusher/auth', [PusherController::class, 'auth']);

    // Enviar notificación de prueba (para testing)
    Route::post('/pusher/test', [PusherController::class, 'testNotification']);
});
