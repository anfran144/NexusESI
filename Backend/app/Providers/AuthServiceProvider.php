<?php

namespace App\Providers;

use App\Models\Event;
use App\Models\Institucion;
use App\Models\Task;
use App\Models\User;
use App\Policies\EventPolicy;
use App\Policies\InstitucionPolicy;
use App\Policies\TaskPolicy;
use App\Policies\UserPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        User::class => UserPolicy::class,
        Institucion::class => InstitucionPolicy::class,
        Event::class => EventPolicy::class,
        Task::class => TaskPolicy::class,
        \App\Models\Pais::class => \App\Policies\PaisPolicy::class,
        \App\Models\Estado::class => \App\Policies\EstadoPolicy::class,
        \App\Models\Ciudad::class => \App\Policies\CiudadPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        // Definir gates adicionales si es necesario
        Gate::define('admin-access', function (User $user) {
            return $user->hasRole('admin');
        });

        Gate::define('coordinator-access', function (User $user) {
            return $user->hasAnyRole(['admin', 'coordinator']);
        });

        Gate::define('seedbed-leader-access', function (User $user) {
            return $user->hasAnyRole(['admin', 'coordinator', 'seedbed_leader']);
        });
    }
}
