# Módulo de Gestión de Instituciones

> Sistema de gestión de instituciones educativas con integración geográfica

---

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Estructura de Base de Datos](#estructura-de-base-de-datos)
3. [Modelo y Relaciones](#modelo-y-relaciones)
4. [API Reference](#api-reference)
5. [Estados de Instituciones](#estados-de-instituciones)

---

## Descripción General

El módulo de gestión de instituciones permite administrar instituciones educativas asociadas a ubicaciones geográficas específicas.

### Características

- ✅ Gestión completa de instituciones
- ✅ Integración con sistema geográfico
- ✅ Estados de institución (activo/inactivo)
- ✅ Identificadores únicos
- ✅ Relación con usuarios
- ✅ Validaciones y políticas de acceso

---

## Estructura de Base de Datos

### Tabla: instituciones

```sql
CREATE TABLE instituciones (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(255) NOT NULL,
    identificador VARCHAR(255) NOT NULL UNIQUE,
    estado ENUM('activo', 'inactivo') DEFAULT 'activo',
    ciudad_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    
    FOREIGN KEY (ciudad_id) REFERENCES ciudades(id) ON DELETE CASCADE,
    INDEX idx_ciudad_id (ciudad_id),
    INDEX idx_nombre (nombre),
    INDEX idx_estado (estado),
    INDEX idx_ciudad_estado (ciudad_id, estado)
);
```

**Campos:**
- `id` - Identificador único
- `nombre` - Nombre de la institución
- `identificador` - Identificador único (ej: código, NIT)
- `estado` - Estado activo/inactivo
- `ciudad_id` - ID de la ciudad donde se ubica
- `created_at`, `updated_at` - Timestamps

**Restricciones:**
- `identificador` debe ser único
- `ciudad_id` debe existir en tabla `ciudades`
- CASCADE: Si se elimina una ciudad, se eliminan sus instituciones

---

## Modelo y Relaciones

### Modelo Institucion

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Institucion extends Model
{
    protected $table = 'instituciones';
    
    protected $fillable = [
        'nombre',
        'identificador',
        'estado',
        'ciudad_id',
    ];
    
    protected $casts = [
        'ciudad_id' => 'integer',
    ];
    
    // Relación: Una institución pertenece a una ciudad
    public function ciudad()
    {
        return $this->belongsTo(Ciudad::class, 'ciudad_id');
    }
    
    // Relación: Una institución tiene muchos usuarios
    public function usuarios()
    {
        return $this->hasMany(User::class, 'institution_id');
    }
    
    // Obtener estado del estado (provincia)
    public function estado()
    {
        return $this->hasOneThrough(
            Estado::class,
            Ciudad::class,
            'id',
            'id',
            'ciudad_id',
            'estado_id'
        );
    }
    
    // Obtener país
    public function pais()
    {
        return $this->hasOneThrough(
            Pais::class,
            Estado::class,
            'id',
            'id',
            'estado_id',
            'pais_id'
        )->through(Ciudad::class);
    }
    
    // Scopes
    public function scopeActivas($query)
    {
        return $query->where('estado', 'activo');
    }
    
    public function scopeInactivas($query)
    {
        return $query->where('estado', 'inactivo');
    }
    
    public function scopeDeCiudad($query, $ciudadId)
    {
        return $query->where('ciudad_id', $ciudadId);
    }
    
    public function scopeConUbicacion($query)
    {
        return $query->with(['ciudad.estado.pais']);
    }
    
    // Accessors
    public function getUbicacionCompletaAttribute()
    {
        $this->load(['ciudad.estado.pais']);
        
        return [
            'ciudad' => $this->ciudad->nombre,
            'estado' => $this->ciudad->estado->nombre,
            'pais' => $this->ciudad->estado->pais->nombre,
        ];
    }
    
    // Métodos de utilidad
    public function isActiva(): bool
    {
        return $this->estado === 'activo';
    }
    
    public function activar()
    {
        $this->update(['estado' => 'activo']);
    }
    
    public function desactivar()
    {
        $this->update(['estado' => 'inactivo']);
    }
}
```

---

## API Reference

### Endpoints de Instituciones

#### 1. Listar Instituciones
```http
GET /api/instituciones
```

**Query Parameters:**
- `estado` - Filtrar por estado (`activo` o `inactivo`)
- `ciudad_id` - Filtrar por ciudad
- `page` - Número de página
- `per_page` - Resultados por página
- `with` - Relaciones a incluir (`ciudad`, `ciudad.estado.pais`)

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "instituciones": [
      {
        "id": 1,
        "nombre": "Universidad de Antioquia",
        "identificador": "UdeA-001",
        "estado": "activo",
        "ciudad_id": 1,
        "ciudad": {
          "id": 1,
          "nombre": "Medellín",
          "estado": {
            "id": 1,
            "nombre": "Antioquia",
            "pais": {
              "id": 1,
              "nombre": "Colombia"
            }
          }
        },
        "created_at": "2025-10-21T10:00:00.000000Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total": 25,
      "per_page": 15
    }
  }
}
```

#### 2. Obtener Institución
```http
GET /api/instituciones/{id}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombre": "Universidad de Antioquia",
    "identificador": "UdeA-001",
    "estado": "activo",
    "ciudad_id": 1,
    "ubicacion_completa": {
      "ciudad": "Medellín",
      "estado": "Antioquia",
      "pais": "Colombia"
    },
    "total_usuarios": 150
  }
}
```

#### 3. Crear Institución (Admin)
```http
POST /api/admin/instituciones
Authorization: Bearer {token}
Content-Type: application/json

{
  "nombre": "Universidad Nacional",
  "identificador": "UNAL-001",
  "estado": "activo",
  "ciudad_id": 2
}
```

**Validaciones:**
- `nombre` - Requerido, máximo 255 caracteres
- `identificador` - Requerido, único, máximo 255 caracteres
- `estado` - Opcional, enum: `activo` o `inactivo`
- `ciudad_id` - Requerido, debe existir en tabla `ciudades`

**Respuesta:**
```json
{
  "success": true,
  "message": "Institución creada exitosamente",
  "data": {
    "id": 2,
    "nombre": "Universidad Nacional",
    "identificador": "UNAL-001",
    "estado": "activo"
  }
}
```

#### 4. Actualizar Institución
```http
PUT /api/admin/instituciones/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "nombre": "Universidad Nacional de Colombia",
  "identificador": "UNAL-001",
  "estado": "activo",
  "ciudad_id": 2
}
```

#### 5. Cambiar Estado
```http
PATCH /api/admin/instituciones/{id}/toggle-estado
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Estado actualizado exitosamente",
  "data": {
    "id": 1,
    "estado": "inactivo"
  }
}
```

#### 6. Eliminar Institución
```http
DELETE /api/admin/instituciones/{id}
Authorization: Bearer {token}
```

**Validación**: No se puede eliminar si tiene usuarios activos

**Respuesta:**
```json
{
  "success": true,
  "message": "Institución eliminada exitosamente"
}
```

### Endpoints de Cascada

#### Instituciones por Ciudad
```http
GET /api/ciudades/{id}/instituciones
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "ciudad": {
      "id": 1,
      "nombre": "Medellín"
    },
    "instituciones": [
      {
        "id": 1,
        "nombre": "Universidad de Antioquia",
        "estado": "activo"
      }
    ]
  }
}
```

---

## Estados de Instituciones

### Estados Disponibles

#### Estado: activo
- Institución operativa y funcional
- Puede tener usuarios activos
- Visible en listados públicos
- Disponible para registro de nuevos usuarios

#### Estado: inactivo
- Institución temporalmente inactiva
- Usuarios existentes mantienen acceso (según política)
- No disponible para nuevos registros
- Oculta en listados públicos por defecto

### Transiciones de Estado

```php
// Activar institución
$institucion->activar();

// Desactivar institución
$institucion->desactivar();

// Verificar estado
if ($institucion->isActiva()) {
    // Lógica para institución activa
}
```

### Política de Usuarios

Cuando se desactiva una institución:
- ✅ Usuarios existentes mantienen acceso
- ❌ No se permiten nuevos registros
- ⚠️ Se envía notificación a usuarios activos

---

## Seeders y Datos

### Datos de Ejemplo

```php
// database/seeders/InstitucionSeeder.php
Institucion::create([
    'nombre' => 'Universidad de Antioquia',
    'identificador' => 'UdeA-001',
    'estado' => 'activo',
    'ciudad_id' => 1, // Medellín
]);

Institucion::create([
    'nombre' => 'Universidad Nacional de Colombia',
    'identificador' => 'UNAL-001',
    'estado' => 'activo',
    'ciudad_id' => 2, // Bogotá
]);
```

### Ejecutar Seeder

```bash
php artisan db:seed --class=InstitucionSeeder
```

---

## Archivos del Módulo

### Models
- `app/Models/Institucion.php`

### Controllers
- `app/Http/Controllers/Api/InstitucionController.php`

### Policies
- `app/Policies/InstitucionPolicy.php`

### Requests
- `app/Http/Requests/InstitucionRequest.php`

### Migraciones
- `database/migrations/2025_10_03_052739_create_instituciones_table.php`

### Seeders
- `database/seeders/InstitucionSeeder.php`

### Rutas
- `routes/api/institutions.php`

---

**Última actualización**: 21 de Octubre, 2025  
**Versión**: 1.0.0  
**Estado**: ✅ Producción Ready

