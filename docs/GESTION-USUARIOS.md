# Módulo de Gestión de Usuarios

> Sistema completo de gestión de usuarios con roles y permisos usando Spatie Laravel-Permission

---

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Sistema de Roles](#sistema-de-roles)
3. [Sistema de Permisos](#sistema-de-permisos)
4. [Gestión de Usuarios](#gestión-de-usuarios)
5. [API Reference](#api-reference)
6. [Seguridad y Autorización](#seguridad-y-autorización)

---

## Descripción General

El módulo de gestión de usuarios implementa un sistema completo de control de acceso basado en roles (RBAC) utilizando **Spatie Laravel-Permission**.

### Características Principales

- ✅ Sistema de roles jerárquico
- ✅ Permisos granulares
- ✅ Asignación dinámica de roles
- ✅ Middleware de autorización
- ✅ Gestión de estados de usuario
- ✅ Integración con instituciones

---

## Sistema de Roles

### Roles Implementados

#### 1. Admin (Administrador)
**Descripción**: Administrador del sistema con acceso completo

**Permisos**:
- Gestión completa de usuarios
- Gestión de roles y permisos
- Gestión de instituciones
- Gestión de ubicaciones geográficas
- Gestión de eventos
- Acceso a estadísticas del sistema

**Dashboard**: `/admin`

#### 2. Coordinator (Coordinador)
**Descripción**: Coordinador de semilleros de investigación

**Permisos**:
- Supervisar semilleros
- Gestionar actividades
- Ver reportes
- Aprobar proyectos

**Dashboard**: `/coordinator`

#### 3. Seedbed Leader (Líder de Semillero)
**Descripción**: Líder de un semillero específico

**Permisos**:
- Gestionar su equipo
- Gestionar proyectos del semillero
- Crear actividades
- Ver estadísticas del semillero

**Dashboard**: `/seedbed-leader`

### Estructura de Base de Datos

```sql
-- Tabla de roles
CREATE TABLE roles (
    id BIGINT UNSIGNED PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    guard_name VARCHAR(255) NOT NULL DEFAULT 'api',
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    UNIQUE KEY (name, guard_name)
);

-- Tabla intermedia usuarios-roles
CREATE TABLE model_has_roles (
    role_id BIGINT UNSIGNED NOT NULL,
    model_type VARCHAR(255) NOT NULL,
    model_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (role_id, model_id, model_type),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);
```

### Asignación de Roles

```php
// Asignar rol a usuario
$user->assignRole('admin');

// Asignar múltiples roles
$user->assignRole(['admin', 'coordinator']);

// Remover rol
$user->removeRole('admin');

// Sincronizar roles (reemplaza todos)
$user->syncRoles(['coordinator']);

// Verificar rol
if ($user->hasRole('admin')) {
    // Usuario es admin
}

// Verificar cualquier rol
if ($user->hasAnyRole(['admin', 'coordinator'])) {
    // Usuario tiene alguno de estos roles
}
```

---

## Sistema de Permisos

### Permisos por Categoría

#### Gestión de Usuarios
- `users.view` - Ver lista de usuarios
- `users.create` - Crear usuarios
- `users.edit` - Editar usuarios
- `users.delete` - Eliminar usuarios
- `users.approve` - Aprobar usuarios pendientes

#### Gestión de Roles
- `roles.view` - Ver roles
- `roles.create` - Crear roles
- `roles.edit` - Editar roles
- `roles.delete` - Eliminar roles
- `roles.assign` - Asignar roles

#### Gestión de Instituciones
- `institutions.view` - Ver instituciones
- `institutions.create` - Crear instituciones
- `institutions.edit` - Editar instituciones
- `institutions.delete` - Eliminar instituciones

#### Gestión de Eventos
- `events.view` - Ver eventos
- `events.create` - Crear eventos
- `events.edit` - Editar eventos
- `events.delete` - Eliminar eventos
- `events.manage` - Gestión completa de eventos

### Uso de Permisos

```php
// Dar permiso a un rol
$role = Role::findByName('coordinator');
$role->givePermissionTo('events.view');

// Dar permiso directo a usuario
$user->givePermissionTo('users.edit');

// Verificar permiso
if ($user->can('users.edit')) {
    // Usuario tiene permiso
}

// Verificar cualquier permiso
if ($user->hasAnyPermission(['users.edit', 'users.view'])) {
    // Usuario tiene alguno de estos permisos
}

// Verificar todos los permisos
if ($user->hasAllPermissions(['users.edit', 'users.view'])) {
    // Usuario tiene todos estos permisos
}
```

### Middleware de Autorización

```php
// En routes/api.php
Route::middleware(['auth:api', 'role:admin'])->group(function () {
    Route::get('/admin/users', [AdminController::class, 'index']);
});

Route::middleware(['auth:api', 'permission:users.edit'])->group(function () {
    Route::put('/users/{id}', [UserController::class, 'update']);
});

// Múltiples roles o permisos
Route::middleware(['auth:api', 'role:admin|coordinator'])->group(function () {
    // Ruta accesible por admin o coordinator
});
```

---

## Gestión de Usuarios

### Estados de Usuario

```php
enum UserStatus {
    PENDING_APPROVAL = 'pending_approval';
    ACTIVE = 'active';
    SUSPENDED = 'suspended';
}
```

**Estados:**
- `pending_approval` - Usuario registrado, pendiente de aprobación
- `active` - Usuario activo y aprobado
- `suspended` - Usuario suspendido

### Modelo User

```php
class User extends Authenticatable implements JWTSubject, MustVerifyEmail
{
    use HasFactory, Notifiable, HasRoles;
    
    protected $guard_name = 'api';
    
    protected $fillable = [
        'name',
        'email',
        'password',
        'institution_id',
        'status',
    ];
    
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'institution_id' => 'integer',
    ];
    
    // Relaciones
    public function institution()
    {
        return $this->belongsTo(Institucion::class, 'institution_id');
    }
    
    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
    
    public function scopePendingApproval($query)
    {
        return $query->where('status', 'pending_approval');
    }
}
```

### Campos del Usuario

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | BIGINT | ID único del usuario |
| `name` | VARCHAR(255) | Nombre completo |
| `email` | VARCHAR(255) | Email único |
| `email_verified_at` | TIMESTAMP | Fecha de verificación de email |
| `password` | VARCHAR(255) | Contraseña hasheada |
| `institution_id` | BIGINT | ID de la institución |
| `status` | VARCHAR(255) | Estado del usuario |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Fecha de actualización |

---

## API Reference

### Endpoints de Usuarios

#### 1. Listar Usuarios
```http
GET /api/users
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` - Número de página
- `per_page` - Resultados por página
- `status` - Filtrar por estado
- `role` - Filtrar por rol
- `institution_id` - Filtrar por institución

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "name": "Admin User",
        "email": "admin@nexusesi.com",
        "status": "active",
        "roles": ["admin"],
        "institution": { /* datos */ }
      }
    ],
    "pagination": {
      "current_page": 1,
      "total": 50,
      "per_page": 15
    }
  }
}
```

#### 2. Obtener Usuario
```http
GET /api/users/{id}
Authorization: Bearer {token}
```

#### 3. Crear Usuario (Admin)
```http
POST /api/admin/users
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Nuevo Usuario",
  "email": "nuevo@example.com",
  "password": "Password123",
  "institution_id": 1,
  "role": "coordinator"
}
```

#### 4. Actualizar Usuario
```http
PUT /api/users/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Nombre Actualizado",
  "email": "actualizado@example.com",
  "institution_id": 2
}
```

#### 5. Aprobar Usuario
```http
POST /api/admin/users/{id}/approve
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Usuario aprobado exitosamente",
  "data": {
    "user_id": 1,
    "status": "active"
  }
}
```

#### 6. Suspender Usuario
```http
POST /api/admin/users/{id}/suspend
Authorization: Bearer {token}
```

#### 7. Cambiar Rol
```http
POST /api/admin/users/{id}/change-role
Authorization: Bearer {token}
Content-Type: application/json

{
  "role": "coordinator"
}
```

### Endpoints de Roles

#### 1. Listar Roles
```http
GET /api/roles
Authorization: Bearer {token}
```

#### 2. Crear Rol
```http
POST /api/roles
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "nuevo-rol",
  "permissions": ["users.view", "events.view"]
}
```

#### 3. Asignar Permisos a Rol
```http
POST /api/roles/{id}/permissions
Authorization: Bearer {token}
Content-Type: application/json

{
  "permissions": ["users.edit", "users.delete"]
}
```

### Endpoints de Permisos

#### 1. Listar Permisos
```http
GET /api/permissions
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "permissions": [
      {
        "id": 1,
        "name": "users.view",
        "category": "users"
      },
      {
        "id": 2,
        "name": "users.create",
        "category": "users"
      }
    ]
  }
}
```

---

## Seguridad y Autorización

### Políticas (Policies)

```php
// app/Policies/UserPolicy.php
class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('users.view');
    }
    
    public function view(User $user, User $model): bool
    {
        return $user->can('users.view') || $user->id === $model->id;
    }
    
    public function create(User $user): bool
    {
        return $user->can('users.create');
    }
    
    public function update(User $user, User $model): bool
    {
        return $user->can('users.edit') || $user->id === $model->id;
    }
    
    public function delete(User $user, User $model): bool
    {
        return $user->can('users.delete') && $user->id !== $model->id;
    }
}
```

### Blade Directives

```blade
@role('admin')
    <p>Solo visible para admins</p>
@endrole

@hasrole('admin|coordinator')
    <p>Visible para admin o coordinator</p>
@endhasrole

@can('users.edit')
    <button>Editar Usuario</button>
@endcan

@canany(['users.edit', 'users.delete'])
    <div>Acciones de usuario</div>
@endcanany
```

### Protección de Rutas

```php
// routes/api/admin.php
Route::middleware(['auth:api', 'role:admin'])->prefix('admin')->group(function () {
    // Usuarios
    Route::get('/users', [AdminController::class, 'getUsers']);
    Route::post('/users', [AdminController::class, 'createUser']);
    Route::put('/users/{id}', [AdminController::class, 'updateUser']);
    Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);
    
    // Aprobación
    Route::post('/users/{id}/approve', [AdminController::class, 'approveUser']);
    Route::post('/users/{id}/suspend', [AdminController::class, 'suspendUser']);
    
    // Roles
    Route::post('/users/{id}/change-role', [AdminController::class, 'changeUserRole']);
});
```

---

## Archivos del Módulo

### Controllers
- `app/Http/Controllers/Api/UserController.php`
- `app/Http/Controllers/Api/AdminController.php`

### Models
- `app/Models/User.php`

### Policies
- `app/Policies/UserPolicy.php`

### Middlewares
- Middleware `role` (Spatie)
- Middleware `permission` (Spatie)

### Seeders
- `database/seeders/RoleSeeder.php`
- `database/seeders/PermissionSeeder.php`
- `database/seeders/UserSeeder.php`

### Migraciones
- `database/migrations/2025_10_03_043635_create_permission_tables.php`
- `database/migrations/2025_10_13_061032_add_institution_and_status_to_users_table.php`

### Rutas
- `routes/api/users.php`
- `routes/api/roles.php`
- `routes/api/permissions.php`
- `routes/api/admin.php`

---

**Última actualización**: 21 de Octubre, 2025  
**Versión**: 1.0.0  
**Estado**: ✅ Producción Ready

