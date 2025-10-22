<?php

use App\Http\Controllers\Api\RoleController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Role Management Routes
|--------------------------------------------------------------------------
|
| Rutas para la gestión de roles y permisos:
| - Listado de roles
| - Asignación y remoción de roles
| - Consulta de roles por usuario
| - Consulta de usuarios por rol
|
*/

// Todas las rutas de roles requieren autenticación
Route::middleware('auth:api')->prefix('roles')->group(function () {
    Route::get('/', [RoleController::class, 'index']);
    Route::post('/assign', [RoleController::class, 'assignRole']);
    Route::post('/remove', [RoleController::class, 'removeRole']);
    Route::post('/check', [RoleController::class, 'checkUserRole']);
    Route::get('/user/{userId}', [RoleController::class, 'getUserRoles']);
    Route::get('/users/{roleName}', [RoleController::class, 'getUsersByRole']);
});
