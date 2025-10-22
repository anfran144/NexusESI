<?php

namespace App\Policies;

use App\Models\Institucion;
use App\Models\User;

class InstitucionPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyPermission([
            'admin.institutions.view',
            'coordinator.seedbeds.view',
        ]);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Institucion $institucion): bool
    {
        return $user->hasAnyPermission([
            'admin.institutions.view',
            'coordinator.seedbeds.view',
        ]);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('admin.institutions.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Institucion $institucion): bool
    {
        return $user->hasPermissionTo('admin.institutions.edit');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Institucion $institucion): bool
    {
        return $user->hasPermissionTo('admin.institutions.delete');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Institucion $institucion): bool
    {
        return $user->hasPermissionTo('admin.institutions.delete');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Institucion $institucion): bool
    {
        return $user->hasPermissionTo('admin.institutions.delete');
    }
}
