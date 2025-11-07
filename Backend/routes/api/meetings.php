<?php

use App\Http\Controllers\MeetingController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Meetings Management Routes
|--------------------------------------------------------------------------
|
| Rutas para la gestión del sistema de reuniones:
| - CRUD de reuniones
| - Gestión de QR codes
| - Gestión de asistencias
| - Invitaciones
|
*/

// Todas las rutas requieren autenticación
Route::middleware('auth:api')->group(function () {
    // Rutas de reuniones por evento
    Route::prefix('events/{event}/meetings')->group(function () {
        Route::get('/', [MeetingController::class, 'index']);
        Route::post('/', [MeetingController::class, 'store']);
    });

    // Rutas de reuniones individuales
    Route::prefix('meetings')->group(function () {
        Route::get('/{meeting}', [MeetingController::class, 'show']);
        Route::put('/{meeting}', [MeetingController::class, 'update']);
        Route::delete('/{meeting}', [MeetingController::class, 'destroy']);
        
        // QR code
        Route::post('/{meeting}/generate-qr', [MeetingController::class, 'generateQr']);
        Route::get('/{meeting}/qr', [MeetingController::class, 'getQrImage']);
        
        // Asistencias
        Route::get('/{meeting}/attendances', [MeetingController::class, 'attendances']);
        
        // Invitaciones
        Route::post('/{meeting}/accept', [MeetingController::class, 'acceptInvitation']);
        Route::post('/{meeting}/decline', [MeetingController::class, 'declineInvitation']);
    });
});


