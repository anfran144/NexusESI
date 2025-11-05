<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class Committee extends Model
{
    protected $fillable = [
        'name',
        'event_id',
    ];

    /**
     * Relación con el evento al que pertenece el comité
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * Relación many-to-many con usuarios
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'committee_user')
            ->withPivot('assigned_at');
    }

    /**
     * Relación con las tareas del comité
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }
}
