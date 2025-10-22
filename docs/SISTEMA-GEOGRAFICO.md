# Módulo del Sistema Geográfico

> Sistema jerárquico de ubicaciones geográficas: Países → Estados → Ciudades

---

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Estructura de Base de Datos](#estructura-de-base-de-datos)
3. [Modelos y Relaciones](#modelos-y-relaciones)
4. [API Reference](#api-reference)
5. [Seeders y Datos](#seeders-y-datos)

---

## Descripción General

El sistema geográfico implementa una estructura jerárquica de ubicaciones:
- **Países** (nivel 1)
- **Estados/Provincias** (nivel 2, pertenecen a un país)
- **Ciudades** (nivel 3, pertenecen a un estado)

### Características

- ✅ Estructura jerárquica con integridad referencial
- ✅ Cascada de eliminación automática
- ✅ Validaciones únicas por nivel
- ✅ Índices optimizados para consultas
- ✅ API completa para obtener datos en cascada
- ✅ Seeders con datos reales de América Latina

---

## Estructura de Base de Datos

### Tabla: paises

```sql
CREATE TABLE paises (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(255) NOT NULL,
    codigo_iso VARCHAR(3) NOT NULL UNIQUE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    
    INDEX idx_nombre (nombre),
    INDEX idx_codigo_iso (codigo_iso)
);
```

**Campos:**
- `id` - Identificador único
- `nombre` - Nombre del país (ej: "Colombia")
- `codigo_iso` - Código ISO 3166-1 alpha-3 (ej: "COL")
- `created_at`, `updated_at` - Timestamps

**Restricciones:**
- `codigo_iso` debe ser único
- `nombre` debe ser único

### Tabla: estados

```sql
CREATE TABLE estados (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(255) NOT NULL,
    pais_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    
    FOREIGN KEY (pais_id) REFERENCES paises(id) ON DELETE CASCADE,
    UNIQUE KEY unique_estado_pais (nombre, pais_id),
    INDEX idx_pais_id (pais_id),
    INDEX idx_nombre (nombre)
);
```

**Campos:**
- `id` - Identificador único
- `nombre` - Nombre del estado/provincia
- `pais_id` - ID del país al que pertenece
- `created_at`, `updated_at` - Timestamps

**Restricciones:**
- `pais_id` debe existir en tabla `paises`
- Combinación `(nombre, pais_id)` debe ser única
- CASCADE: Si se elimina un país, se eliminan sus estados

### Tabla: ciudades

```sql
CREATE TABLE ciudades (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(255) NOT NULL,
    estado_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    
    FOREIGN KEY (estado_id) REFERENCES estados(id) ON DELETE CASCADE,
    UNIQUE KEY unique_ciudad_estado (nombre, estado_id),
    INDEX idx_estado_id (estado_id),
    INDEX idx_nombre (nombre)
);
```

**Campos:**
- `id` - Identificador único
- `nombre` - Nombre de la ciudad
- `estado_id` - ID del estado al que pertenece
- `created_at`, `updated_at` - Timestamps

**Restricciones:**
- `estado_id` debe existir en tabla `estados`
- Combinación `(nombre, estado_id)` debe ser única
- CASCADE: Si se elimina un estado, se eliminan sus ciudades

---

## Modelos y Relaciones

### Modelo Pais

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pais extends Model
{
    protected $table = 'paises';
    
    protected $fillable = [
        'nombre',
        'codigo_iso',
    ];
    
    // Relación: Un país tiene muchos estados
    public function estados()
    {
        return $this->hasMany(Estado::class, 'pais_id');
    }
    
    // Obtener todas las ciudades del país (a través de estados)
    public function ciudades()
    {
        return $this->hasManyThrough(Ciudad::class, Estado::class, 'pais_id', 'estado_id');
    }
    
    // Scope: Países con estados
    public function scopeConEstados($query)
    {
        return $query->has('estados');
    }
}
```

### Modelo Estado

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Estado extends Model
{
    protected $table = 'estados';
    
    protected $fillable = [
        'nombre',
        'pais_id',
    ];
    
    protected $casts = [
        'pais_id' => 'integer',
    ];
    
    // Relación: Un estado pertenece a un país
    public function pais()
    {
        return $this->belongsTo(Pais::class, 'pais_id');
    }
    
    // Relación: Un estado tiene muchas ciudades
    public function ciudades()
    {
        return $this->hasMany(Ciudad::class, 'estado_id');
    }
    
    // Scope: Estados de un país específico
    public function scopeDePais($query, $paisId)
    {
        return $query->where('pais_id', $paisId);
    }
    
    // Scope: Estados con ciudades
    public function scopeConCiudades($query)
    {
        return $query->has('ciudades');
    }
}
```

### Modelo Ciudad

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ciudad extends Model
{
    protected $table = 'ciudades';
    
    protected $fillable = [
        'nombre',
        'estado_id',
    ];
    
    protected $casts = [
        'estado_id' => 'integer',
    ];
    
    // Relación: Una ciudad pertenece a un estado
    public function estado()
    {
        return $this->belongsTo(Estado::class, 'estado_id');
    }
    
    // Obtener el país de la ciudad (a través del estado)
    public function pais()
    {
        return $this->hasOneThrough(
            Pais::class,
            Estado::class,
            'id',
            'id',
            'estado_id',
            'pais_id'
        );
    }
    
    // Relación: Una ciudad tiene muchas instituciones
    public function instituciones()
    {
        return $this->hasMany(Institucion::class, 'ciudad_id');
    }
    
    // Scope: Ciudades de un estado específico
    public function scopeDeEstado($query, $estadoId)
    {
        return $query->where('estado_id', $estadoId);
    }
    
    // Accessor: Obtener nombre completo con estado y país
    public function getNombreCompletoAttribute()
    {
        $this->load(['estado.pais']);
        return "{$this->nombre}, {$this->estado->nombre}, {$this->estado->pais->nombre}";
    }
}
```

---

## API Reference

### Endpoints de Países

#### 1. Listar Países
```http
GET /api/paises
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Colombia",
      "codigo_iso": "COL",
      "created_at": "2025-10-21T10:00:00.000000Z",
      "updated_at": "2025-10-21T10:00:00.000000Z"
    }
  ]
}
```

#### 2. Obtener País con Estados
```http
GET /api/paises/{id}?with=estados
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombre": "Colombia",
    "codigo_iso": "COL",
    "estados": [
      {
        "id": 1,
        "nombre": "Antioquia",
        "pais_id": 1
      }
    ]
  }
}
```

### Endpoints de Estados

#### 1. Listar Estados
```http
GET /api/estados
```

#### 2. Listar Estados de un País
```http
GET /api/estados?pais_id=1
```

**Query Parameters:**
- `pais_id` - ID del país
- `with` - Relaciones a incluir (`pais`, `ciudades`)

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Antioquia",
      "pais_id": 1,
      "pais": {
        "id": 1,
        "nombre": "Colombia"
      }
    }
  ]
}
```

### Endpoints de Ciudades

#### 1. Listar Ciudades
```http
GET /api/ciudades
```

#### 2. Listar Ciudades de un Estado
```http
GET /api/ciudades?estado_id=1
```

**Query Parameters:**
- `estado_id` - ID del estado
- `with` - Relaciones a incluir (`estado`, `estado.pais`)

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Medellín",
      "estado_id": 1,
      "estado": {
        "id": 1,
        "nombre": "Antioquia",
        "pais": {
          "id": 1,
          "nombre": "Colombia"
        }
      }
    }
  ]
}
```

### Endpoint de Cascada

#### Obtener Jerarquía Completa
```http
GET /api/locations/hierarchy
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "paises": [
      {
        "id": 1,
        "nombre": "Colombia",
        "estados": [
          {
            "id": 1,
            "nombre": "Antioquia",
            "ciudades": [
              {
                "id": 1,
                "nombre": "Medellín"
              }
            ]
          }
        ]
      }
    ]
  }
}
```

---

## Seeders y Datos

### Datos Incluidos

**Países (6):**
- 🇨🇴 Colombia (COL)
- 🇲🇽 México (MEX)
- 🇦🇷 Argentina (ARG)
- 🇵🇪 Perú (PER)
- 🇨🇱 Chile (CHL)
- 🇪🇨 Ecuador (ECU)

**Estados por País:**
- Colombia: Antioquia, Cundinamarca, Valle del Cauca, etc.
- México: Ciudad de México, Jalisco, Nuevo León, etc.
- Argentina: Buenos Aires, Córdoba, Santa Fe, etc.

**Ciudades Principales:**
- Colombia: Medellín, Bogotá, Cali, Barranquilla, etc.
- México: Ciudad de México, Guadalajara, Monterrey, etc.
- Argentina: Buenos Aires, Córdoba, Rosario, etc.

### Ejecutar Seeders

```bash
# Ejecutar todos los seeders
php artisan db:seed

# Solo seeders geográficos
php artisan db:seed --class=PaisSeeder
php artisan db:seed --class=EstadoSeeder
php artisan db:seed --class=CiudadSeeder
```

### Orden de Ejecución

**Importante**: Los seeders deben ejecutarse en orden jerárquico:

1. `PaisSeeder` - Primero los países
2. `EstadoSeeder` - Luego los estados (requieren países)
3. `CiudadSeeder` - Finalmente las ciudades (requieren estados)

---

## Archivos del Módulo

### Models
- `app/Models/Pais.php`
- `app/Models/Estado.php`
- `app/Models/Ciudad.php`

### Controllers
- `app/Http/Controllers/Api/LocationController.php`

### Policies
- `app/Policies/PaisPolicy.php`
- `app/Policies/EstadoPolicy.php`
- `app/Policies/CiudadPolicy.php`

### Migraciones
- `database/migrations/2025_10_03_045647_create_paises_table.php`
- `database/migrations/2025_10_03_045708_create_estados_table.php`
- `database/migrations/2025_10_03_045722_create_ciudades_table.php`

### Seeders
- `database/seeders/PaisSeeder.php`
- `database/seeders/EstadoSeeder.php`
- `database/seeders/CiudadSeeder.php`

### Rutas
- `routes/api/locations.php`

---

**Última actualización**: 21 de Octubre, 2025  
**Versión**: 1.0.0  
**Estado**: ✅ Producción Ready

