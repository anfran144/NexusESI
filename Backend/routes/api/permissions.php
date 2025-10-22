<?php

use App\Http\Controllers\Api\PermissionController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Permission Management Routes
|--------------------------------------------------------------------------
|
| Rutas para la gestión de permisos y roles:
| - CRUD de roles y permisos
| - Asignación de permisos a roles
| - Asignación de roles a usuarios
| - Gestión de caché de permisos
|
*/

// Todas las rutas requieren autenticación
Route::middleware('auth:api')->prefix('permissions')->group(function () {

    // Obtener datos
    Route::get('/roles', [PermissionController::class, 'getRoles']);
    Route::get('/permissions', [PermissionController::class, 'getPermissions']);
    Route::get('/stats', [PermissionController::class, 'getStats']);

    // Asignaciones
    Route::post('/roles/{role}/permissions', [PermissionController::class, 'assignPermissionsToRole']);
    Route::post('/users/{user}/role', [PermissionController::class, 'assignRoleToUser']);

    // Gestión de caché
    Route::post('/cache/clear', [PermissionController::class, 'clearCache']);
    Route::get('/cache/status', [PermissionController::class, 'getCacheStatus']);
});
