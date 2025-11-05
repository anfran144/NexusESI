<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Incident extends Model
{
    protected $fillable = [
        'description',
        'status',
        'task_id',
        'reported_by_id',
        'file_name',
        'file_path',
        'solution_task_id',
    ];

    /**
     * Relación con la tarea
     */
    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    /**
     * Relación con el usuario que reportó la incidencia
     */
    public function reportedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_by_id');
    }

    /**
     * Relación con la tarea de solución
     */
    public function solutionTask(): BelongsTo
    {
        return $this->belongsTo(Task::class, 'solution_task_id');
    }

    /**
     * Scope para incidencias reportadas
     */
    public function scopeReported($query)
    {
        return $query->where('status', 'Reported');
    }

    /**
     * Scope para incidencias resueltas
     */
    public function scopeResolved($query)
    {
        return $query->where('status', 'Resolved');
    }
}
