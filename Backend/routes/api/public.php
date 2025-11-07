<?php

use App\Http\Controllers\PublicMeetingController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
|
| Rutas públicas del sistema:
| - Check-in de reuniones vía QR
|
*/

// Rutas públicas de reuniones
Route::prefix('public/meetings')->group(function () {
    // Validar token QR (sin autenticación)
    Route::get('/check-in/{qrToken}/validate', [PublicMeetingController::class, 'validateQrToken']);
    
    // Check-in (requiere autenticación después)
    Route::post('/check-in/{qrToken}', [PublicMeetingController::class, 'checkIn']);
});


