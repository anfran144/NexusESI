<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

final class EventParticipant extends Model
{
    protected $fillable = [
        'user_id',
        'event_id',
        'participation_role',
        'is_active',
        'ended_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'ended_at' => 'datetime',
    ];

    /**
     * Relación con el usuario participante
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relación con el evento
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * Scope para obtener solo participaciones activas
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope para obtener solo participaciones históricas
     */
    public function scopeHistorical(Builder $query): Builder
    {
        return $query->where('is_active', false);
    }

    /**
     * Scope para filtrar por rol de participación
     */
    public function scopeByRole(Builder $query, string $role): Builder
    {
        return $query->where('participation_role', $role);
    }

    /**
     * Marcar participación como finalizada
     */
    public function markAsFinished(): void
    {
        $this->update([
            'is_active' => false,
            'ended_at' => now(),
        ]);
    }
}
