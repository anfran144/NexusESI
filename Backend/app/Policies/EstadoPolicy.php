<?php

namespace App\Policies;

use App\Models\Estado;
use App\Models\User;

class EstadoPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        // Cualquier usuario autenticado puede ver estados (datos públicos)
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Estado $estado): bool
    {
        // Cualquier usuario autenticado puede ver un estado específico
        return true;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        // Solo admin puede crear estados
        return $user->hasPermissionTo('admin.system.configure');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Estado $estado): bool
    {
        // Solo admin puede actualizar estados
        return $user->hasPermissionTo('admin.system.configure');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Estado $estado): bool
    {
        // Solo admin puede eliminar estados
        return $user->hasPermissionTo('admin.system.configure');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Estado $estado): bool
    {
        return $user->hasPermissionTo('admin.system.configure');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Estado $estado): bool
    {
        return $user->hasPermissionTo('admin.system.configure');
    }
}
