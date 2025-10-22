<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('admin.users.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, User $model): bool
    {
        // Admin puede ver cualquier usuario
        if ($user->hasPermissionTo('admin.users.view')) {
            return true;
        }

        // Un usuario puede ver su propio perfil
        return $user->id === $model->id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('admin.users.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, User $model): bool
    {
        // Admin puede editar cualquier usuario
        if ($user->hasPermissionTo('admin.users.edit')) {
            return true;
        }

        // Un usuario puede editar su propio perfil si tiene el permiso
        if ($user->id === $model->id && $user->hasPermissionTo('profile.edit')) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, User $model): bool
    {
        // Solo admin puede eliminar usuarios
        if (! $user->hasPermissionTo('admin.users.delete')) {
            return false;
        }

        // No puede eliminarse a sí mismo
        if ($user->id === $model->id) {
            return false;
        }

        return true;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, User $model): bool
    {
        return $user->hasPermissionTo('admin.users.delete');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, User $model): bool
    {
        return $user->hasPermissionTo('admin.users.delete');
    }
}
