<?php

use App\Http\Controllers\CommitteeController;
use App\Http\Controllers\EventController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Events Management Routes
|--------------------------------------------------------------------------
|
| Rutas para la gestión del sistema de eventos:
| - CRUD de eventos
| - Gestión de participantes
| - Gestión de comités
| - Participación en eventos
|
*/

// Todas las rutas requieren autenticación
Route::middleware('auth:api')->group(function () {

    // Rutas de eventos
    Route::prefix('events')->group(function () {
        // CRUD básico de eventos
        Route::get('/', [EventController::class, 'index']);
        Route::post('/', [EventController::class, 'store']);
        Route::get('/{event}', [EventController::class, 'show']);
        Route::put('/{event}', [EventController::class, 'update']);
        Route::delete('/{event}', [EventController::class, 'destroy']);

        // Participación en eventos
        Route::post('/{event}/participate', [EventController::class, 'participate']);
        Route::get('/available', [EventController::class, 'available']);

        // Gestión de participantes (solo coordinadores y admins)
        Route::get('/{event}/participants', [EventController::class, 'participants']);
    });

    // Rutas de comités
    Route::prefix('committees')->group(function () {
        // CRUD básico de comités
        Route::get('/', [CommitteeController::class, 'index']);
        Route::post('/', [CommitteeController::class, 'store']);
        Route::get('/{committee}', [CommitteeController::class, 'show']);
        Route::put('/{committee}', [CommitteeController::class, 'update']);
        Route::delete('/{committee}', [CommitteeController::class, 'destroy']);

        // Gestión de miembros de comités
        Route::get('/{committee}/members', [CommitteeController::class, 'members']);
        Route::post('/{committee}/assign', [CommitteeController::class, 'assignUser']);
        Route::delete('/{committee}/remove/{user}', [CommitteeController::class, 'removeUser']);
    });
});
