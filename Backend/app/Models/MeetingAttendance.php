<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class MeetingAttendance extends Model
{
    protected $fillable = [
        'meeting_id',
        'user_id',
        'checked_in_at',
        'checked_in_via',
        'device_info',
        'ip_address',
    ];

    protected $casts = [
        'checked_in_at' => 'datetime',
    ];

    /**
     * Relación con la reunión
     */
    public function meeting(): BelongsTo
    {
        return $this->belongsTo(Meeting::class);
    }

    /**
     * Relación con el usuario
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
