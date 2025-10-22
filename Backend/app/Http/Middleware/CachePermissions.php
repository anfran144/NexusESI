<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class CachePermissions
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check()) {
            $user = Auth::user();
            $cacheKey = "user_permissions_{$user->id}";

            // Verificar si los permisos están en caché
            if (! Cache::has($cacheKey)) {
                // Cachear permisos por 1 hora
                $permissions = $user->getAllPermissions()->pluck('name')->toArray();
                Cache::put($cacheKey, $permissions, 3600);
            }

            // Añadir permisos cacheados al request para acceso rápido
            $request->attributes->set('cached_permissions', Cache::get($cacheKey));
        }

        return $next($request);
    }

    /**
     * Limpiar caché de permisos para un usuario específico
     */
    public static function clearUserPermissions(int $userId): void
    {
        Cache::forget("user_permissions_{$userId}");
    }

    /**
     * Limpiar caché de permisos para todos los usuarios
     */
    public static function clearAllPermissions(): void
    {
        // Obtener todas las claves de caché de permisos
        $pattern = 'user_permissions_*';

        // En un entorno de producción, sería mejor usar Redis con SCAN
        // Por ahora, usamos un enfoque simple
        Cache::flush(); // Esto limpia todo el caché, en producción sería más específico
    }
}
