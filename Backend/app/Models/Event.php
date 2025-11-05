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
}
