<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject, MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, HasRoles, Notifiable;

    /**
     * The guard name for Spatie permissions
     *
     * @var string
     */
    protected $guard_name = 'api';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'institution_id',
        'status',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'institution_id' => 'integer',
        ];
    }

    /**
     * Get the identifier that will be stored in the subject claim of the JWT.
     *
     * @return mixed
     */
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    /**
     * Return a key value array, containing any custom claims to be added to the JWT.
     *
     * @return array
     */
    public function getJWTCustomClaims()
    {
        return [
            'role' => $this->getRoleNames()->first() ?? 'user',
            'permissions' => $this->getAllPermissions()->pluck('name')->toArray(),
        ];
    }

    /**
     * Get user profile with role information
     */
    public function getProfileData(): array
    {
        $role = $this->getRoleNames()->first();
        $userRoles = $this->roles->map(function ($roleModel) {
            return [
                'id' => $roleModel->id,
                'name' => $roleModel->name,
                'display_name' => $this->getRoleDisplayName($roleModel->name),
            ];
        });

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'email_verified_at' => $this->email_verified_at,
            'institution_id' => $this->institution_id,
            'institution' => $this->institution,
            'status' => $this->status,
            'roles' => $userRoles,
            'permissions' => $this->getAllPermissions()->pluck('name')->toArray(),
            'role_display_name' => $this->getRoleDisplayName($role),
            'welcome_message' => $this->getWelcomeMessage($role),
            'dashboard_route' => $this->getDashboardRoute($role),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    /**
     * Get role display name
     */
    private function getRoleDisplayName(?string $role): string
    {
        return match ($role) {
            'admin' => 'Administrador',
            'coordinator' => 'Coordinador',
            'seedbed_leader' => 'Líder de Semillero',
            default => 'Usuario',
        };
    }

    /**
     * Get personalized welcome message
     */
    private function getWelcomeMessage(?string $role): string
    {
        return match ($role) {
            'admin' => "¡Bienvenido, {$this->name}! Desde aquí puedes gestionar todo el sistema NexusESI y supervisar todas las actividades.",
            'coordinator' => "¡Hola, {$this->name}! Como coordinador, puedes supervisar y gestionar las actividades de los semilleros de investigación.",
            'seedbed_leader' => "¡Bienvenido, {$this->name}! Como líder de semillero, puedes gestionar tu equipo y proyectos de investigación.",
            default => "¡Bienvenido, {$this->name}! Explora las funcionalidades disponibles para ti.",
        };
    }

    /**
     * Get dashboard route based on role
     */
    private function getDashboardRoute(?string $role): string
    {
        return match ($role) {
            'admin' => '/admin',
            'coordinator' => '/coordinator',
            'seedbed_leader' => '/seedbed-leader',
            default => '/',
        };
    }

    /**
     * Relación: Un usuario pertenece a una institución
     */
    public function institution()
    {
        return $this->belongsTo(Institucion::class, 'institution_id');
    }

    /**
     * Scope: Filtrar usuarios por institución
     */
    public function scopeByInstitution($query, $institutionId)
    {
        return $query->where('institution_id', $institutionId);
    }

    /**
     * Scope: Filtrar usuarios por estado
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope: Solo usuarios activos
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope: Solo usuarios pendientes de aprobación
     */
    public function scopePendingApproval($query)
    {
        return $query->where('status', 'pending_approval');
    }

    /**
     * Scope: Solo usuarios suspendidos
     */
    public function scopeSuspended($query)
    {
        return $query->where('status', 'suspended');
    }

    /**
     * Verificar si el usuario está activo
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Verificar si el usuario está pendiente de aprobación
     */
    public function isPendingApproval(): bool
    {
        return $this->status === 'pending_approval';
    }

    /**
     * Verificar si el usuario está suspendido
     */
    public function isSuspended(): bool
    {
        return $this->status === 'suspended';
    }

    /**
     * Relación: Eventos coordinados por el usuario
     */
    public function coordinatedEvents()
    {
        return $this->hasMany(Event::class, 'coordinator_id');
    }

    /**
     * Relación: Eventos en los que participa el usuario
     */
    public function participatedEvents()
    {
        return $this->belongsToMany(Event::class, 'event_participants')
            ->withTimestamps();
    }

    /**
     * Relación: Participaciones del usuario en eventos
     */
    public function eventParticipations()
    {
        return $this->hasMany(EventParticipant::class);
    }

    /**
     * Relación: Comités en los que participa el usuario
     */
    public function committees()
    {
        return $this->belongsToMany(Committee::class, 'committee_user')
            ->withPivot('assigned_at');
    }

    /**
     * Relación: Invitaciones a reuniones
     */
    public function meetingInvitations()
    {
        return $this->hasMany(MeetingInvitation::class);
    }

    /**
     * Relación: Asistencias a reuniones
     */
    public function meetingAttendances()
    {
        return $this->hasMany(MeetingAttendance::class);
    }

    /**
     * Verificar si el usuario puede participar en un evento
     * (Solo puede estar en un evento activo a la vez)
     */
    public function canParticipateInEvent(): bool
    {
        return ! $this->eventParticipations()
            ->whereHas('event', function ($query) {
                $query->whereIn('status', ['active', 'inactive']);
            })
            ->exists();
    }

    /**
     * Obtener el evento activo del usuario (si tiene uno)
     */
    public function activeEvent()
    {
        return $this->eventParticipations()
            ->whereHas('event', function ($query) {
                $query->whereIn('status', ['active', 'inactive']);
            })
            ->first();
    }
}
