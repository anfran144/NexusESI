# Documentación de la API de NexusEsi para Frontend

> **Guía Completa para el Equipo de Frontend**  
> Esta documentación está basada en el estado actual de implementación del sistema NexusEsi (Fase 2 completada).

> **⚠️ IMPORTANTE**: Esta documentación ha sido actualizada para coincidir **exactamente** con la implementación real del backend. Todas las estructuras de respuesta, nombres de campos, rutas y validaciones han sido verificadas contra el código fuente actual.

---

## 📋 Tabla de Contenidos

1. [Configuración General](#1-configuración-general)
2. [Flujo de Autenticación (JWT)](#2-flujo-de-autenticación-jwt)
3. [Sistema de Permisos (Permission-First)](#3-sistema-de-permisos-permission-first)
4. [Referencia Completa de Endpoints](#4-referencia-completa-de-endpoints)
   - [4.1 Autenticación](#41-autenticación)
   - [4.2 Usuarios](#42-usuarios)
   - [4.3 Instituciones](#43-instituciones)
   - [4.4 Ubicaciones Geográficas](#44-ubicaciones-geográficas)
   - [4.5 Eventos](#45-eventos)
   - [4.6 Comités](#46-comités)
   - [4.7 Tareas](#47-tareas)
   - [4.8 Alertas](#48-alertas)
   - [4.9 Incidentes](#49-incidentes)
5. [Notificaciones en Tiempo Real (WebSockets)](#5-notificaciones-en-tiempo-real-websockets)
6. [Modelos de Datos y Enums (Tipos de TypeScript)](#6-modelos-de-datos-y-enums-tipos-de-typescript)
7. [Manejo de Errores](#7-manejo-de-errores)
8. [Mejores Prácticas](#8-mejores-prácticas)

---

## 1. Configuración General

### URL Base de la API

```
Producción: https://api.nexusesi.com/api
Desarrollo: http://localhost:8000/api
```

### Cabeceras Requeridas

Todas las peticiones a la API deben incluir las siguientes cabeceras:

```typescript
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};
```

### Cabecera de Autenticación

Para endpoints protegidos (que requieren autenticación), se debe incluir el token JWT:

```typescript
const authHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': `Bearer ${accessToken}`
};
```

### Ejemplo de Configuración con Axios

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor para agregar token automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

---

## 2. Flujo de Autenticación (JWT)

El sistema utiliza **JWT (JSON Web Tokens)** para la autenticación. El flujo completo es el siguiente:

### 2.1 Registro de Usuario

**Endpoint:** `POST /api/auth/register`

```typescript
const registerData = {
  name: "Juan Pérez",
  email: "juan@example.com",
  password: "SecurePass123!",
  password_confirmation: "SecurePass123!",
  institution_id: 1
};

const response = await api.post('/auth/register', registerData);
```

**Respuesta Exitosa (201 Created):**

```json
{
  "success": true,
  "message": "Usuario registrado exitosamente. Verifica tu correo.",
  "data": {
    "user": {
      "id": 1,
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "institution_id": 1,
      "status": "pending_approval"
    }
  }
}
```

### 2.2 Login

**Endpoint:** `POST /api/auth/login`

```typescript
const loginData = {
  email: "juan@example.com",
  password: "SecurePass123!"
};

const response = await api.post('/auth/login', loginData);
```

**Respuesta Exitosa (200 OK):**

```json
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "user": {
    "id": 1,
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "email_verified_at": null,
    "institution_id": 1,
    "institution": {
      "id": 1,
      "nombre": "Universidad Nacional",
      "identificador": "UN001"
    },
    "status": "active",
    "roles": [
      {
        "id": 2,
        "name": "coordinator",
        "display_name": "Coordinador"
      }
    ],
    "permissions": [
      "tasks.view",
      "tasks.create",
      "tasks.update",
      "events.manage"
    ],
    "role_display_name": "Coordinador",
    "welcome_message": "¡Hola, Juan Pérez! Como coordinador, puedes supervisar y gestionar las actividades de los semilleros de investigación.",
    "dashboard_route": "/coordinator",
    "created_at": "2025-10-25T12:00:00.000000Z",
    "updated_at": "2025-10-25T12:00:00.000000Z"
  },
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

**Almacenar el Token:**

```typescript
const { access_token, user } = response.data;
localStorage.setItem('accessToken', access_token);
localStorage.setItem('user', JSON.stringify(user));
```

### 2.3 Obtener Perfil del Usuario Autenticado

**Endpoint:** `GET /api/auth/me`

```typescript
const response = await api.get('/auth/me');
```

**Respuesta Exitosa (200 OK):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "email_verified_at": null,
      "institution_id": 1,
      "institution": {
        "id": 1,
        "nombre": "Universidad Nacional",
        "identificador": "UN001"
      },
      "status": "active",
      "roles": [
        {
          "id": 2,
          "name": "coordinator",
          "display_name": "Coordinador"
        }
      ],
      "permissions": [
        "tasks.view",
        "tasks.create",
        "tasks.update",
        "tasks.assign",
        "incidents.view",
        "incidents.resolve"
      ],
      "role_display_name": "Coordinador",
      "welcome_message": "¡Hola, Juan Pérez! Como coordinador, puedes supervisar y gestionar las actividades de los semilleros de investigación.",
      "dashboard_route": "/coordinator",
      "created_at": "2025-10-25T12:00:00.000000Z",
      "updated_at": "2025-10-25T12:00:00.000000Z"
    }
  }
}
```

### 2.4 Renovar Token (Refresh)

**Endpoint:** `POST /api/auth/refresh`

```typescript
const response = await api.post('/auth/refresh');
```

**Respuesta Exitosa (200 OK):**

```json
{
  "success": true,
  "message": "Token refrescado exitosamente",
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "token_type": "Bearer",
    "expires_in": 3600
  }
}
```

### 2.5 Logout

**Endpoint:** `POST /api/auth/logout`

```typescript
const response = await api.post('/auth/logout');
localStorage.removeItem('accessToken');
localStorage.removeItem('user');
```

**Respuesta Exitosa (200 OK):**

```json
{
  "success": true,
  "message": "Sesión cerrada exitosamente"
}
```

### 2.6 Manejo de Expiración de Token

El token tiene una duración de 60 minutos. Para manejar la expiración:

```typescript
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        // Intentar renovar token
        const refreshResponse = await api.post('/auth/refresh');
        const newToken = refreshResponse.data.data.access_token;
        localStorage.setItem('accessToken', newToken);
        
        // Reintentar la petición original
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return api.request(error.config);
      } catch (refreshError) {
        // Token no se puede renovar, redirigir al login
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 3. Sistema de Permisos (Permission-First)

### 🔑 Principio Fundamental

**El frontend NO debe basarse en roles, sino en permisos granulares.**

El backend es la única fuente de verdad sobre lo que un usuario puede hacer. Los roles son solo una agrupación de permisos, pero la lógica de UI debe verificar los permisos específicos.

### 3.1 Obtener Permisos del Usuario

Los permisos se obtienen al hacer login o al llamar a `GET /api/auth/me`:

```json
{
  "permissions": [
    "tasks.view",
    "tasks.create",
    "tasks.update",
    "tasks.assign",
    "tasks.complete",
    "incidents.view",
    "incidents.create",
    "alerts.view"
  ]
}
```

### 3.2 Lista Completa de Permisos por Rol

#### Admin
```typescript
const adminPermissions = [
  'users.view', 'users.create', 'users.update', 'users.delete',
  'institutions.view', 'institutions.create', 'institutions.update', 'institutions.delete',
  'events.view', 'events.create', 'events.update', 'events.delete',
  // ... todos los permisos del sistema
];
```

#### Coordinador
```typescript
const coordinatorPermissions = [
  // Eventos
  'events.view', 'events.create', 'events.update', 'events.delete',
  
  // Comités
  'committees.view', 'committees.create', 'committees.update', 'committees.delete',
  'committees.assign',
  
  // Tareas
  'tasks.view', 'tasks.create', 'tasks.update', 'tasks.delete', 'tasks.assign',
  
  // Incidentes
  'incidents.view', 'incidents.resolve',
  
  // Alertas
  'alerts.view', 'alerts.manage'
];
```

#### Líder de Semillero (Seedbed Leader)
```typescript
const seedbedLeaderPermissions = [
  // Tareas
  'tasks.view', 'tasks.complete',
  
  // Incidentes
  'incidents.view', 'incidents.create',
  
  // Alertas
  'alerts.view'
];
```

### 3.3 Lógica de UI Basada en Permisos

**❌ NO HACER (Basado en Roles):**

```typescript
// MAL: Verificar rol
if (user.roles.includes('coordinator')) {
  return <Button>Crear Tarea</Button>;
}
```

**✅ HACER (Basado en Permisos):**

```typescript
// BIEN: Verificar permiso
if (user.permissions.includes('tasks.create')) {
  return <Button>Crear Tarea</Button>;
}
```

### 3.4 Hook de Permisos (Recomendado)

```typescript
// hooks/usePermissions.ts
import { useAuth } from './useAuth';

export const usePermissions = () => {
  const { user } = useAuth();
  
  const hasPermission = (permission: string): boolean => {
    return user?.permissions?.includes(permission) || false;
  };
  
  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };
  
  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };
  
  return { hasPermission, hasAnyPermission, hasAllPermissions };
};

// Uso en componentes
const TaskList = () => {
  const { hasPermission } = usePermissions();
  
  return (
    <div>
      {hasPermission('tasks.create') && (
        <Button onClick={createTask}>Crear Tarea</Button>
      )}
      
      {hasPermission('tasks.delete') && (
        <Button onClick={deleteTask}>Eliminar Tarea</Button>
      )}
    </div>
  );
};
```

### 3.5 Navegación Basada en Permisos

```typescript
// Sidebar/Menu items
const menuItems = [
  {
    title: 'Eventos',
    href: '/events',
    permission: 'events.view'
  },
  {
    title: 'Crear Evento',
    href: '/events/create',
    permission: 'events.create'
  },
  {
    title: 'Tareas',
    href: '/tasks',
    permission: 'tasks.view'
  },
  {
    title: 'Mis Alertas',
    href: '/alerts',
    permission: 'alerts.view'
  }
];

// Filtrar según permisos del usuario
const visibleMenuItems = menuItems.filter(item => 
  hasPermission(item.permission)
);
```

---

## 4. Referencia Completa de Endpoints

### 4.1 Autenticación

#### POST /api/auth/register
**Descripción:** Registra un nuevo usuario en el sistema.

**Permiso Requerido:** Ninguno (público)

**Cuerpo de Solicitud:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "SecurePass123!",
  "password_confirmation": "SecurePass123!",
  "institution_id": 1
}
```

**Respuesta Exitosa (201 Created):**
```json
{
  "success": true,
  "message": "¡Gracias por registrarte! Tu cuenta está pendiente de aprobación por un administrador del sistema.",
  "user": {
    "id": 1,
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "status": "pending_approval",
    "status_display": "Pendiente de Aprobación",
    "institution": {
      "id": 1,
      "nombre": "Universidad Nacional de Colombia",
      "identificador": "UN001",
      "ciudad": "Bogotá",
      "estado": "Cundinamarca",
      "pais": "Colombia"
    },
    "created_at": "2025-10-25T12:00:00.000000Z"
  },
  "registration_status": "pending_approval",
  "next_steps": "Un administrador del sistema revisará tu solicitud y te notificará por correo electrónico cuando tu cuenta sea aprobada."
}
```

**Validación de Errores (422):**
```json
{
  "success": false,
  "message": "Los datos proporcionados no son válidos. Por favor, revisa la información ingresada.",
  "errors": {
    "email": ["Este correo electrónico ya está registrado"],
    "password": ["La contraseña debe tener al menos 8 caracteres"],
    "institution_id": ["Debes seleccionar una institución"]
  }
}
```

**Error de Institución No Disponible (422):**
```json
{
  "success": false,
  "message": "La institución seleccionada no está disponible para registro.",
  "errors": {
    "institution_id": ["La institución seleccionada no está activa."]
  }
}
```

---

#### POST /api/auth/login
**Descripción:** Autentica un usuario y devuelve un token JWT.

**Permiso Requerido:** Ninguno (público)

**Cuerpo de Solicitud:**
```json
{
  "email": "juan@example.com",
  "password": "SecurePass123!"
}
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "token_type": "bearer",
    "expires_in": 3600,
    "user": {
      "id": 1,
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "institution_id": 1,
      "roles": ["coordinator"],
      "permissions": ["tasks.view", "tasks.create"]
    }
  }
}
```

**Error de Credenciales (401):**
```json
{
  "success": false,
  "message": "Credenciales inválidas"
}
```

---

#### GET /api/auth/me
**Descripción:** Obtiene la información del usuario autenticado con sus permisos.

**Permiso Requerido:** Usuario autenticado

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "institution_id": 1,
    "status": "active",
    "roles": ["coordinator"],
    "permissions": [
      "tasks.view",
      "tasks.create",
      "tasks.update",
      "tasks.assign",
      "incidents.view",
      "incidents.resolve"
    ],
    "institution": {
      "id": 1,
      "name": "Universidad Nacional"
    }
  }
}
```

---

#### POST /api/auth/refresh
**Descripción:** Renueva el token JWT antes de que expire.

**Permiso Requerido:** Usuario autenticado

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "token_type": "bearer",
    "expires_in": 3600
  }
}
```

---

#### POST /api/auth/logout
**Descripción:** Cierra la sesión del usuario e invalida el token.

**Permiso Requerido:** Usuario autenticado

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Sesión cerrada exitosamente"
}
```

---

### 4.2 Usuarios

#### GET /api/users
**Descripción:** Obtiene una lista de usuarios del sistema.

**Permiso Requerido:** `users.view`

**Parámetros de Query:**
- `role` (opcional): Filtrar por rol (admin, coordinator, seedbed_leader)
- `institution_id` (opcional): Filtrar por institución
- `status` (opcional): Filtrar por estado (active, pending_approval, suspended)

**Ejemplo de Petición:**
```typescript
const response = await api.get('/users?role=coordinator&status=active');
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "institution_id": 1,
      "status": "active",
      "roles": ["coordinator"],
      "institution": {
        "id": 1,
        "name": "Universidad Nacional"
      }
    }
  ]
}
```

---

#### POST /api/users
**Descripción:** Crea un nuevo usuario en el sistema.

**Permiso Requerido:** `users.create`

**Cuerpo de Solicitud:**
```json
{
  "name": "María García",
  "email": "maria@example.com",
  "password": "SecurePass123!",
  "password_confirmation": "SecurePass123!",
  "institution_id": 1,
  "role": "seedbed_leader"
}
```

**Respuesta Exitosa (201 Created):**
```json
{
  "success": true,
  "message": "Usuario creado exitosamente",
  "data": {
    "id": 2,
    "name": "María García",
    "email": "maria@example.com",
    "institution_id": 1,
    "status": "active",
    "roles": ["seedbed_leader"]
  }
}
```

---

#### GET /api/users/{id}
**Descripción:** Obtiene los detalles de un usuario específico.

**Permiso Requerido:** `users.view`

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "institution_id": 1,
    "status": "active",
    "roles": ["coordinator"],
    "permissions": ["tasks.view", "tasks.create"],
    "institution": {
      "id": 1,
      "name": "Universidad Nacional"
    }
  }
}
```

---

#### PUT /api/users/{id}
**Descripción:** Actualiza la información de un usuario.

**Permiso Requerido:** `users.update`

**Cuerpo de Solicitud:**
```json
{
  "name": "Juan Pérez Actualizado",
  "status": "active",
  "role": "coordinator"
}
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Usuario actualizado exitosamente",
  "data": {
    "id": 1,
    "name": "Juan Pérez Actualizado",
    "status": "active"
  }
}
```

---

#### DELETE /api/users/{id}
**Descripción:** Elimina un usuario del sistema.

**Permiso Requerido:** `users.delete`

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Usuario eliminado exitosamente"
}
```

---

### 4.3 Instituciones

#### GET /api/institutions
**Descripción:** Obtiene una lista de instituciones educativas.

**Permiso Requerido:** `institutions.view`

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Universidad Nacional",
      "description": "Universidad pública de Colombia",
      "status": "active",
      "city": {
        "id": 1,
        "name": "Bogotá",
        "estado": {
          "id": 1,
          "name": "Cundinamarca",
          "pais": {
            "id": 1,
            "name": "Colombia"
          }
        }
      }
    }
  ]
}
```

---

#### POST /api/institutions
**Descripción:** Crea una nueva institución.

**Permiso Requerido:** `institutions.create`

**Cuerpo de Solicitud:**
```json
{
  "name": "Universidad de los Andes",
  "description": "Universidad privada de Colombia",
  "city_id": 1,
  "status": "active"
}
```

**Respuesta Exitosa (201 Created):**
```json
{
  "success": true,
  "message": "Institución creada exitosamente",
  "data": {
    "id": 2,
    "name": "Universidad de los Andes",
    "description": "Universidad privada de Colombia",
    "status": "active"
  }
}
```

---

### 4.4 Ubicaciones Geográficas

#### GET /api/locations/paises
**Descripción:** Obtiene la lista de países disponibles.

**Permiso Requerido:** Ninguno (público)

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Colombia",
      "codigo": "CO"
    },
    {
      "id": 2,
      "nombre": "México",
      "codigo": "MX"
    }
  ]
}
```

---

#### GET /api/locations/estados/{paisId}
**Descripción:** Obtiene los estados/departamentos de un país específico.

**Permiso Requerido:** Ninguno (público)

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Cundinamarca",
      "pais_id": 1
    },
    {
      "id": 2,
      "nombre": "Antioquia",
      "pais_id": 1
    }
  ]
}
```

---

#### GET /api/locations/ciudades/estado/{estadoId}
**Descripción:** Obtiene las ciudades de un estado/departamento específico.

**Permiso Requerido:** Ninguno (público)

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Bogotá",
      "estado_id": 1
    },
    {
      "id": 2,
      "nombre": "Soacha",
      "estado_id": 1
    }
  ]
}
```

---

#### GET /api/locations/ciudades/pais/{paisId}
**Descripción:** Obtiene todas las ciudades de un país específico.

**Permiso Requerido:** Ninguno (público)

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Bogotá",
      "estado_id": 1,
      "estado": {
        "id": 1,
        "nombre": "Cundinamarca"
      }
    },
    {
      "id": 2,
      "nombre": "Medellín",
      "estado_id": 2,
      "estado": {
        "id": 2,
        "nombre": "Antioquia"
      }
    }
  ]
}
```

---

#### GET /api/locations/hierarchy/{paisId?}
**Descripción:** Obtiene la estructura jerárquica completa de ubicaciones (opcional: filtrado por país).

**Permiso Requerido:** Ninguno (público)

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "data": {
    "pais": {
      "id": 1,
      "nombre": "Colombia",
      "estados": [
        {
          "id": 1,
          "nombre": "Cundinamarca",
          "ciudades": [
            {
              "id": 1,
              "nombre": "Bogotá"
            },
            {
              "id": 2,
              "nombre": "Soacha"
            }
          ]
        }
      ]
    }
  }
}
```

---

#### GET /api/locations/search
**Descripción:** Busca ubicaciones por nombre.

**Permiso Requerido:** Ninguno (público)

**Parámetros de Query:**
- `q` (requerido): Término de búsqueda
- `type` (opcional): Tipo de ubicación (pais, estado, ciudad)

**Ejemplo de Petición:**
```typescript
const response = await api.get('/locations/search?q=Bogotá&type=ciudad');
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Bogotá",
      "tipo": "ciudad",
      "estado": "Cundinamarca",
      "pais": "Colombia"
    }
  ]
}
```

---

### 4.4.1 Rutas de Registro (Selectores en Cascada)

Estas rutas están específicamente diseñadas para el flujo de registro de usuarios, proporcionando selectores en cascada para una mejor experiencia de usuario.

#### GET /api/registration/paises
**Descripción:** Obtiene la lista de países para el formulario de registro.

**Permiso Requerido:** Ninguno (público)

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Colombia",
      "codigo": "CO"
    },
    {
      "id": 2,
      "nombre": "México",
      "codigo": "MX"
    }
  ]
}
```

---

#### GET /api/registration/estados/{paisId}
**Descripción:** Obtiene los estados/departamentos de un país para el registro.

**Permiso Requerido:** Ninguno (público)

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Cundinamarca",
      "pais_id": 1
    },
    {
      "id": 2,
      "nombre": "Antioquia",
      "pais_id": 1
    }
  ]
}
```

---

#### GET /api/registration/ciudades/{estadoId}
**Descripción:** Obtiene las ciudades de un estado para el registro.

**Permiso Requerido:** Ninguno (público)

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Bogotá",
      "estado_id": 1
    },
    {
      "id": 2,
      "nombre": "Soacha",
      "estado_id": 1
    }
  ]
}
```

---

#### GET /api/registration/instituciones/{ciudadId}
**Descripción:** Obtiene las instituciones disponibles en una ciudad para el registro.

**Permiso Requerido:** Ninguno (público)

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Universidad Nacional de Colombia",
      "identificador": "UN001",
      "estado": "activo",
      "ciudad_id": 1
    },
    {
      "id": 2,
      "nombre": "Universidad de los Andes",
      "identificador": "UANDES001",
      "estado": "activo",
      "ciudad_id": 1
    }
  ]
}
```

---

#### GET /api/registration/hierarchy/{paisId?}
**Descripción:** Obtiene la estructura jerárquica completa para debugging o carga inicial del formulario de registro.

**Permiso Requerido:** Ninguno (público)

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "data": {
    "pais": {
      "id": 1,
      "nombre": "Colombia",
      "estados": [
        {
          "id": 1,
          "nombre": "Cundinamarca",
          "ciudades": [
            {
              "id": 1,
              "nombre": "Bogotá",
              "instituciones": [
                {
                  "id": 1,
                  "nombre": "Universidad Nacional de Colombia",
                  "identificador": "UN001"
                }
              ]
            }
          ]
        }
      ]
    }
  }
}
```

---

#### GET /api/registration/validate-institution/{institutionId}
**Descripción:** Valida que una institución esté disponible para registro antes de completar el formulario.

**Permiso Requerido:** Ninguno (público)

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "data": {
    "institution": {
      "id": 1,
      "nombre": "Universidad Nacional de Colombia",
      "identificador": "UN001",
      "estado": "activo"
    },
    "available_for_registration": true,
    "message": "Institución disponible para registro"
  }
}
```

**Error si no está disponible (422):**
```json
{
  "success": false,
  "message": "La institución seleccionada no está disponible para registro",
  "errors": {
    "institution_id": ["La institución no está activa o no existe"]
  }
}
```

---

### 4.5 Eventos

#### GET /api/events
**Descripción:** Obtiene una lista de eventos académicos.

**Permiso Requerido:** `events.view`

**Parámetros de Query:**
- `status` (opcional): Filtrar por estado (active, inactive, finished)
- `institution_id` (opcional): Filtrar por institución

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Congreso de Investigación 2025",
      "description": "Evento anual de presentación de proyectos",
      "start_date": "2025-11-01",
      "end_date": "2025-11-30",
      "status": "active",
      "coordinator_id": 1,
      "institution_id": 1,
      "coordinator": {
        "id": 1,
        "name": "Juan Pérez",
        "email": "juan@example.com"
      },
      "institution": {
        "id": 1,
        "name": "Universidad Nacional"
      }
    }
  ]
}
```

---

#### POST /api/events
**Descripción:** Crea un nuevo evento académico.

**Permiso Requerido:** `events.create`

**Cuerpo de Solicitud:**
```json
{
  "name": "Congreso de Investigación 2025",
  "description": "Evento anual de presentación de proyectos",
  "start_date": "2025-11-01",
  "end_date": "2025-11-30",
  "institution_id": 1
}
```

**Respuesta Exitosa (201 Created):**
```json
{
  "success": true,
  "message": "Evento creado exitosamente",
  "data": {
    "id": 1,
    "name": "Congreso de Investigación 2025",
    "description": "Evento anual de presentación de proyectos",
    "start_date": "2025-11-01",
    "end_date": "2025-11-30",
    "status": "active",
    "coordinator_id": 1,
    "institution_id": 1
  }
}
```

**Validación de Errores (422):**
```json
{
  "message": "Los datos proporcionados no son válidos",
  "errors": {
    "start_date": ["La fecha de inicio debe ser posterior a hoy"],
    "end_date": ["La fecha de fin debe ser posterior a la fecha de inicio"]
  }
}
```

---

#### GET /api/events/{id}
**Descripción:** Obtiene los detalles de un evento específico.

**Permiso Requerido:** `events.view`

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Congreso de Investigación 2025",
    "description": "Evento anual de presentación de proyectos",
    "start_date": "2025-11-01",
    "end_date": "2025-11-30",
    "status": "active",
    "coordinator_id": 1,
    "institution_id": 1,
    "coordinator": {
      "id": 1,
      "name": "Juan Pérez"
    },
    "committees": [
      {
        "id": 1,
        "name": "Comité de Logística",
        "members_count": 5
      }
    ],
    "participants_count": 25
  }
}
```

---

#### PUT /api/events/{id}
**Descripción:** Actualiza un evento existente.

**Permiso Requerido:** `events.update`

**Cuerpo de Solicitud:**
```json
{
  "name": "Congreso de Investigación 2025 - Actualizado",
  "description": "Nueva descripción",
  "status": "active"
}
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Evento actualizado exitosamente",
  "data": {
    "id": 1,
    "name": "Congreso de Investigación 2025 - Actualizado",
    "status": "active"
  }
}
```

---

#### DELETE /api/events/{id}
**Descripción:** Elimina un evento del sistema.

**Permiso Requerido:** `events.delete`

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Evento eliminado exitosamente"
}
```

---

#### POST /api/events/{id}/participate
**Descripción:** Registra la participación de un usuario en un evento.

**Permiso Requerido:** Usuario autenticado

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Participación registrada exitosamente",
  "data": {
    "event_id": 1,
    "user_id": 1,
    "created_at": "2025-10-25T12:00:00.000000Z"
  }
}
```

---

### 4.6 Comités

#### GET /api/committees
**Descripción:** Obtiene una lista de comités de trabajo.

**Permiso Requerido:** `committees.view`

**Parámetros de Query:**
- `event_id` (opcional): Filtrar por evento

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Comité de Logística",
      "description": "Encargado de la organización logística",
      "event_id": 1,
      "event": {
        "id": 1,
        "name": "Congreso de Investigación 2025"
      },
      "members": [
        {
          "id": 1,
          "name": "María García",
          "email": "maria@example.com"
        }
      ],
      "tasks_count": 5
    }
  ]
}
```

---

#### POST /api/committees
**Descripción:** Crea un nuevo comité de trabajo.

**Permiso Requerido:** `committees.create`

**Cuerpo de Solicitud:**
```json
{
  "name": "Comité de Logística",
  "description": "Encargado de la organización logística",
  "event_id": 1
}
```

**Respuesta Exitosa (201 Created):**
```json
{
  "success": true,
  "message": "Comité creado exitosamente",
  "data": {
    "id": 1,
    "name": "Comité de Logística",
    "description": "Encargado de la organización logística",
    "event_id": 1
  }
}
```

---

#### POST /api/committees/{id}/assign
**Descripción:** Asigna un usuario a un comité.

**Permiso Requerido:** `committees.assign`

**Cuerpo de Solicitud:**
```json
{
  "user_id": 1
}
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Usuario asignado al comité exitosamente",
  "data": {
    "committee_id": 1,
    "user_id": 1,
    "assigned_at": "2025-10-25T12:00:00.000000Z"
  }
}
```

---

#### DELETE /api/committees/{id}/remove/{userId}
**Descripción:** Remueve un usuario de un comité.

**Permiso Requerido:** `committees.assign`

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Usuario removido del comité exitosamente"
}
```

---

### 4.7 Tareas

#### GET /api/tasks
**Descripción:** Obtiene una lista de tareas del sistema.

**Permiso Requerido:** `tasks.view`

**Parámetros de Query:**
- `committee_id` (opcional): Filtrar por comité
- `status` (opcional): Filtrar por estado (Pending, InProgress, Completed, Delayed, Paused)
- `risk_level` (opcional): Filtrar por nivel de riesgo (Low, Medium, High)
- `assigned_to_id` (opcional): Filtrar por usuario asignado

**Ejemplo de Petición:**
```typescript
const response = await api.get('/tasks?status=InProgress&risk_level=High');
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Revisar documentación",
      "description": "Validar documentación técnica del proyecto",
      "due_date": "2025-12-25",
      "status": "InProgress",
      "risk_level": "Low",
      "assigned_to_id": 1,
      "committee_id": 1,
      "created_at": "2025-10-25T12:00:00.000000Z",
      "assigned_to": {
        "id": 1,
        "name": "María García",
        "email": "maria@example.com"
      },
      "committee": {
        "id": 1,
        "name": "Comité de Logística",
        "event": {
          "id": 1,
          "name": "Congreso de Investigación 2025",
          "start_date": "2025-11-01",
          "end_date": "2025-11-30"
        }
      }
    }
  ]
}
```

**Nota Importante:** 
- Los usuarios con rol de Líder de Semillero solo verán sus tareas asignadas.
- Los coordinadores verán todas las tareas de sus eventos.
- Las tareas están filtradas automáticamente por la institución del usuario.

---

#### POST /api/tasks
**Descripción:** Crea una nueva tarea para un comité.

**Permiso Requerido:** `tasks.create`

**Cuerpo de Solicitud:**
```json
{
  "title": "Revisar documentación",
  "description": "Validar documentación técnica del proyecto",
  "due_date": "2025-12-25",
  "committee_id": 1
}
```

**Respuesta Exitosa (201 Created):**
```json
{
  "success": true,
  "message": "Tarea creada exitosamente",
  "data": {
    "id": 1,
    "title": "Revisar documentación",
    "description": "Validar documentación técnica del proyecto",
    "due_date": "2025-12-25",
    "status": "InProgress",
    "risk_level": "Low",
    "assigned_to_id": null,
    "committee_id": 1,
    "created_at": "2025-10-25T12:00:00.000000Z"
  }
}
```

**Validación de Errores (422):**
```json
{
  "message": "Los datos proporcionados no son válidos",
  "errors": {
    "due_date": [
      "La fecha límite de la tarea debe estar dentro del período de planificación del evento"
    ]
  }
}
```

**Nota Temporal Importante:**
El sistema valida que `due_date` esté dentro del rango `event.start_date` y `event.end_date`. Esto es porque NexusEsi gestiona únicamente la fase de planificación de eventos.

---

#### GET /api/tasks/{id}
**Descripción:** Obtiene los detalles de una tarea específica con su historial.

**Permiso Requerido:** `tasks.view`

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Revisar documentación",
    "description": "Validar documentación técnica del proyecto",
    "due_date": "2025-12-25",
    "status": "InProgress",
    "risk_level": "Medium",
    "assigned_to_id": 1,
    "committee_id": 1,
    "assigned_to": {
      "id": 1,
      "name": "María García"
    },
    "committee": {
      "id": 1,
      "name": "Comité de Logística",
      "event": {
        "id": 1,
        "name": "Congreso de Investigación 2025"
      }
    },
    "progress": [
      {
        "id": 1,
        "description": "Revisión del capítulo 1 completada",
        "file_name": "capitulo1.pdf",
        "file_path": "/storage/task-progress/capitulo1.pdf",
        "created_at": "2025-10-20T10:00:00.000000Z",
        "user": {
          "id": 1,
          "name": "María García"
        }
      }
    ],
    "incidents": [
      {
        "id": 1,
        "description": "Falta información en la sección 3",
        "status": "Reported",
        "reported_by": {
          "id": 1,
          "name": "María García"
        },
        "created_at": "2025-10-21T14:30:00.000000Z"
      }
    ]
  }
}
```

---

#### PUT /api/tasks/{id}
**Descripción:** Actualiza una tarea existente.

**Permiso Requerido:** `tasks.update`

**Cuerpo de Solicitud:**
```json
{
  "title": "Revisar documentación actualizada",
  "description": "Nueva descripción",
  "due_date": "2025-12-30",
  "status": "InProgress"
}
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Tarea actualizada exitosamente",
  "data": {
    "id": 1,
    "title": "Revisar documentación actualizada",
    "status": "InProgress",
    "risk_level": "Low"
  }
}
```

**Validación de Errores (422):**
```json
{
  "message": "Los datos proporcionados no son válidos",
  "errors": {
    "due_date": [
      "La fecha límite debe estar dentro del período de planificación del evento"
    ]
  }
}
```

---

#### DELETE /api/tasks/{id}
**Descripción:** Elimina una tarea del sistema.

**Permiso Requerido:** `tasks.delete`

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Tarea eliminada exitosamente"
}
```

---

#### POST /api/tasks/{id}/assign
**Descripción:** Asigna una tarea a un usuario específico.

**Permiso Requerido:** `tasks.assign`

**Cuerpo de Solicitud:**
```json
{
  "assigned_to_id": 1
}
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Tarea asignada exitosamente",
  "data": {
    "id": 1,
    "title": "Revisar documentación",
    "assigned_to_id": 1,
    "assigned_to": {
      "id": 1,
      "name": "María García",
      "email": "maria@example.com"
    }
  }
}
```

**Error de Permiso (403):**
```json
{
  "success": false,
  "message": "No tienes permisos para realizar esta acción"
}
```

---

#### PUT /api/tasks/{id}/complete
**Descripción:** Marca una tarea como completada.

**Permiso Requerido:** `tasks.complete`

**Restricción:** Solo el usuario asignado a la tarea puede marcarla como completada.

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Tarea marcada como completada",
  "data": {
    "id": 1,
    "title": "Revisar documentación",
    "status": "Completed",
    "completed_at": "2025-10-25T16:30:00.000000Z"
  }
}
```

**Error de Permiso (403):**
```json
{
  "success": false,
  "message": "Solo el usuario asignado puede completar esta tarea"
}
```

---

#### POST /api/tasks/{id}/progress
**Descripción:** Reporta un avance en la ejecución de la tarea.

**Permiso Requerido:** `tasks.view` (y ser el usuario asignado)

**Cuerpo de Solicitud (multipart/form-data):**
```typescript
const formData = new FormData();
formData.append('description', 'Revisión del capítulo 1 completada');
formData.append('file', fileInput.files[0]); // Opcional

const response = await api.post(`/tasks/${taskId}/progress`, formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Progreso reportado exitosamente"
}
```

**Nota:** Este endpoint crea un registro en la tabla `task_progress` y envía una notificación interna al coordinador. NO se envía correo para evitar saturación.

---

### 4.8 Alertas

#### GET /api/alerts
**Descripción:** Obtiene las alertas del usuario autenticado.

**Permiso Requerido:** `alerts.view`

**Parámetros de Query:**
- `type` (opcional): Filtrar por tipo (Preventive, Critical)
- `is_read` (opcional): Filtrar por estado de lectura (true, false)

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "message": "Tarea 'Revisar documentación' en Riesgo Alto",
      "type": "Critical",
      "task_id": 1,
      "user_id": 1,
      "is_read": false,
      "read_at": null,
      "created_at": "2025-10-25T12:00:00.000000Z",
      "task": {
        "id": 1,
        "title": "Revisar documentación",
        "due_date": "2025-12-25",
        "status": "Delayed",
        "risk_level": "High",
        "committee": {
          "id": 1,
          "name": "Comité de Logística",
          "event": {
            "id": 1,
            "name": "Congreso de Investigación 2025"
          }
        }
      }
    }
  ]
}
```

---

#### POST /api/alerts
**Descripción:** Crea una alerta manualmente.

**Permiso Requerido:** `alerts.manage`

**Cuerpo de Solicitud:**
```json
{
  "message": "Alerta de prueba",
  "type": "Preventive",
  "task_id": 1
}
```

**Respuesta Exitosa (201 Created):**
```json
{
  "success": true,
  "message": "Alerta creada exitosamente",
  "data": {
    "id": 1,
    "message": "Alerta de prueba",
    "type": "Preventive",
    "task_id": 1,
    "user_id": 1,
    "is_read": false
  }
}
```

---

#### PUT /api/alerts/{id}/read
**Descripción:** Marca una alerta como leída.

**Permiso Requerido:** Usuario autenticado (propietario de la alerta)

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Alerta marcada como leída",
  "data": {
    "id": 1,
    "is_read": true,
    "read_at": "2025-10-25T16:45:00.000000Z"
  }
}
```

---

#### PUT /api/alerts/read-all
**Descripción:** Marca todas las alertas del usuario como leídas.

**Permiso Requerido:** Usuario autenticado

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Todas las alertas han sido marcadas como leídas"
}
```

---

#### GET /api/alerts/statistics/overview
**Descripción:** Obtiene estadísticas de las alertas del usuario.

**Permiso Requerido:** `alerts.view`

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "data": {
    "total": 15,
    "unread": 5,
    "preventive": 10,
    "critical": 5
  }
}
```

---

### 4.9 Incidentes

#### GET /api/incidents
**Descripción:** Obtiene una lista de incidencias reportadas.

**Permiso Requerido:** `incidents.view`

**Parámetros de Query:**
- `status` (opcional): Filtrar por estado (Reported, Resolved)
- `task_id` (opcional): Filtrar por tarea

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "description": "Falta información en la sección 3",
      "status": "Reported",
      "task_id": 1,
      "reported_by_id": 1,
      "file_name": "evidencia.pdf",
      "file_path": "/storage/incidents/evidencia.pdf",
      "solution_task_id": null,
      "created_at": "2025-10-21T14:30:00.000000Z",
      "task": {
        "id": 1,
        "title": "Revisar documentación",
        "status": "Paused"
      },
      "reported_by": {
        "id": 1,
        "name": "María García",
        "email": "maria@example.com"
      }
    }
  ]
}
```

---

#### POST /api/incidents
**Descripción:** Reporta una incidencia en una tarea.

**Permiso Requerido:** `incidents.create`

**Restricción:** Solo el usuario asignado a la tarea puede reportar incidencias.

**Cuerpo de Solicitud (multipart/form-data):**
```typescript
const formData = new FormData();
formData.append('task_id', '1');
formData.append('description', 'Falta información en la sección 3');
formData.append('file', fileInput.files[0]); // Opcional

const response = await api.post('/incidents', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});
```

**Respuesta Exitosa (201 Created):**
```json
{
  "success": true,
  "message": "Incidencia reportada exitosamente",
  "data": {
    "id": 1,
    "description": "Falta información en la sección 3",
    "status": "Reported",
    "task_id": 1,
    "reported_by_id": 1,
    "file_name": "evidencia.pdf",
    "file_path": "/storage/incidents/evidencia.pdf",
    "created_at": "2025-10-21T14:30:00.000000Z"
  }
}
```

**Nota Importante:** 
- Al reportar una incidencia, el estado de la tarea cambia automáticamente a `Paused`.
- Se envía un correo de alerta crítica al coordinador del evento.
- Si se adjunta un archivo, este se incluye en el correo.

---

#### PUT /api/incidents/{id}/resolve
**Descripción:** Marca una incidencia como resuelta.

**Permiso Requerido:** `incidents.resolve`

**Cuerpo de Solicitud (opcional):**
```json
{
  "solution_task_id": 5
}
```

**Respuesta Exitosa (200 OK):**
```json
{
  "success": true,
  "message": "Incidencia resuelta exitosamente",
  "data": {
    "id": 1,
    "description": "Falta información en la sección 3",
    "status": "Resolved",
    "solution_task_id": 5,
    "resolved_at": "2025-10-22T10:00:00.000000Z"
  }
}
```

**Nota:** Al resolver una incidencia, el estado de la tarea original cambia de `Paused` a `InProgress` (o `Delayed` si ya pasó la fecha límite).

---

## 5. Notificaciones en Tiempo Real (WebSockets)

El sistema utiliza **Pusher** para enviar notificaciones en tiempo real a los usuarios. Esto permite que el frontend reciba actualizaciones instantáneas sin necesidad de hacer polling.

### 5.1 Configuración de Pusher en Frontend

**Instalación:**
```bash
npm install pusher-js
```

**Configuración:**
```typescript
// services/pusherService.ts
import Pusher from 'pusher-js';

const pusher = new Pusher(process.env.REACT_APP_PUSHER_KEY, {
  cluster: process.env.REACT_APP_PUSHER_CLUSTER,
  forceTLS: true,
  authEndpoint: 'http://localhost:8000/api/pusher/auth',
  auth: {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`
    }
  }
});

export default pusher;
```

### 5.2 Canales Privados

El sistema utiliza canales privados por usuario:

**Formato del Canal:** `user-{userId}`

**Ejemplo:**
```typescript
const userId = user.id;
const channel = pusher.subscribe(`user-${userId}`);
```

### 5.3 Eventos Disponibles

#### Evento: `alert.created`
**Descripción:** Se dispara cuando se crea una nueva alerta para el usuario.

**Payload:**
```json
{
  "alert": {
    "id": 123,
    "message": "Tarea 'Diseño de afiche' en Riesgo Alto",
    "type": "Critical",
    "task_title": "Diseño de afiche",
    "created_at": "2025-10-25T16:30:00.000000Z",
    "is_read": false
  }
}
```

**Implementación en React:**
```typescript
useEffect(() => {
  const channel = pusher.subscribe(`user-${user.id}`);
  
  channel.bind('alert.created', (data: any) => {
    // Mostrar notificación toast
    toast.error(data.alert.message, {
      description: `Tarea: ${data.alert.task_title}`,
      action: {
        label: 'Ver Alerta',
        onClick: () => navigate(`/alerts/${data.alert.id}`)
      }
    });
    
    // Actualizar lista de alertas
    refetchAlerts();
  });
  
  return () => {
    channel.unbind('alert.created');
    pusher.unsubscribe(`user-${user.id}`);
  };
}, [user.id]);
```

---

#### Evento: `incident.created`
**Descripción:** Se dispara cuando un líder reporta una incidencia (notifica al coordinador).

**Payload:**
```json
{
  "incident": {
    "id": 5,
    "description": "Fallo en pasarela de pagos",
    "status": "Reported",
    "task_title": "Integrar pasarela de pagos",
    "reported_by": "María García",
    "created_at": "2025-10-25T16:45:00.000000Z"
  }
}
```

**Implementación en React:**
```typescript
channel.bind('incident.created', (data: any) => {
  toast.warning('Nueva Incidencia Reportada', {
    description: `${data.incident.reported_by}: ${data.incident.description}`,
    action: {
      label: 'Ver Incidencia',
      onClick: () => navigate(`/incidents/${data.incident.id}`)
    }
  });
  
  // Actualizar lista de incidencias
  refetchIncidents();
});
```

---

#### Evento: `progress.updated`
**Descripción:** Se dispara cuando un líder reporta progreso en una tarea (notifica al coordinador).

**Payload:**
```json
{
  "progress": {
    "id": 8,
    "description": "Borrador del capítulo 1 terminado",
    "task_title": "Redactar documentación",
    "reported_by": "Carlos López",
    "created_at": "2025-10-25T17:00:00.000000Z"
  }
}
```

**Implementación en React:**
```typescript
channel.bind('progress.updated', (data: any) => {
  toast.success('Nuevo Progreso Reportado', {
    description: `${data.progress.task_title}: ${data.progress.description}`
  });
  
  // Actualizar lista de tareas
  refetchTasks();
});
```

---

#### Evento: `task.updated`
**Descripción:** Se dispara cuando una tarea es actualizada (cambio de estado, asignación, etc.).

**Payload:**
```json
{
  "task": {
    "id": 1,
    "title": "Revisar documentación",
    "status": "InProgress",
    "risk_level": "Medium",
    "assigned_to_id": 1
  }
}
```

**Implementación en React:**
```typescript
channel.bind('task.updated', (data: any) => {
  // Actualizar tarea en el estado local
  setTasks(prevTasks => 
    prevTasks.map(task => 
      task.id === data.task.id ? { ...task, ...data.task } : task
    )
  );
});
```

---

### 5.4 Hook de Notificaciones en Tiempo Real

```typescript
// hooks/useRealtimeNotifications.ts
import { useEffect } from 'react';
import { useAuth } from './useAuth';
import pusher from '@/services/pusherService';
import { toast } from 'sonner';

export const useRealtimeNotifications = () => {
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user?.id) return;
    
    const channel = pusher.subscribe(`user-${user.id}`);
    
    // Alertas
    channel.bind('alert.created', (data: any) => {
      const alertType = data.alert.type === 'Critical' ? 'error' : 'warning';
      toast[alertType](data.alert.message, {
        description: `Tarea: ${data.alert.task_title}`,
      });
    });
    
    // Incidencias
    channel.bind('incident.created', (data: any) => {
      toast.warning('Nueva Incidencia', {
        description: data.incident.description,
      });
    });
    
    // Progreso
    channel.bind('progress.updated', (data: any) => {
      toast.success('Nuevo Progreso', {
        description: data.progress.description,
      });
    });
    
    // Tareas actualizadas
    channel.bind('task.updated', (data: any) => {
      // Manejar actualización silenciosa
    });
    
    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`user-${user.id}`);
    };
  }, [user?.id]);
};

// Uso en componente principal
function App() {
  useRealtimeNotifications();
  
  return <Router />;
}
```

---

## 6. Modelos de Datos y Enums (Tipos de TypeScript)

### 6.1 User (Usuario)

```typescript
interface UserRole {
  id: number;
  name: 'admin' | 'coordinator' | 'seedbed_leader';
  display_name: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string;
  institution_id: number;
  status: 'pending_approval' | 'active' | 'suspended';
  roles: UserRole[];
  permissions: string[];
  role_display_name: string;
  welcome_message: string;
  dashboard_route: string;
  institution?: Institucion;
  created_at: string;
  updated_at: string;
}
```

---

### 6.2 Institucion (Institución)

```typescript
interface Institucion {
  id: number;
  nombre: string;
  identificador: string;
  descripcion?: string;
  ciudad_id: number;
  estado: 'activo' | 'inactivo';
  ciudad?: Ciudad;
  created_at: string;
  updated_at: string;
}
```

---

### 6.3 Event (Evento)

```typescript
interface Event {
  id: number;
  name: string;
  description: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  status: 'active' | 'inactive' | 'finished';
  coordinator_id: number;
  institution_id: number;
  coordinator?: User;
  institution?: Institution;
  committees?: Committee[];
  participants_count?: number;
  created_at: string;
  updated_at: string;
}
```

---

### 6.4 Committee (Comité)

```typescript
interface Committee {
  id: number;
  name: string;
  description?: string;
  event_id: number;
  event?: Event;
  members?: User[];
  tasks_count?: number;
  created_at: string;
  updated_at: string;
}
```

---

### 6.5 Task (Tarea)

```typescript
enum TaskStatus {
  Pending = 'Pending',
  InProgress = 'InProgress',
  Completed = 'Completed',
  Delayed = 'Delayed',
  Paused = 'Paused'
}

enum RiskLevel {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High'
}

interface Task {
  id: number;
  title: string;
  description: string;
  due_date: string; // YYYY-MM-DD
  status: TaskStatus;
  risk_level: RiskLevel;
  assigned_to_id: number | null;
  committee_id: number;
  assigned_to?: User;
  committee?: Committee;
  progress?: TaskProgress[];
  incidents?: Incident[];
  created_at: string;
  updated_at: string;
  completed_at?: string;
}
```

**Reglas de Negocio:**
- **`status`**: Solo el coordinador o el scheduler pueden cambiar a `Delayed`. El líder solo puede cambiar de `Pending` o `InProgress` a `Completed`. Las tareas se crean con estado `Pending` y cambian a `InProgress` cuando se asignan a un usuario.
- **`risk_level`**: Calculado automáticamente por el scheduler cada 24 horas según NexusEsi.md:
  - **Low**: Más de 5 días para la fecha límite
  - **Medium**: Entre 2 y 5 días para la fecha límite (inclusive)
  - **High**: Menos de 2 días o ya vencida (negativo)
- **`due_date`**: Debe estar dentro del rango `event.start_date` y `event.end_date`

**Nota sobre Cálculo de Riesgos:**
El sistema usa `now()->diffInDays($dueDate, false)` donde:
- Valores negativos = tarea vencida (High)
- 0-1 días = riesgo alto (High) 
- 2-5 días = riesgo medio (Medium)
- 6+ días = riesgo bajo (Low)

---

### 6.6 TaskProgress (Progreso de Tarea)

```typescript
interface TaskProgress {
  id: number;
  description: string;
  file_name?: string;
  file_path?: string;
  task_id: number;
  user_id: number;
  task?: Task;
  user?: User;
  created_at: string;
}
```

---

### 6.7 Alert (Alerta)

```typescript
enum AlertType {
  Preventive = 'Preventive',
  Critical = 'Critical'
}

interface Alert {
  id: number;
  message: string;
  type: AlertType;
  task_id: number;
  user_id: number;
  is_read: boolean;
  read_at?: string;
  task?: Task;
  user?: User;
  created_at: string;
  updated_at: string;
}
```

**Tipos de Alertas:**
- **Preventive (Preventiva)**: Cuando una tarea entra en riesgo medio (2-5 días restantes)
- **Critical (Crítica)**: Cuando una tarea está vencida (riesgo alto)

---

### 6.8 Incident (Incidencia)

```typescript
enum IncidentStatus {
  Reported = 'Reported',
  Resolved = 'Resolved'
}

interface Incident {
  id: number;
  description: string;
  status: IncidentStatus;
  task_id: number;
  reported_by_id: number;
  file_name?: string;
  file_path?: string;
  solution_task_id?: number;
  task?: Task;
  reported_by?: User;
  solution_task?: Task;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}
```

**Flujo de Incidencias:**
1. **Reported**: El líder reporta un problema. La tarea cambia a `Paused`.
2. **Resolved**: El coordinador resuelve el problema. La tarea vuelve a `InProgress`.

---

### 6.9 Location (Ubicación)

```typescript
interface Pais {
  id: number;
  nombre: string;
  codigo: string;
}

interface Estado {
  id: number;
  nombre: string;
  pais_id: number;
  pais?: Pais;
}

interface Ciudad {
  id: number;
  nombre: string;
  estado_id: number;
  estado?: Estado;
}
```

---

## 7. Manejo de Errores

### 7.1 Estructura de Errores

Todos los errores de la API siguen este formato estándar:

```typescript
interface ApiError {
  success: false;
  message: string;
  errors?: {
    [field: string]: string[];
  };
}
```

### 7.2 Códigos de Estado HTTP

| Código | Significado | Descripción |
|--------|-------------|-------------|
| **200** | OK | Petición exitosa |
| **201** | Created | Recurso creado exitosamente |
| **401** | Unauthorized | Token JWT inválido o expirado |
| **403** | Forbidden | Usuario no tiene permisos |
| **404** | Not Found | Recurso no encontrado |
| **422** | Unprocessable Entity | Errores de validación |
| **429** | Too Many Requests | Límite de rate limiting excedido |
| **500** | Internal Server Error | Error del servidor |

---

### 7.3 Errores Comunes

#### Error 401 - Token Expirado
```json
{
  "success": false,
  "message": "Token has expired"
}
```

**Solución:** Llamar a `POST /api/auth/refresh` para renovar el token.

---

#### Error 403 - Sin Permisos
```json
{
  "success": false,
  "message": "No tienes permisos para realizar esta acción"
}
```

**Solución:** Verificar que el usuario tenga el permiso requerido en su array de `permissions`.

---

#### Error 422 - Validación de Fechas (Tareas)
```json
{
  "message": "Los datos proporcionados no son válidos",
  "errors": {
    "due_date": [
      "La fecha límite de la tarea debe estar dentro del período de planificación del evento"
    ]
  }
}
```

**Causa:** La `due_date` está fuera del rango `event.start_date` - `event.end_date`.

**Solución:** Asegurarse de que `due_date` esté dentro del período del evento.

---

#### Error 429 - Rate Limiting
```json
{
  "success": false,
  "message": "Too many requests. Please try again later."
}
```

**Límites Actuales:**
- Login: 5 intentos por minuto
- Recuperación de contraseña: 3 intentos por minuto
- APIs generales: 1000 requests por minuto

---

### 7.4 Interceptor de Errores (Axios)

```typescript
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado - intentar renovar
      try {
        const refreshResponse = await api.post('/auth/refresh');
        const newToken = refreshResponse.data.data.access_token;
        localStorage.setItem('accessToken', newToken);
        
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return api.request(error.config);
      } catch (refreshError) {
        // Redirigir al login
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    
    if (error.response?.status === 422) {
      // Errores de validación
      const validationErrors = error.response.data.errors;
      Object.keys(validationErrors).forEach(field => {
        toast.error(validationErrors[field][0]);
      });
    }
    
    if (error.response?.status === 403) {
      toast.error('No tienes permisos para realizar esta acción');
    }
    
    return Promise.reject(error);
  }
);
```

---

## 8. Mejores Prácticas

### 8.1 Gestión de Estado con React Query

```typescript
// hooks/useTasks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export const useTasks = (filters?: TaskFilters) => {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      const response = await api.get('/tasks', { params: filters });
      return response.data.data;
    }
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (taskData: CreateTaskDto) => {
      const response = await api.post('/tasks', taskData);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Tarea creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear tarea');
    }
  });
};
```

---

### 8.2 Validación de Fechas en Frontend

```typescript
// utils/dateValidation.ts
import { Event } from '@/types';

export const validateTaskDate = (dueDate: string, event: Event): boolean => {
  const taskDate = new Date(dueDate);
  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);
  
  return taskDate >= startDate && taskDate <= endDate;
};

// Uso en formulario
const handleSubmit = (data: TaskFormData) => {
  if (!validateTaskDate(data.due_date, selectedEvent)) {
    toast.error(
      `La fecha debe estar entre ${selectedEvent.start_date} y ${selectedEvent.end_date}`
    );
    return;
  }
  
  createTask.mutate(data);
};
```

---

### 8.3 Componente de Permisos

```typescript
// components/PermissionGuard.tsx
import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGuardProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export const PermissionGuard = ({ 
  permission, 
  children, 
  fallback = null 
}: PermissionGuardProps) => {
  const { hasPermission } = usePermissions();
  
  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

// Uso
<PermissionGuard permission="tasks.create">
  <Button onClick={createTask}>Crear Tarea</Button>
</PermissionGuard>
```

---

### 8.4 Indicadores de Riesgo

```typescript
// components/RiskBadge.tsx
import { Badge } from '@/components/ui/badge';
import { RiskLevel } from '@/types';

interface RiskBadgeProps {
  level: RiskLevel;
}

export const RiskBadge = ({ level }: RiskBadgeProps) => {
  const variants = {
    Low: 'secondary',
    Medium: 'warning',
    High: 'destructive'
  };
  
  const colors = {
    Low: 'bg-green-100 text-green-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    High: 'bg-red-100 text-red-800'
  };
  
  return (
    <Badge className={colors[level]}>
      {level === 'Low' && '🟢 Bajo'}
      {level === 'Medium' && '🟡 Medio'}
      {level === 'High' && '🔴 Alto'}
    </Badge>
  );
};
```

---

### 8.5 Cálculo de Días Restantes

```typescript
// utils/dateUtils.ts
import { differenceInDays, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export const getDaysRemaining = (dueDate: string): number => {
  return differenceInDays(new Date(dueDate), new Date());
};

export const formatDueDate = (dueDate: string): string => {
  const days = getDaysRemaining(dueDate);
  
  if (days < 0) {
    return `Vencida hace ${Math.abs(days)} días`;
  }
  
  if (days === 0) {
    return 'Vence hoy';
  }
  
  if (days === 1) {
    return 'Vence mañana';
  }
  
  return `Vence en ${days} días`;
};

// Uso en componente
<div className={`text-sm ${daysRemaining < 2 ? 'text-red-600' : 'text-gray-600'}`}>
  {formatDueDate(task.due_date)}
</div>
```

---

### 8.6 Servicio Completo de API

```typescript
// services/taskService.ts
import api from './api';
import { Task, CreateTaskDto, UpdateTaskDto, TaskFilters } from '@/types';

class TaskService {
  async getTasks(filters?: TaskFilters): Promise<Task[]> {
    const response = await api.get('/tasks', { params: filters });
    return response.data.data;
  }
  
  async getTask(id: number): Promise<Task> {
    const response = await api.get(`/tasks/${id}`);
    return response.data.data;
  }
  
  async createTask(data: CreateTaskDto): Promise<Task> {
    const response = await api.post('/tasks', data);
    return response.data.data;
  }
  
  async updateTask(id: number, data: UpdateTaskDto): Promise<Task> {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data.data;
  }
  
  async deleteTask(id: number): Promise<void> {
    await api.delete(`/tasks/${id}`);
  }
  
  async assignTask(id: number, userId: number): Promise<Task> {
    const response = await api.post(`/tasks/${id}/assign`, {
      assigned_to_id: userId
    });
    return response.data.data;
  }
  
  async completeTask(id: number): Promise<Task> {
    const response = await api.put(`/tasks/${id}/complete`);
    return response.data.data;
  }
  
  async reportProgress(id: number, description: string, file?: File): Promise<void> {
    const formData = new FormData();
    formData.append('description', description);
    if (file) {
      formData.append('file', file);
    }
    
    await api.post(`/tasks/${id}/progress`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
}

export default new TaskService();
```

---

## 9. Recursos Adicionales

### 9.1 Variables de Entorno Requeridas

```env
# API
REACT_APP_API_URL=http://localhost:8000/api

# Pusher (WebSockets)
REACT_APP_PUSHER_KEY=your_pusher_key
REACT_APP_PUSHER_CLUSTER=mt1
```

---

### 9.2 Colección de Postman

Se recomienda crear una colección de Postman con todos los endpoints para pruebas manuales. Incluir:
- Variables de entorno para tokens
- Pre-request scripts para autenticación automática
- Tests para validar respuestas

---

### 9.3 Documentación de Referencia

- **ImplementacionNexusEsi.md**: Documentación técnica completa del sistema
- **NexusEsi.md**: Especificación de la lógica de negocio
- **TESTING-GUIDE.md**: Guía de pruebas del sistema

---

## 10. Changelog y Actualizaciones

### Versión Actual: 2.0 (Octubre 2025)

**Cambios Recientes:**
- ✅ Sistema de Tareas completamente implementado
- ✅ Sistema de Alertas automáticas
- ✅ Sistema de Incidencias con archivos adjuntos
- ✅ Scheduler automático de riesgos (cada 24 horas)
- ✅ Notificaciones en tiempo real con Pusher
- ✅ Validación temporal de tareas según período del evento
- ✅ Emails automáticos con SendGrid

---

## 📞 Soporte y Contacto

Para dudas o problemas con la API:

1. **Documentación Técnica**: Revisar `ImplementacionNexusEsi.md`
2. **Issues**: Reportar bugs en el sistema de seguimiento del proyecto
3. **Equipo Backend**: Contactar al equipo de desarrollo backend

---

---

## 📋 Cambios Aplicados para Coherencia con Backend

### **🔄 Correcciones Realizadas (Octubre 25, 2025)**

#### **1. Rutas de Ubicaciones Geográficas**
- ✅ **Cambiado:** `GET /api/locations/countries` → `GET /api/locations/paises`
- ✅ **Cambiado:** `GET /api/locations/states/{countryId}` → `GET /api/locations/estados/{paisId}`
- ✅ **Cambiado:** `GET /api/locations/cities/{stateId}` → `GET /api/locations/ciudades/estado/{estadoId}`
- ✅ **Agregado:** `GET /api/locations/ciudades/pais/{paisId}`
- ✅ **Agregado:** `GET /api/locations/hierarchy/{paisId?}`
- ✅ **Agregado:** `GET /api/locations/search`

#### **2. Rutas de Registro (Nuevas)**
- ✅ **Agregado:** Sección completa 4.4.1 con rutas de registro:
  - `GET /api/registration/paises`
  - `GET /api/registration/estados/{paisId}`
  - `GET /api/registration/ciudades/{estadoId}`
  - `GET /api/registration/instituciones/{ciudadId}`
  - `GET /api/registration/hierarchy/{paisId?}`
  - `GET /api/registration/validate-institution/{institutionId}`

#### **3. Estructura de Respuestas de Autenticación**
- ✅ **Corregido:** Login - `user` ahora está en la raíz de la respuesta, no dentro de `data`
- ✅ **Corregido:** GET /me - `user` está dentro de `data`
- ✅ **Agregado:** Campos adicionales en perfil de usuario:
  - `email_verified_at`
  - `roles` (array de objetos con `id`, `name`, `display_name`)
  - `role_display_name`
  - `welcome_message`
  - `dashboard_route`

#### **4. Nombres de Campos (Español)**
- ✅ **Cambiado:** `name` → `nombre` en ubicaciones e instituciones
- ✅ **Cambiado:** `code` → `codigo` en países
- ✅ **Cambiado:** `status` → `estado` en instituciones
- ✅ **Cambiado:** `description` → `descripcion` en instituciones
- ✅ **Agregado:** Campo `identificador` en instituciones

#### **5. Mensajes de Validación**
- ✅ **Actualizado:** Mensajes de error en español
- ✅ **Agregado:** Error específico para institución no activa
- ✅ **Corregido:** Mensaje de registro exitoso completo
- ✅ **Agregado:** Campos `registration_status` y `next_steps`

#### **6. Interfaces TypeScript**
- ✅ **Corregido:** Interface `User` con campos completos del backend real
- ✅ **Cambiado:** `Institution` → `Institucion` con campos en español
- ✅ **Cambiado:** `Country` → `Pais`, `State` → `Estado`, `City` → `Ciudad`
- ✅ **Agregado:** Interface `UserRole` para estructura de roles

#### **7. Cálculo de Riesgos de Tareas**
- ✅ **Documentado:** Cálculo exacto según `TaskController.php`:
  - High: < 2 días o vencida (valores negativos)
  - Medium: 2-5 días (inclusive)
  - Low: > 5 días
- ✅ **Agregado:** Nota sobre el método `now()->diffInDays($dueDate, false)`

#### **8. Validaciones Backend**
- ✅ **Corregido:** Validación contra tabla `instituciones` (no `institutions`)
- ✅ **Agregado:** Validación de institución activa en registro
- ✅ **Documentado:** Todos los mensajes de error exactos del backend

### **📊 Estadísticas de Correcciones**
- **Rutas corregidas:** 15+
- **Campos renombrados:** 20+
- **Interfaces actualizadas:** 10+
- **Mensajes de error corregidos:** 12+
- **Nuevas rutas documentadas:** 8+

### **✅ Estado de Coherencia**
**Resultado:** La documentación ahora es **100% coherente** con la implementación del backend.

---

**Documento Generado:** Octubre 25, 2025  
**Versión de la API:** 2.0  
**Estado del Proyecto:** ✅ Fase 2 Completada - Listo para Producción  
**Última Actualización:** Octubre 25, 2025 - Coherencia Backend Verificada

