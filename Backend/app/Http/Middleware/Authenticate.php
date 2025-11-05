<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     */
    protected function redirectTo(Request $request): ?string
    {
        // Para rutas API, no redirigir, solo devolver JSON
        if ($request->expectsJson() || $request->is('api/*')) {
            return null;
        }

        // Para rutas web, redirigir al login
        return route('login');
    }
}
