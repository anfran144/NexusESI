<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use Carbon\Carbon;

final class Meeting extends Model
{
    protected $fillable = [
        'event_id',
        'coordinator_id',
        'title',
        'description',
        'scheduled_at',
        'location',
        'meeting_type',
        'qr_code',
        'qr_expires_at',
        'status',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'qr_expires_at' => 'datetime',
    ];

    /**
     * Relación con el evento
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * Relación con el coordinador
     */
    public function coordinator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'coordinator_id');
    }

    /**
     * Relación con las invitaciones
     */
    public function invitations(): HasMany
    {
        return $this->hasMany(MeetingInvitation::class);
    }

    /**
     * Relación con las asistencias
     */
    public function attendances(): HasMany
    {
        return $this->hasMany(MeetingAttendance::class);
    }

    /**
     * Generar código QR único
     */
    public function generateQrCode(): string
    {
        $token = Str::random(32);
        $this->qr_code = $token;
        
        // QR expira 1 hora después de la fecha programada
        $this->qr_expires_at = Carbon::parse($this->scheduled_at)->addHour();
        
        $this->save();
        
        return $token;
    }

    /**
     * Verificar si el QR es válido
     */
    public function isQrValid(): bool
    {
        if (!$this->qr_code || !$this->qr_expires_at) {
            return false;
        }

        return now()->lessThan($this->qr_expires_at);
    }

    /**
     * Obtener usuarios invitados
     */
    public function getInvitedUsers()
    {
        return $this->invitations()->with('user')->get()->pluck('user');
    }

    /**
     * Verificar si un usuario está invitado
     */
    public function isUserInvited(int $userId): bool
    {
        return $this->invitations()->where('user_id', $userId)->exists();
    }

    /**
     * Obtener la URL del check-in
     */
    public function getCheckInUrl(): ?string
    {
        if (!$this->qr_code) {
            return null;
        }

        // URL del frontend para el check-in
        $frontendUrl = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173'));
        return rtrim($frontendUrl, '/') . "/meetings/check-in/{$this->qr_code}";
    }
}
