<?php

namespace App\Policies;

use Illuminate\Auth\Access\Response;
use App\Models\Task;
use App\Models\User;

class TaskPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        // Soportar tanto permisos legacy como nuevos (transición suave)
        return $user->hasPermissionTo('events.tasks.view') || $user->hasPermissionTo('tasks.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Task $task): bool
    {
        // Soportar tanto permisos legacy como nuevos (transición suave)
        $hasPermission = $user->hasPermissionTo('events.tasks.view') 
                         || $user->hasPermissionTo('tasks.view');
        
        if (!$hasPermission) {
            return false;
        }

        // Verificar que el usuario pertenece a la misma institución del evento
        // Obtener el evento desde committee o directamente
        $event = $task->event ?? $task->committee?->event;
        return $event && $user->institution_id === $event->institution_id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        // Soportar tanto permisos legacy como nuevos (transición suave)
        return $user->hasPermissionTo('events.tasks.manage') || $user->hasPermissionTo('tasks.create');
    }

    /**
     * Determine whether the user can create a task for a specific event.
     */
    public function createForEvent(User $user, \App\Models\Event $event): bool
    {
        if (!$this->create($user)) {
            return false;
        }

        // Verificar que el usuario pertenece a la institución del evento
        if ($user->institution_id !== $event->institution_id) {
            return false;
        }

        // Validar que el evento permita crear tareas
        return $event->canPerformAction('manage_tasks');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Task $task): bool
    {
        // Soportar tanto permisos legacy como nuevos (transición suave)
        $hasPermission = $user->hasPermissionTo('events.tasks.manage') 
                         || $user->hasPermissionTo('tasks.update');
        
        if (!$hasPermission) {
            return false;
        }

        // Solo coordinadores pueden modificar tareas de su institución
        // Obtener el evento desde committee o directamente
        $event = $task->event ?? $task->committee?->event;
        
        if (!$event || $user->institution_id !== $event->institution_id) {
            return false;
        }

        // La validación de qué campos se pueden modificar según el estado se hace en el controlador
        // Aquí solo verificamos permisos básicos
        return true;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Task $task): bool
    {
        // Soportar tanto permisos legacy como nuevos (transición suave)
        $hasPermission = $user->hasPermissionTo('events.tasks.manage') 
                         || $user->hasPermissionTo('tasks.delete');
        
        if (!$hasPermission) {
            return false;
        }

        // Solo coordinadores pueden eliminar tareas de su institución
        // Obtener el evento desde committee o directamente
        $event = $task->event ?? $task->committee?->event;
        return $event && $user->institution_id === $event->institution_id;
    }

    /**
     * Determine whether the user can assign the task.
     */
    public function assign(User $user, Task $task): bool
    {
        // Obtener el evento desde committee o directamente
        $event = $task->event ?? $task->committee?->event;
        if (!$event || $user->institution_id !== $event->institution_id) {
            return false;
        }

        // Verificar si es un líder de semillero intentando asignarse a sí mismo
        if ($user->hasRole('seedbed_leader')) {
            // Los líderes de semillero solo pueden asignarse tareas a sí mismos
            // y solo si la tarea pertenece a uno de sus comités y está sin asignar
            $userCommitteeIds = $user->committees->pluck('id')->toArray();
            $taskCommitteeId = $task->committee_id;
            
            // Verificar que la tarea pertenece a uno de los comités del líder
            if (!$taskCommitteeId || !in_array($taskCommitteeId, $userCommitteeIds)) {
                return false;
            }
            
            // Verificar que la tarea está sin asignar
            if ($task->assigned_to_id !== null) {
                return false;
            }
            
            // Verificar que el evento permita ejecutar tareas (asignación)
            if (!$event->canPerformAction('execute_tasks')) {
                return false;
            }
            
            // Verificar que el request está intentando asignar al mismo usuario
            // Esta validación se hace en el controlador, pero verificamos aquí también
            // Si llega a este punto, el líder puede asignarse a sí mismo
            return true;
        }

        // Para otros roles (coordinadores), verificar permisos
        $hasPermission = $user->hasPermissionTo('events.tasks.assign') 
                         || $user->hasPermissionTo('tasks.assign');
        
        if (!$hasPermission) {
            return false;
        }

        // Validar que el evento permita gestionar tareas (para coordinadores)
        return $event->canPerformAction('manage_tasks');
    }

    /**
     * Determine whether the user can complete the task.
     */
    public function complete(User $user, Task $task): bool
    {
        // Soportar tanto permisos legacy como nuevos (transición suave)
        $hasPermission = $user->hasPermissionTo('events.tasks.complete') 
                         || $user->hasPermissionTo('tasks.complete');
        
        if (!$hasPermission) {
            return false;
        }

        // Solo el usuario asignado puede completar la tarea
        if ($task->assigned_to_id !== $user->id) {
            return false;
        }

        // Obtener el evento y validar que permita ejecutar tareas
        $event = $task->event ?? $task->committee?->event;
        if ($event && !$event->canPerformAction('execute_tasks')) {
            return false;
        }

        return true;
    }

    /**
     * Determine whether the user can report progress on the task.
     */
    public function reportProgress(User $user, Task $task): bool
    {
        // Soportar tanto permisos legacy como nuevos (transición suave)
        $hasPermission = $user->hasPermissionTo('events.tasks.report_progress') 
                         || $user->hasPermissionTo('tasks.report_progress');
        
        if (!$hasPermission) {
            return false;
        }

        // Solo el usuario asignado puede reportar progreso
        if ($task->assigned_to_id !== $user->id) {
            return false;
        }

        // Obtener el evento y validar que permita ejecutar tareas
        $event = $task->event ?? $task->committee?->event;
        if ($event && !$event->canPerformAction('execute_tasks')) {
            return false;
        }

        return true;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Task $task): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Task $task): bool
    {
        return false;
    }
}
