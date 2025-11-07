<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class MeetingInvitation extends Model
{
    protected $fillable = [
        'meeting_id',
        'user_id',
        'committee_id',
        'status',
        'invited_at',
        'responded_at',
    ];

    protected $casts = [
        'invited_at' => 'datetime',
        'responded_at' => 'datetime',
    ];

    /**
     * Relación con la reunión
     */
    public function meeting(): BelongsTo
    {
        return $this->belongsTo(Meeting::class);
    }

    /**
     * Relación con el usuario invitado
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relación con el comité (si aplica)
     */
    public function committee(): BelongsTo
    {
        return $this->belongsTo(Committee::class);
    }

    /**
     * Aceptar invitación
     */
    public function accept(): void
    {
        $this->status = 'accepted';
        $this->responded_at = now();
        $this->save();
    }

    /**
     * Rechazar invitación
     */
    public function decline(): void
    {
        $this->status = 'declined';
        $this->responded_at = now();
        $this->save();
    }

    /**
     * Verificar si está pendiente
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Verificar si está aceptada
     */
    public function isAccepted(): bool
    {
        return $this->status === 'accepted';
    }

    /**
     * Verificar si está rechazada
     */
    public function isDeclined(): bool
    {
        return $this->status === 'declined';
    }
}
