<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Pais extends Model
{
    /**
     * Nombre de la tabla en la base de datos
     */
    protected $table = 'paises';

    /**
     * Los atributos que se pueden asignar masivamente
     */
    protected $fillable = [
        'nombre',
        'codigo_iso',
    ];

    /**
     * Los atributos que deben ser convertidos a tipos nativos
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relación uno a muchos con Estados
     * Un país puede tener múltiples estados/departamentos
     */
    public function estados(): HasMany
    {
        return $this->hasMany(Estado::class, 'pais_id');
    }

    /**
     * Obtener todas las ciudades del país a través de sus estados
     */
    public function ciudades()
    {
        return $this->hasManyThrough(Ciudad::class, Estado::class, 'pais_id', 'estado_id');
    }

    /**
     * Scope para buscar por código ISO
     */
    public function scopePorCodigoIso($query, $codigoIso)
    {
        return $query->where('codigo_iso', $codigoIso);
    }

    /**
     * Scope para buscar por nombre
     */
    public function scopePorNombre($query, $nombre)
    {
        return $query->where('nombre', 'like', "%{$nombre}%");
    }
}
