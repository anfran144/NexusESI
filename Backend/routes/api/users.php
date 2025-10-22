<?php

use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\UserStatusController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| User Management Routes
|--------------------------------------------------------------------------
|
| Rutas para la gestión de usuarios:
| - CRUD completo de usuarios
| - Gestión de estados de usuarios
| - Información del usuario autenticado con roles
|
*/

// Todas las rutas de usuarios requieren autenticación
Route::middleware('auth:api')->group(function () {
    // Rutas CRUD de usuarios
    Route::apiResource('users', UserController::class);

    // Rutas para gestión de estados de usuarios
    Route::prefix('users')->group(function () {
        // Cambiar estado de un usuario específico
        Route::patch('{user}/status', [UserStatusController::class, 'changeStatus'])
            ->name('users.change-status');

        // Obtener usuarios por estado
        Route::get('status/{status}', [UserStatusController::class, 'getUsersByStatus'])
            ->name('users.by-status');

        // Aprobar múltiples usuarios pendientes
        Route::post('approve-multiple', [UserStatusController::class, 'approveMultiple'])
            ->name('users.approve-multiple');
    });

    // Ruta adicional para obtener el usuario autenticado con roles
    Route::get('/user', function (Request $request) {
        $user = $request->user();
        $user->load(['roles', 'institution']);

        return response()->json([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'email_verified_at' => $user->email_verified_at,
                    'status' => $user->status,
                    'institution_id' => $user->institution_id,
                    'institution' => $user->institution ? [
                        'id' => $user->institution->id,
                        'nombre' => $user->institution->nombre,
                        'identificador' => $user->institution->identificador,
                    ] : null,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                    'roles' => $user->getRoleNames(),
                ],
            ],
        ]);
    });
});
