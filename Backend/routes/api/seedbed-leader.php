<?php

use App\Http\Controllers\SeedbedLeaderController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Seedbed Leader API Routes
|--------------------------------------------------------------------------
|
| Rutas específicas para líderes de semillero
|
*/

Route::middleware(['auth:api'])->prefix('seedbed-leader')->group(function () {
    // Dashboard del líder de semillero
    Route::get('/dashboard', [SeedbedLeaderController::class, 'dashboard']);
    
    // Evento activo del líder
    Route::get('/active-event', [SeedbedLeaderController::class, 'activeEvent']);
});
