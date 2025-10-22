<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class EventParticipant extends Model
{
    protected $fillable = [
        'user_id',
        'event_id',
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
}
