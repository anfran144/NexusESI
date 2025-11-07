<?php

namespace App\Policies;

use App\Models\Event;
use App\Models\User;

class EventPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('events.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Event $event): bool
    {
        // Coordinator solo puede ver eventos que ha creado y de su institución
        if ($user->can('events.view') && $user->hasRole('coordinator')) {
            return $event->coordinator_id === $user->id && $event->institution_id === $user->institution_id;
        }

        // Seedbed Leader solo puede ver eventos de su institución (excepto finalizados)
        if ($user->can('events.view') && $user->hasRole('seedbed_leader')) {
            return $event->institution_id === $user->institution_id && $event->status !== 'finished';
        }

        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can('events.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Event $event): bool
    {
        // Coordinator solo puede editar eventos que coordina y de su institución
        if ($user->hasRole('coordinator') && $user->can('events.edit')) {
            $isCoordinator = $event->coordinator_id === $user->id && $event->institution_id === $user->institution_id;
            
            if (!$isCoordinator) {
                return false;
            }

            // Si el evento está finalizado, solo permitir correcciones menores (descripción)
            if ($event->status === 'finished') {
                return true; // La validación de qué campos se pueden editar se hace en el controlador
            }

            // Si el evento está inactivo, solo permitir reactivación
            if ($event->status === 'inactive') {
                return true; // La validación se hace en el controlador
            }

            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Event $event): bool
    {
        // Coordinator solo puede eliminar eventos que coordina, de su institución y que estén activos
        if ($user->hasRole('coordinator') && $user->can('events.delete')) {
            $isCoordinator = $event->coordinator_id === $user->id
                && $event->institution_id === $user->institution_id
                && $event->status === 'active';

            if (!$isCoordinator) {
                return false;
            }

            // Solo permitir eliminar si está en fase de planificación (antes de start_date)
            return $event->isInPlanningPhase();
        }

        return false;
    }

    /**
     * Determine whether the user can manage participants.
     */
    public function manageParticipants(User $user, Event $event): bool
    {
        // Coordinator solo puede gestionar participantes de eventos que coordina y de su institución
        if ($user->hasRole('coordinator') && $user->can('events.manage_participants')) {
            return $event->coordinator_id === $user->id && $event->institution_id === $user->institution_id;
        }

        return false;
    }

    /**
     * Determine whether the user can participate in the event.
     */
    public function participate(User $user, Event $event): bool
    {
        // Solo Seedbed Leaders pueden participar
        if (! $user->hasRole('seedbed_leader') || ! $user->can('events.participate')) {
            return false;
        }

        // Solo pueden participar en eventos de su institución
        if ($event->institution_id !== $user->institution_id) {
            return false;
        }

        // Verificar que no tenga un evento activo (no finalizado)
        // Solo considerar participaciones activas
        $activeEvent = $user->eventParticipations()
            ->where('is_active', true)
            ->whereHas('event', function ($query) {
                $query->where('status', '!=', 'finished');
            })
            ->exists();

        if ($activeEvent) {
            return false;
        }

        // No puede participar en eventos finalizados
        return $event->status !== 'finished';
    }

    /**
     * Determine whether the user can manage committees.
     */
    public function manageCommittees(User $user, Event $event): bool
    {
        // Coordinator solo puede gestionar comités de eventos que coordina
        if ($user->hasRole('coordinator') && $user->can('events.committees.manage')) {
            $isCoordinator = $event->coordinator_id === $user->id && $event->institution_id === $user->institution_id;
            
            if (!$isCoordinator) {
                return false;
            }

            // Validar que el evento permita gestionar comités
            return $event->canPerformAction('manage_committees');
        }

        return false;
    }

    /**
     * Determine whether the user can manage tasks.
     */
    public function canManageTasks(User $user, Event $event): bool
    {
        if ($user->hasRole('coordinator') && $user->can('events.tasks.manage')) {
            $isCoordinator = $event->coordinator_id === $user->id && $event->institution_id === $user->institution_id;
            
            if (!$isCoordinator) {
                return false;
            }

            return $event->canPerformAction('manage_tasks');
        }

        return false;
    }

    /**
     * Determine whether the user can manage participants.
     * Este método ya existe, pero lo actualizamos para incluir validación de estado.
     */
    public function canManageParticipants(User $user, Event $event): bool
    {
        // Coordinator solo puede gestionar participantes de eventos que coordina y de su institución
        if ($user->hasRole('coordinator') && $user->can('events.manage_participants')) {
            $isCoordinator = $event->coordinator_id === $user->id && $event->institution_id === $user->institution_id;
            
            if (!$isCoordinator) {
                return false;
            }

            return $event->canPerformAction('manage_participants');
        }

        return false;
    }

    /**
     * Determine whether the user can reuse data from a finished event.
     */
    public function canReuseData(User $user, Event $event): bool
    {
        if ($user->hasRole('coordinator') && $user->can('events.view')) {
            $isCoordinator = $event->coordinator_id === $user->id && $event->institution_id === $user->institution_id;
            
            if (!$isCoordinator) {
                return false;
            }

            return $event->status === 'finished' && $event->canPerformAction('reuse_data');
        }

        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Event $event): bool
    {
        return $user->hasRole('admin');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Event $event): bool
    {
        return $user->hasRole('admin');
    }
}
