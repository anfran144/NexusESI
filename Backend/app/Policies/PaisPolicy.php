<?php

namespace App\Policies;

use App\Models\Pais;
use App\Models\User;

class PaisPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        // Cualquier usuario autenticado puede ver países (datos públicos)
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Pais $pais): bool
    {
        // Cualquier usuario autenticado puede ver un país específico
        return true;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        // Solo admin puede crear países
        return $user->hasPermissionTo('admin.system.configure');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Pais $pais): bool
    {
        // Solo admin puede actualizar países
        return $user->hasPermissionTo('admin.system.configure');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Pais $pais): bool
    {
        // Solo admin puede eliminar países
        return $user->hasPermissionTo('admin.system.configure');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Pais $pais): bool
    {
        return $user->hasPermissionTo('admin.system.configure');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Pais $pais): bool
    {
        return $user->hasPermissionTo('admin.system.configure');
    }
}
