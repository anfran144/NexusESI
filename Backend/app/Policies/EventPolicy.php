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
            return $event->institution_id === $user->institution_id && $event->status !== 'finalizado';
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
            return $event->coordinator_id === $user->id && $event->institution_id === $user->institution_id;
        }

        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Event $event): bool
    {
        // Coordinator solo puede eliminar eventos que coordina, de su institución y que estén en planificación
        if ($user->hasRole('coordinator') && $user->can('events.delete')) {
            return $event->coordinator_id === $user->id
                && $event->institution_id === $user->institution_id
                && $event->status === 'planificación';
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
        $activeEvent = $user->eventParticipations()
            ->whereHas('event', function ($query) {
                $query->where('status', '!=', 'finalizado');
            })
            ->where('status', 'aprobado')
            ->exists();

        if ($activeEvent) {
            return false;
        }

        // No puede participar en eventos finalizados
        return $event->status !== 'finalizado';
    }

    /**
     * Determine whether the user can manage committees.
     */
    public function manageCommittees(User $user, Event $event): bool
    {
        // Coordinator solo puede gestionar comités de eventos que coordina
        if ($user->hasRole('coordinator') && $user->can('events.committees.manage')) {
            return $event->coordinator_id === $user->id;
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
