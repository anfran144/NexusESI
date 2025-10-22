<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Institucion extends Model
{
    use HasFactory;

    /**
     * Nombre de la tabla en la base de datos
     */
    protected $table = 'instituciones';

    /**
     * Los atributos que se pueden asignar masivamente
     */
    protected $fillable = [
        'nombre',
        'identificador',
        'estado',
        'ciudad_id',
    ];

    /**
     * Los atributos que deben ser convertidos a tipos nativos
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relación: Una institución pertenece a una ciudad
     */
    public function ciudad(): BelongsTo
    {
        return $this->belongsTo(Ciudad::class, 'ciudad_id');
    }

    /**
     * Accessor: Obtener el estado geográfico de la institución a través de la ciudad
     */
    public function getEstadoGeograficoAttribute()
    {
        return $this->ciudad?->estado;
    }

    /**
     * Accessor: Obtener el país de la institución a través de la ciudad
     */
    public function getPaisAttribute()
    {
        return $this->ciudad?->estado?->pais;
    }

    /**
     * Scope: Filtrar instituciones por ciudad
     */
    public function scopePorCiudad($query, $ciudadId)
    {
        return $query->where('ciudad_id', $ciudadId);
    }

    /**
     * Scope: Filtrar instituciones por estado
     */
    public function scopePorEstado($query, $estadoId)
    {
        return $query->whereHas('ciudad', function ($q) use ($estadoId) {
            $q->where('estado_id', $estadoId);
        });
    }

    /**
     * Scope: Filtrar instituciones por país
     */
    public function scopePorPais($query, $paisId)
    {
        return $query->whereHas('ciudad.estado', function ($q) use ($paisId) {
            $q->where('pais_id', $paisId);
        });
    }

    /**
     * Scope: Filtrar instituciones por estado (activo/inactivo)
     */
    public function scopePorEstadoInstitucion($query, $estado)
    {
        return $query->where('estado', $estado);
    }

    /**
     * Scope: Solo instituciones activas
     */
    public function scopeActivas($query)
    {
        return $query->where('estado', 'activo');
    }

    /**
     * Scope: Solo instituciones inactivas
     */
    public function scopeInactivas($query)
    {
        return $query->where('estado', 'inactivo');
    }

    /**
     * Scope: Buscar por nombre
     */
    public function scopePorNombre($query, $nombre)
    {
        return $query->where('nombre', 'like', '%'.$nombre.'%');
    }

    /**
     * Scope: Buscar por identificador
     */
    public function scopePorIdentificador($query, $identificador)
    {
        return $query->where('identificador', 'like', '%'.$identificador.'%');
    }

    /**
     * Scope: Incluir datos de la ciudad
     */
    public function scopeConCiudad($query)
    {
        return $query->with('ciudad');
    }

    /**
     * Scope: Incluir datos de la ciudad y estado
     */
    public function scopeConCiudadYEstado($query)
    {
        return $query->with(['ciudad', 'ciudad.estado']);
    }

    /**
     * Scope: Incluir datos completos de ubicación (ciudad, estado, país)
     */
    public function scopeConUbicacionCompleta($query)
    {
        return $query->with(['ciudad', 'ciudad.estado', 'ciudad.estado.pais']);
    }

    /**
     * Scope: Búsqueda jerárquica por término
     */
    public function scopeBusquedaJerarquica($query, $termino)
    {
        return $query->where(function ($q) use ($termino) {
            $q->where('nombre', 'like', '%'.$termino.'%')
                ->orWhere('identificador', 'like', '%'.$termino.'%')
                ->orWhereHas('ciudad', function ($ciudadQuery) use ($termino) {
                    $ciudadQuery->where('nombre', 'like', '%'.$termino.'%')
                        ->orWhereHas('estado', function ($estadoQuery) use ($termino) {
                            $estadoQuery->where('nombre', 'like', '%'.$termino.'%')
                                ->orWhereHas('pais', function ($paisQuery) use ($termino) {
                                    $paisQuery->where('nombre', 'like', '%'.$termino.'%')
                                        ->orWhere('codigo_iso', 'like', '%'.$termino.'%');
                                });
                        });
                });
        });
    }

    /**
     * Relación: Una institución tiene muchos usuarios
     */
    public function users()
    {
        return $this->hasMany(User::class, 'institution_id');
    }

    /**
     * Relación: Usuarios activos de la institución
     */
    public function activeUsers()
    {
        return $this->hasMany(User::class, 'institution_id')
            ->where('status', 'active');
    }

    /**
     * Relación: Usuarios pendientes de aprobación de la institución
     */
    public function pendingUsers()
    {
        return $this->hasMany(User::class, 'institution_id')
            ->where('status', 'pending_approval');
    }

    /**
     * Relación: Usuarios suspendidos de la institución
     */
    public function suspendedUsers()
    {
        return $this->hasMany(User::class, 'institution_id')
            ->where('status', 'suspended');
    }
}
