<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    /**
     * Obtener todos los roles disponibles
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        try {
            $roles = Role::all(['id', 'name', 'guard_name', 'created_at']);

            return response()->json([
                'success' => true,
                'data' => $roles,
                'message' => 'Roles obtenidos exitosamente',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los roles: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Asignar un rol a un usuario
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function assignRole(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'role_name' => 'required|string|exists:roles,name',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Datos de validación incorrectos',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = User::findOrFail($request->user_id);
            $roleName = $request->role_name;

            // Verificar si el usuario ya tiene el rol
            if ($user->hasRole($roleName)) {
                return response()->json([
                    'success' => false,
                    'message' => 'El usuario ya tiene asignado este rol',
                ], 400);
            }

            // Asignar el rol
            $user->assignRole($roleName);

            return response()->json([
                'success' => true,
                'message' => "Rol '{$roleName}' asignado exitosamente al usuario {$user->name}",
                'data' => [
                    'user' => $user->only(['id', 'name', 'email']),
                    'roles' => $user->getRoleNames(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al asignar el rol: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remover un rol de un usuario
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function removeRole(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'role_name' => 'required|string|exists:roles,name',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Datos de validación incorrectos',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = User::findOrFail($request->user_id);
            $roleName = $request->role_name;

            // Verificar si el usuario tiene el rol
            if (! $user->hasRole($roleName)) {
                return response()->json([
                    'success' => false,
                    'message' => 'El usuario no tiene asignado este rol',
                ], 400);
            }

            // Remover el rol
            $user->removeRole($roleName);

            return response()->json([
                'success' => true,
                'message' => "Rol '{$roleName}' removido exitosamente del usuario {$user->name}",
                'data' => [
                    'user' => $user->only(['id', 'name', 'email']),
                    'roles' => $user->getRoleNames(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al remover el rol: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener los roles de un usuario específico
     *
     * @param  int  $userId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getUserRoles($userId)
    {
        try {
            $user = User::findOrFail($userId);
            $roles = $user->getRoleNames();

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => $user->only(['id', 'name', 'email']),
                    'roles' => $roles,
                ],
                'message' => 'Roles del usuario obtenidos exitosamente',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los roles del usuario: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Verificar si un usuario tiene un rol específico
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkUserRole(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'role_name' => 'required|string|exists:roles,name',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Datos de validación incorrectos',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $user = User::findOrFail($request->user_id);
            $roleName = $request->role_name;
            $hasRole = $user->hasRole($roleName);

            return response()->json([
                'success' => true,
                'data' => [
                    'user' => $user->only(['id', 'name', 'email']),
                    'role_name' => $roleName,
                    'has_role' => $hasRole,
                ],
                'message' => $hasRole
                    ? "El usuario tiene el rol '{$roleName}'"
                    : "El usuario no tiene el rol '{$roleName}'",
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al verificar el rol del usuario: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener usuarios por rol
     *
     * @param  string  $roleName
     * @return \Illuminate\Http\JsonResponse
     */
    public function getUsersByRole($roleName)
    {
        try {
            // Verificar que el rol existe
            $role = Role::where('name', $roleName)->first();

            if (! $role) {
                return response()->json([
                    'success' => false,
                    'message' => 'El rol especificado no existe',
                ], 404);
            }

            // Obtener usuarios con el rol específico
            $users = User::role($roleName)->get(['id', 'name', 'email', 'created_at']);

            return response()->json([
                'success' => true,
                'data' => [
                    'role' => $role->only(['id', 'name', 'guard_name']),
                    'users' => $users,
                    'total_users' => $users->count(),
                ],
                'message' => "Usuarios con rol '{$roleName}' obtenidos exitosamente",
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener usuarios por rol: '.$e->getMessage(),
            ], 500);
        }
    }
}
