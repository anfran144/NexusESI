<?php

use App\Http\Controllers\Api\AdminController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
|
| Rutas exclusivas para administradores:
| - Panel de control con estadísticas
| - Gestión de instituciones
| - Gestión de usuarios y roles
|
*/

// Todas las rutas requieren autenticación y rol de administrador
Route::middleware(['auth:api', 'role:admin'])->prefix('admin')->group(function () {

    // Panel de control
    Route::get('/dashboard', [AdminController::class, 'dashboard']);

    // Gestión de instituciones
    Route::prefix('instituciones')->group(function () {
        Route::get('/', [AdminController::class, 'instituciones']);
        Route::post('/', [AdminController::class, 'crearInstitucion']);
        Route::put('/{id}', [AdminController::class, 'actualizarInstitucion']);
    });

    // Gestión de usuarios
    Route::prefix('usuarios')->group(function () {
        Route::get('/', [AdminController::class, 'usuarios']);
        Route::put('/{id}/rol', [AdminController::class, 'cambiarRolUsuario']);
        Route::put('/{id}/toggle', [AdminController::class, 'toggleUsuario']);
    });
});
