<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    protected $fillable = [
        'title',
        'description',
        'due_date',
        'status',
        'risk_level',
        'assigned_to_id',
        'committee_id',
        'event_id',
    ];

    protected $casts = [
        'due_date' => 'date',
    ];

    /**
     * Relación con el usuario asignado
     */
    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to_id');
    }

    /**
     * Relación con el evento
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * Relación con el comité (nullable)
     */
    public function committee(): BelongsTo
    {
        return $this->belongsTo(Committee::class);
    }

    /**
     * Relación con el progreso de la tarea
     */
    public function progress(): HasMany
    {
        return $this->hasMany(TaskProgress::class);
    }

    /**
     * Relación con las incidencias
     */
    public function incidents(): HasMany
    {
        return $this->hasMany(Incident::class);
    }

    /**
     * Relación con las alertas
     */
    public function alerts(): HasMany
    {
        return $this->hasMany(Alert::class);
    }

    /**
     * Calcular el nivel de riesgo basado en la fecha límite
     * Según especificación:
     * - Riesgo Bajo (Low): Más de 5 días
     * - Riesgo Medio (Medium): Entre 2 y 5 días
     * - Riesgo Alto (High): Menos de 2 días o vencida
     */
    public function calculateRiskLevel(): string
    {
        $daysUntilDue = now()->diffInDays($this->due_date, false);
        
        // Riesgo Alto: Fecha vencida (negativo)
        if ($daysUntilDue < 0) return 'High';
        
        // Riesgo Medio: Entre 2 y 5 días (inclusive)
        if ($daysUntilDue >= 2 && $daysUntilDue <= 5) return 'Medium';
        
        // Riesgo Alto: Menos de 2 días
        if ($daysUntilDue < 2) return 'High';
        
        // Riesgo Bajo: Más de 5 días
        return 'Low';
    }

    /**
     * Verificar si la tarea está vencida
     */
    public function isOverdue(): bool
    {
        return $this->due_date < now()->toDateString() && $this->status !== 'Completed';
    }

    /**
     * Scope para tareas asignadas a un usuario
     */
    public function scopeAssignedTo($query, $userId)
    {
        return $query->where('assigned_to_id', $userId);
    }

    /**
     * Scope para tareas por nivel de riesgo
     */
    public function scopeByRiskLevel($query, $riskLevel)
    {
        return $query->where('risk_level', $riskLevel);
    }

    /**
     * Scope para tareas por estado
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }
}
