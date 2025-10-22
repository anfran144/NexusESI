<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Estado extends Model
{
    /**
     * Nombre de la tabla en la base de datos
     */
    protected $table = 'estados';

    /**
     * Los atributos que se pueden asignar masivamente
     */
    protected $fillable = [
        'nombre',
        'pais_id',
    ];

    /**
     * Los atributos que deben ser convertidos a tipos nativos
     */
    protected $casts = [
        'pais_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relación muchos a uno con País
     * Un estado pertenece a un país
     */
    public function pais(): BelongsTo
    {
        return $this->belongsTo(Pais::class, 'pais_id');
    }

    /**
     * Relación uno a muchos con Ciudades
     * Un estado puede tener múltiples ciudades
     */
    public function ciudades(): HasMany
    {
        return $this->hasMany(Ciudad::class, 'estado_id');
    }

    /**
     * Scope para filtrar por país
     */
    public function scopePorPais($query, $paisId)
    {
        return $query->where('pais_id', $paisId);
    }

    /**
     * Scope para buscar por nombre
     */
    public function scopePorNombre($query, $nombre)
    {
        return $query->where('nombre', 'like', "%{$nombre}%");
    }

    /**
     * Scope para obtener estados con sus ciudades
     */
    public function scopeConCiudades($query)
    {
        return $query->with('ciudades');
    }

    /**
     * Scope para obtener estados con su país
     */
    public function scopeConPais($query)
    {
        return $query->with('pais');
    }
}
