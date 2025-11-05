<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaskProgress extends Model
{
    protected $fillable = [
        'description',
        'file_name',
        'file_path',
        'task_id',
        'user_id',
    ];

    /**
     * Relación con la tarea
     */
    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    /**
     * Relación con el usuario que reportó el progreso
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
