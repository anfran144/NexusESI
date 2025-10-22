# Módulo del Sistema de Eventos

> Sistema completo de gestión de eventos con comités y participantes

---

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Estructura de Base de Datos](#estructura-de-base-de-datos)
3. [Modelos y Relaciones](#modelos-y-relaciones)
4. [Estados de Eventos](#estados-de-eventos)
5. [Sistema de Comités](#sistema-de-comités)
6. [Participación en Eventos](#participación-en-eventos)
7. [API Reference](#api-reference)
8. [Políticas de Autorización](#políticas-de-autorización)

---

## Descripción General

El sistema de eventos permite la gestión completa de eventos institucionales con:
- Creación y gestión de eventos
- Asignación de coordinadores
- Sistema de comités
- Participación de usuarios
- Control de acceso basado en roles

### Características

- ✅ CRUD completo de eventos
- ✅ Estados de eventos (planificación, en progreso, finalizado, cancelado)
- ✅ Gestión de comités por evento
- ✅ Participación de usuarios
- ✅ Restricción: un usuario en un evento activo a la vez
- ✅ Políticas de acceso por rol

---

## Estructura de Base de Datos

### Tabla: events

```sql
CREATE TABLE events (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    coordinator_id BIGINT UNSIGNED NOT NULL,
    institution_id BIGINT UNSIGNED NOT NULL,
    status ENUM('planificación', 'en_progreso', 'finalizado', 'cancelado') DEFAULT 'planificación',
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    
    FOREIGN KEY (coordinator_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (institution_id) REFERENCES instituciones(id) ON DELETE CASCADE,
    INDEX idx_coordinator (coordinator_id),
    INDEX idx_institution (institution_id),
    INDEX idx_status (status)
);
```

### Tabla: committees

```sql
CREATE TABLE committees (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    event_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    INDEX idx_event (event_id)
);
```

### Tabla: committee_user (Pivot)

```sql
CREATE TABLE committee_user (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    committee_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    assigned_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    
    FOREIGN KEY (committee_id) REFERENCES committees(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_committee_user (committee_id, user_id)
);
```

### Tabla: event_participants

```sql
CREATE TABLE event_participants (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    event_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_event_user (event_id, user_id)
);
```

---

## Modelos y Relaciones

### Modelo Event

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    protected $fillable = [
        'name',
        'description',
        'start_date',
        'end_date',
        'coordinator_id',
        'institution_id',
        'status',
    ];
    
    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];
    
    // Relación: Un evento tiene un coordinador
    public function coordinator()
    {
        return $this->belongsTo(User::class, 'coordinator_id');
    }
    
    // Relación: Un evento pertenece a una institución
    public function institution()
    {
        return $this->belongsTo(Institucion::class, 'institution_id');
    }
    
    // Relación: Un evento tiene muchos comités
    public function committees()
    {
        return $this->hasMany(Committee::class);
    }
    
    // Relación: Un evento tiene muchos participantes
    public function participants()
    {
        return $this->hasMany(EventParticipant::class);
    }
    
    // Relación many-to-many con usuarios
    public function users()
    {
        return $this->belongsToMany(User::class, 'event_participants')
                    ->withTimestamps();
    }
}
```

### Modelo Committee

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Committee extends Model
{
    protected $fillable = [
        'name',
        'description',
        'event_id',
    ];
    
    // Relación: Un comité pertenece a un evento
    public function event()
    {
        return $this->belongsTo(Event::class);
    }
    
    // Relación many-to-many: Un comité tiene muchos usuarios
    public function users()
    {
        return $this->belongsToMany(User::class, 'committee_user')
                    ->withPivot('assigned_at')
                    ->withTimestamps();
    }
}
```

### Modelo EventParticipant

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventParticipant extends Model
{
    protected $fillable = [
        'event_id',
        'user_id',
    ];
    
    // Relación: Participante pertenece a un evento
    public function event()
    {
        return $this->belongsTo(Event::class);
    }
    
    // Relación: Participante es un usuario
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
```

---

## Estados de Eventos

### Estados Disponibles

#### 1. Planificación
- **Valor**: `planificación`
- **Descripción**: Evento en fase de organización
- **Acciones permitidas**:
  - Editar evento
  - Agregar/remover comités
  - Cambiar participantes
  - Cancelar evento

#### 2. En Progreso
- **Valor**: `en_progreso`
- **Descripción**: Evento actualmente en ejecución
- **Acciones permitidas**:
  - Ver información
  - Agregar participantes
  - Finalizar evento
- **Restricciones**:
  - No se puede editar información básica
  - No se puede cancelar

#### 3. Finalizado
- **Valor**: `finalizado`
- **Descripción**: Evento completado
- **Acciones permitidas**:
  - Ver información (solo lectura)
- **Restricciones**:
  - No se permiten cambios
  - No visible para seedbed_leaders

#### 4. Cancelado
- **Valor**: `cancelado`
- **Descripción**: Evento cancelado
- **Acciones permitidas**:
  - Ver información (solo lectura)
- **Restricciones**:
  - No se permiten cambios

---

## Sistema de Comités

### Crear Comité

```http
POST /api/events/{event_id}/committees
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Comité de Logística",
  "description": "Encargado de la logística del evento"
}
```

### Asignar Usuarios a Comité

```http
POST /api/committees/{committee_id}/assign-users
Authorization: Bearer {token}
Content-Type: application/json

{
  "user_ids": [1, 2, 3]
}
```

### Listar Comités de un Evento

```http
GET /api/events/{event_id}/committees
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Comité de Logística",
      "description": "Encargado de la logística",
      "users_count": 3,
      "users": [
        {
          "id": 1,
          "name": "Usuario 1",
          "assigned_at": "2025-10-21T10:00:00.000000Z"
        }
      ]
    }
  ]
}
```

---

## Participación en Eventos

### Restricción Importante

**Un usuario solo puede estar en UN evento activo a la vez**

Eventos activos: `planificación` o `en_progreso`

### Participar en Evento

```http
POST /api/events/{event_id}/participate
Authorization: Bearer {token}
```

**Validaciones:**
- Usuario no debe estar en otro evento activo
- Evento debe estar en `planificación` o `en_progreso`
- Usuario debe ser de la misma institución del evento

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Te has inscrito exitosamente al evento",
  "data": {
    "event_id": 1,
    "user_id": 5,
    "event_name": "Semana de la Ciencia 2025"
  }
}
```

**Error - Ya participando:**
```json
{
  "success": false,
  "message": "Ya estás participando en otro evento activo",
  "current_event": {
    "id": 2,
    "name": "Evento Actual",
    "status": "en_progreso"
  }
}
```

### Listar Participantes

```http
GET /api/events/{event_id}/participants
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "event": {
      "id": 1,
      "name": "Semana de la Ciencia 2025"
    },
    "participants": [
      {
        "id": 1,
        "name": "Usuario 1",
        "email": "usuario1@example.com",
        "role": "seedbed_leader",
        "joined_at": "2025-10-21T10:00:00.000000Z"
      }
    ],
    "total": 15
  }
}
```

---

## API Reference

### Endpoints de Eventos

#### 1. Listar Eventos
```http
GET /api/events
Authorization: Bearer {token}
```

**Query Parameters:**
- `status` - Filtrar por estado
- `page` - Número de página
- `per_page` - Resultados por página

**Filtros por Rol:**
- **Admin**: Ve todos los eventos
- **Coordinator**: Ve solo sus eventos de su institución
- **Seedbed Leader**: Ve eventos de su institución (excepto finalizados)

#### 2. Crear Evento
```http
POST /api/events
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Semana de la Ciencia 2025",
  "description": "Evento anual de ciencia",
  "start_date": "2025-11-01",
  "end_date": "2025-11-05",
  "institution_id": 1
}
```

**Permisos**: Solo `coordinator` y `admin`

#### 3. Obtener Evento
```http
GET /api/events/{id}
Authorization: Bearer {token}
```

#### 4. Actualizar Evento
```http
PUT /api/events/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Semana de la Ciencia 2025 - Actualizado",
  "description": "Nueva descripción",
  "start_date": "2025-11-01",
  "end_date": "2025-11-07"
}
```

**Restricciones:**
- Solo el coordinador del evento puede actualizar
- Solo eventos en `planificación`

#### 5. Eliminar Evento
```http
DELETE /api/events/{id}
Authorization: Bearer {token}
```

**Restricciones:**
- Solo el coordinador puede eliminar
- Solo eventos en `planificación`

#### 6. Eventos Disponibles
```http
GET /api/events/available
Authorization: Bearer {token}
```

Devuelve eventos disponibles para participar (planificación o en_progreso, de la institución del usuario)

---

## Políticas de Autorización

### EventPolicy

```php
// Ver cualquier evento
public function viewAny(User $user): bool
{
    return $user->can('events.view');
}

// Ver un evento específico
public function view(User $user, Event $event): bool
{
    if ($user->hasRole('coordinator')) {
        return $event->coordinator_id === $user->id 
            && $event->institution_id === $user->institution_id;
    }
    
    if ($user->hasRole('seedbed_leader')) {
        return $event->institution_id === $user->institution_id 
            && $event->status !== 'finalizado';
    }
    
    return false;
}

// Crear evento
public function create(User $user): bool
{
    return $user->can('events.create');
}

// Actualizar evento
public function update(User $user, Event $event): bool
{
    if ($user->hasRole('coordinator') && $user->can('events.edit')) {
        return $event->coordinator_id === $user->id 
            && $event->institution_id === $user->institution_id;
    }
    
    return false;
}

// Eliminar evento
public function delete(User $user, Event $event): bool
{
    if ($user->hasRole('coordinator') && $user->can('events.delete')) {
        return $event->coordinator_id === $user->id 
            && $event->institution_id === $user->institution_id
            && $event->status === 'planificación';
    }
    
    return false;
}
```

---

## Archivos del Módulo

### Models
- `app/Models/Event.php`
- `app/Models/Committee.php`
- `app/Models/EventParticipant.php`

### Controllers
- `app/Http/Controllers/EventController.php`
- `app/Http/Controllers/CommitteeController.php`

### Policies
- `app/Policies/EventPolicy.php`

### Requests
- `app/Http/Requests/EventRequest.php`

### Resources
- `app/Http/Resources/EventResource.php`
- `app/Http/Resources/EventParticipantResource.php`

### Migraciones
- `database/migrations/2025_10_14_025240_create_events_table.php`
- `database/migrations/2025_10_14_025343_create_committees_table.php`
- `database/migrations/2025_10_14_025404_create_event_participants_table.php`
- `database/migrations/2025_10_14_025542_create_committee_user_table.php`
- `database/migrations/2025_10_18_050507_remove_role_from_committee_user_table.php`
- `database/migrations/2025_10_18_052007_remove_status_from_event_participants_table.php`

### Seeders
- `database/seeders/EventSeeder.php`

### Rutas
- `routes/api/events.php`

---

**Última actualización**: 21 de Octubre, 2025  
**Versión**: 1.0.0  
**Estado**: ✅ Producción Ready

