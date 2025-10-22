<?php

namespace App\Policies;

use App\Models\Ciudad;
use App\Models\User;

class CiudadPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        // Cualquier usuario autenticado puede ver ciudades (datos públicos)
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Ciudad $ciudad): bool
    {
        // Cualquier usuario autenticado puede ver una ciudad específica
        return true;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        // Solo admin puede crear ciudades
        return $user->hasPermissionTo('admin.system.configure');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Ciudad $ciudad): bool
    {
        // Solo admin puede actualizar ciudades
        return $user->hasPermissionTo('admin.system.configure');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Ciudad $ciudad): bool
    {
        // Solo admin puede eliminar ciudades
        return $user->hasPermissionTo('admin.system.configure');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Ciudad $ciudad): bool
    {
        return $user->hasPermissionTo('admin.system.configure');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Ciudad $ciudad): bool
    {
        return $user->hasPermissionTo('admin.system.configure');
    }
}
