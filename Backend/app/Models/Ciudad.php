<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Ciudad extends Model
{
    /**
     * Nombre de la tabla en la base de datos
     */
    protected $table = 'ciudades';

    /**
     * Los atributos que se pueden asignar masivamente
     */
    protected $fillable = [
        'nombre',
        'estado_id',
    ];

    /**
     * Los atributos que deben ser convertidos a tipos nativos
     */
    protected $casts = [
        'estado_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relación muchos a uno con Estado
     * Una ciudad pertenece a un estado
     */
    public function estado(): BelongsTo
    {
        return $this->belongsTo(Estado::class, 'estado_id');
    }

    /**
     * Accessor para obtener el país de la ciudad (a través del estado)
     * Una ciudad pertenece a un país a través de su estado
     */
    public function getPaisAttribute()
    {
        return $this->estado?->pais;
    }

    /**
     * Scope para filtrar por estado
     */
    public function scopePorEstado($query, $estadoId)
    {
        return $query->where('estado_id', $estadoId);
    }

    /**
     * Scope para filtrar por país a través del estado
     */
    public function scopePorPais($query, $paisId)
    {
        return $query->whereHas('estado', function ($q) use ($paisId) {
            $q->where('pais_id', $paisId);
        });
    }

    /**
     * Scope para buscar por nombre
     */
    public function scopePorNombre($query, $nombre)
    {
        return $query->where('nombre', 'like', "%{$nombre}%");
    }

    /**
     * Scope para obtener ciudades con su estado
     */
    public function scopeConEstado($query)
    {
        return $query->with('estado');
    }

    /**
     * Scope para obtener ciudades con estado y país
     */
    public function scopeConEstadoYPais($query)
    {
        return $query->with(['estado.pais']);
    }

    /**
     * Scope para búsqueda jerárquica completa
     */
    public function scopeBusquedaJerarquica($query, $termino)
    {
        return $query->where('nombre', 'like', "%{$termino}%")
            ->orWhereHas('estado', function ($q) use ($termino) {
                $q->where('nombre', 'like', "%{$termino}%");
            })
            ->orWhereHas('estado.pais', function ($q) use ($termino) {
                $q->where('nombre', 'like', "%{$termino}%")
                    ->orWhere('codigo_iso', 'like', "%{$termino}%");
            });
    }

    /**
     * Scope para búsqueda jerárquica avanzada con múltiples parámetros
     */
    public function scopeBusquedaJerarquicaAvanzada($query, $pais = null, $estado = null, $ciudad = null)
    {
        return $query->when($pais, function ($q) use ($pais) {
            $q->whereHas('estado.pais', function ($subQ) use ($pais) {
                $subQ->where('nombre', 'like', "%{$pais}%")
                    ->orWhere('codigo_iso', $pais);
            });
        })
            ->when($estado, function ($q) use ($estado) {
                $q->whereHas('estado', function ($subQ) use ($estado) {
                    $subQ->where('nombre', 'like', "%{$estado}%");
                });
            })
            ->when($ciudad, function ($q) use ($ciudad) {
                $q->where('nombre', 'like', "%{$ciudad}%");
            });
    }

    /**
     * Relación uno a muchos con Instituciones
     * Una ciudad puede tener múltiples instituciones
     */
    public function instituciones()
    {
        return $this->hasMany(Institucion::class, 'ciudad_id');
    }

    /**
     * Relación uno a muchos con Instituciones activas
     */
    public function institucionesActivas()
    {
        return $this->hasMany(Institucion::class, 'ciudad_id')
            ->where('estado', 'activo');
    }

    /**
     * Relación uno a muchos con Instituciones inactivas
     */
    public function institucionesInactivas()
    {
        return $this->hasMany(Institucion::class, 'ciudad_id')
            ->where('estado', 'inactivo');
    }
}
