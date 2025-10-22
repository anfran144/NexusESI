<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Middleware\CachePermissions;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PermissionController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth:api']);
    }

    /**
     * Obtener todos los roles con sus permisos
     */
    public function getRoles(): JsonResponse
    {
        $this->authorize('viewAny', Role::class);

        $roles = Role::with('permissions')->get();

        return response()->json([
            'success' => true,
            'data' => $roles,
            'message' => 'Roles obtenidos exitosamente',
        ]);
    }

    /**
     * Obtener todos los permisos disponibles
     */
    public function getPermissions(): JsonResponse
    {
        $this->authorize('viewAny', Permission::class);

        $permissions = Permission::all()->groupBy(function ($permission) {
            return explode('.', $permission->name)[0];
        });

        return response()->json([
            'success' => true,
            'data' => $permissions,
            'message' => 'Permisos obtenidos exitosamente',
        ]);
    }

    /**
     * Asignar permisos a un rol
     */
    public function assignPermissionsToRole(Request $request, $roleId): JsonResponse
    {
        $this->authorize('update', Role::class);

        $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'exists:permissions,name',
        ]);

        $role = Role::findOrFail($roleId);
        $role->syncPermissions($request->permissions);

        // Limpiar caché de permisos para usuarios con este rol
        $this->clearCacheForRole($role);

        return response()->json([
            'success' => true,
            'message' => 'Permisos asignados exitosamente al rol',
        ]);
    }

    /**
     * Asignar rol a un usuario
     */
    public function assignRoleToUser(Request $request, $userId): JsonResponse
    {
        $this->authorize('update', User::class);

        $request->validate([
            'role' => 'required|exists:roles,name',
        ]);

        $user = User::findOrFail($userId);
        $user->syncRoles([$request->role]);

        // Limpiar caché de permisos para este usuario
        CachePermissions::clearUserPermissions($user->id);

        return response()->json([
            'success' => true,
            'message' => 'Rol asignado exitosamente al usuario',
        ]);
    }

    /**
     * Obtener estadísticas de permisos
     */
    public function getStats(): JsonResponse
    {
        $this->authorize('view', Permission::class);

        $stats = [
            'total_roles' => Role::count(),
            'total_permissions' => Permission::count(),
            'total_users_with_roles' => User::has('roles')->count(),
            'cache_status' => [
                'enabled' => config('cache.default') !== 'array',
                'driver' => config('cache.default'),
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
            'message' => 'Estadísticas obtenidas exitosamente',
        ]);
    }

    /**
     * Limpiar caché de permisos
     */
    public function clearCache(): JsonResponse
    {
        $this->authorize('cache.clear');

        CachePermissions::clearAllPermissions();

        return response()->json([
            'success' => true,
            'message' => 'Caché de permisos limpiado exitosamente',
        ]);
    }

    /**
     * Verificar estado del caché
     */
    public function getCacheStatus(): JsonResponse
    {
        $this->authorize('cache.view');

        $cacheInfo = [
            'driver' => config('cache.default'),
            'enabled' => config('cache.default') !== 'array',
            'sample_keys' => $this->getSampleCacheKeys(),
        ];

        return response()->json([
            'success' => true,
            'data' => $cacheInfo,
            'message' => 'Estado del caché obtenido exitosamente',
        ]);
    }

    /**
     * Limpiar caché para usuarios con un rol específico
     */
    private function clearCacheForRole(Role $role): void
    {
        $users = User::role($role->name)->get();

        foreach ($users as $user) {
            CachePermissions::clearUserPermissions($user->id);
        }
    }

    /**
     * Obtener claves de caché de ejemplo para diagnóstico
     */
    private function getSampleCacheKeys(): array
    {
        // En un entorno real, esto sería más sofisticado
        return [
            'user_permissions_1' => Cache::has('user_permissions_1'),
            'user_permissions_2' => Cache::has('user_permissions_2'),
            'user_permissions_3' => Cache::has('user_permissions_3'),
        ];
    }
}
