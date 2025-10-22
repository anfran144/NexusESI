<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no autenticado',
                'error_code' => 'UNAUTHENTICATED',
                'redirect_to' => '/sign-in',
            ], 401);
        }

        // Verificar si el usuario tiene al menos uno de los roles requeridos
        $hasRole = false;
        foreach ($roles as $role) {
            if ($user->hasRole($role)) {
                $hasRole = true;
                break;
            }
        }

        if (! $hasRole) {
            // Determinar la redirección basada en el rol del usuario
            $userRole = $user->roles->first()?->name;
            $redirectTo = $this->getRedirectByRole($userRole);

            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para acceder a este recurso',
                'error_code' => 'INSUFFICIENT_PERMISSIONS',
                'required_roles' => $roles,
                'user_role' => $userRole,
                'redirect_to' => $redirectTo,
            ], 403);
        }

        return $next($request);
    }

    /**
     * Obtener la ruta de redirección basada en el rol del usuario
     */
    private function getRedirectByRole(?string $role): string
    {
        return match ($role) {
            'admin' => '/admin',
            'coordinator' => '/coordinator',
            'seedbed_leader' => '/seedbed-leader',
            default => '/sign-in'
        };
    }
}
