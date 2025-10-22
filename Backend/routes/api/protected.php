<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Protected Routes
|--------------------------------------------------------------------------
|
| Rutas protegidas que requieren autenticación y roles específicos:
| - Rutas para administradores
| - Rutas para coordinadores
| - Rutas para líderes de semillero
|
*/

// Rutas protegidas que requieren autenticación
Route::middleware(['auth.jwt'])->group(function () {

    // Rutas exclusivas para administradores
    Route::middleware(['role:admin'])->prefix('admin')->group(function () {
        Route::get('/dashboard', function () {
            return response()->json([
                'success' => true,
                'message' => 'Bienvenido al panel de administración',
                'user' => request()->user()->getProfileData(),
                'dashboard_data' => [
                    'total_users' => \App\Models\User::count(),
                    'total_roles' => \Spatie\Permission\Models\Role::count(),
                    'recent_activity' => 'Actividad reciente del sistema',
                ],
            ]);
        });

        Route::get('/users', function () {
            return response()->json([
                'success' => true,
                'users' => \App\Models\User::with('roles')->get(),
            ]);
        });
    });

    // Rutas exclusivas para coordinadores
    Route::middleware(['role:coordinator'])->prefix('coordinator')->group(function () {
        Route::get('/dashboard', function () {
            return response()->json([
                'success' => true,
                'message' => 'Panel de coordinación',
                'user' => request()->user()->getProfileData(),
                'dashboard_data' => [
                    'assigned_projects' => 'Proyectos asignados',
                    'team_members' => 'Miembros del equipo',
                    'pending_tasks' => 'Tareas pendientes',
                ],
            ]);
        });
    });

    // Rutas exclusivas para líderes de semillero
    Route::middleware(['role:seedbed_leader'])->prefix('seedbed-leader')->group(function () {
        Route::get('/dashboard', function () {
            return response()->json([
                'success' => true,
                'message' => 'Panel de liderazgo de semillero',
                'user' => request()->user()->getProfileData(),
                'dashboard_data' => [
                    'seedbed_info' => 'Información del semillero',
                    'members' => 'Miembros del semillero',
                    'projects' => 'Proyectos activos',
                ],
            ]);
        });
    });

    // Rutas accesibles por múltiples roles
    Route::middleware(['role:admin,coordinator,seedbed_leader'])->group(function () {
        Route::get('/profile', function () {
            return response()->json([
                'success' => true,
                'user' => request()->user()->getProfileData(),
            ]);
        });

        Route::put('/profile', function () {
            // Lógica para actualizar perfil
            return response()->json([
                'success' => true,
                'message' => 'Perfil actualizado exitosamente',
            ]);
        });
    });
});
