<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class Event extends Model
{
    protected $fillable = [
        'name',
        'description',
        'start_date',
        'end_date',
        'coordinator_id',
        'institution_id',
        'status',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    /**
     * Relación con el coordinador del evento
     */
    public function coordinator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'coordinator_id');
    }

    /**
     * Relación con la institución del evento
     */
    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institucion::class, 'institution_id');
    }

    /**
     * Relación con los comités del evento
     */
    public function committees(): HasMany
    {
        return $this->hasMany(Committee::class);
    }

    /**
     * Relación con los participantes del evento
     */
    public function participants(): HasMany
    {
        return $this->hasMany(EventParticipant::class);
    }

    /**
     * Relación many-to-many con usuarios a través de event_participants
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'event_participants')
            ->withTimestamps();
    }

    /**
     * Relación con las tareas del evento
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    /**
     * Verificar si el evento está en fase de planificación
     */
    public function isInPlanningPhase(): bool
    {
        return now()->lessThan($this->start_date);
    }

    /**
     * Verificar si el evento está en fase de ejecución
     */
    public function isInExecutionPhase(): bool
    {
        $now = now()->toDateString();
        return $now >= $this->start_date->toDateString() && $now <= $this->end_date->toDateString();
    }

    /**
     * Verificar si el evento ya pasó la fecha de fin
     */
    public function isPostExecution(): bool
    {
        return now()->greaterThan($this->end_date);
    }

    /**
     * Verificar si está dentro de la ventana de planificación
     */
    public function isWithinPlanningWindow(): bool
    {
        return $this->status === 'active' && $this->isInPlanningPhase();
    }

    /**
     * Verificar si está dentro de la ventana de ejecución
     */
    public function isWithinExecutionWindow(): bool
    {
        return $this->status === 'active' && $this->isInExecutionPhase();
    }

    /**
     * Calcular días restantes considerando el estado del evento
     */
    public function getDaysRemaining(): ?int
    {
        if ($this->status === 'finished') {
            return null; // No calcular días restantes para eventos finalizados
        }

        if ($this->status === 'inactive') {
            return null; // No calcular días restantes para eventos inactivos
        }

        $now = now();
        $endDate = $this->end_date;
        $diffTime = $endDate->diffInDays($now, false);

        return $diffTime;
    }

    /**
     * Obtener información contextual del tiempo según el estado del evento
     */
    public function getStatusBasedTimeInfo(): array
    {
        if ($this->status === 'finished') {
            $daysSinceEnd = now()->diffInDays($this->end_date);
            return [
                'message' => $daysSinceEnd > 0 ? "Finalizado hace {$daysSinceEnd} día" . ($daysSinceEnd !== 1 ? 's' : '') : 'Finalizado',
                'type' => 'finished',
                'days' => null,
                'is_overdue' => false,
                'is_urgent' => false,
            ];
        }

        if ($this->status === 'inactive') {
            return [
                'message' => 'Evento en pausa',
                'type' => 'inactive',
                'days' => null,
                'is_overdue' => false,
                'is_urgent' => false,
            ];
        }

        // Estado active
        $now = now();
        $daysUntilStart = $now->diffInDays($this->start_date, false);
        $daysUntilEnd = $now->diffInDays($this->end_date, false);

        if ($daysUntilStart > 0) {
            // Evento aún no ha iniciado
            return [
                'message' => "{$daysUntilStart} día" . ($daysUntilStart !== 1 ? 's' : '') . " para iniciar",
                'type' => 'planning',
                'days' => $daysUntilStart,
                'is_overdue' => false,
                'is_urgent' => $daysUntilStart <= 7,
            ];
        }

        if ($daysUntilEnd >= 0) {
            // Evento en curso
            return [
                'message' => $daysUntilEnd > 0 
                    ? "{$daysUntilEnd} día" . ($daysUntilEnd !== 1 ? 's' : '') . " restante" . ($daysUntilEnd !== 1 ? 's' : '')
                    : 'Evento en curso',
                'type' => 'execution',
                'days' => $daysUntilEnd,
                'is_overdue' => false,
                'is_urgent' => $daysUntilEnd <= 7,
            ];
        }

        // Evento pasó la fecha de fin pero no está marcado como finished
        $daysSinceEnd = abs($daysUntilEnd);
        return [
            'message' => "Finalizado hace {$daysSinceEnd} día" . ($daysSinceEnd !== 1 ? 's' : '') . " (requiere finalización)",
            'type' => 'needs_finalization',
            'days' => $daysSinceEnd,
            'is_overdue' => true,
            'is_urgent' => true,
        ];
    }

    /**
     * Verificar si debe sugerirse la finalización del evento
     */
    public function shouldSuggestFinalization(): bool
    {
        if ($this->status === 'finished') {
            return false;
        }

        // Sugerir finalización si pasó la fecha de fin
        if ($this->isPostExecution()) {
            return true;
        }

        // Sugerir finalización si pasó end_date + 7 días
        $sevenDaysAfterEnd = $this->end_date->copy()->addDays(7);
        return now()->greaterThan($sevenDaysAfterEnd);
    }

    /**
     * Verificar si una acción es permitida según el estado y tipo de acción
     */
    public function canPerformAction(string $action, ?string $userRole = null): bool
    {
        // Si el evento está finalizado, solo permitir acciones de lectura/reutilización
        if ($this->status === 'finished') {
            return in_array($action, ['view', 'export', 'reuse_data']);
        }

        // Si el evento está inactivo, solo permitir lectura y reactivación
        if ($this->status === 'inactive') {
            return in_array($action, ['view', 'reactivate']);
        }

        // Para eventos activos, validar según la acción y fase
        switch ($action) {
            case 'create':
            case 'edit_structure':
            case 'delete':
                // Solo en fase de planificación
                return $this->isInPlanningPhase();

            case 'manage_committees':
            case 'manage_tasks':
            case 'manage_participants':
                // Solo en fase de planificación
                return $this->isInPlanningPhase();

            case 'execute_tasks':
            case 'report_progress':
            case 'report_incidents':
                // Solo en fase de ejecución
                return $this->isInExecutionPhase();

            case 'view':
            case 'export':
            case 'finalize':
                // Siempre permitido para eventos activos
                return true;

            default:
                return false;
        }
    }
}
