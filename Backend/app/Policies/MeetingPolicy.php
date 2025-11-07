<?php

namespace App\Policies;

use Illuminate\Auth\Access\Response;
use App\Models\Meeting;
use App\Models\User;

class MeetingPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasRole(['coordinator', 'seedbed_leader']);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Meeting $meeting): bool
    {
        // Coordinador del evento puede ver
        if ($user->hasRole('coordinator') && $meeting->event->coordinator_id === $user->id) {
            return true;
        }

        // Usuario invitado puede ver
        if ($meeting->isUserInvited($user->id)) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        // Solo coordinadores pueden crear reuniones
        return $user->hasRole('coordinator');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Meeting $meeting): bool
    {
        // Solo el coordinador del evento puede actualizar
        if ($user->hasRole('coordinator')) {
            return $meeting->event->coordinator_id === $user->id 
                && $meeting->event->institution_id === $user->institution_id;
        }

        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Meeting $meeting): bool
    {
        // Solo el coordinador del evento puede cancelar
        if ($user->hasRole('coordinator')) {
            return $meeting->event->coordinator_id === $user->id 
                && $meeting->event->institution_id === $user->institution_id;
        }

        return false;
    }

    /**
     * Determine whether the user can view attendances.
     */
    public function viewAttendances(User $user, Meeting $meeting): bool
    {
        // Solo el coordinador del evento puede ver asistencias
        if ($user->hasRole('coordinator')) {
            return $meeting->event->coordinator_id === $user->id 
                && $meeting->event->institution_id === $user->institution_id;
        }

        return false;
    }

    /**
     * Determine whether the user can accept/decline invitation.
     */
    public function respondInvitation(User $user, Meeting $meeting): bool
    {
        // Solo usuarios invitados pueden responder
        return $meeting->isUserInvited($user->id);
    }
}
