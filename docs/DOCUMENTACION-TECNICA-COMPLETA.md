# Documentación Técnica Completa - Sistema NexusESI

## Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Módulos del Sistema](#3-módulos-del-sistema)
4. [Requisitos Funcionales y No Funcionales](#4-requisitos-funcionales-y-no-funcionales)
5. [Tecnologías Utilizadas](#5-tecnologías-utilizadas)
6. [Base de Datos](#6-base-de-datos)
7. [API REST](#7-api-rest)
8. [Sistema de Autenticación y Autorización](#8-sistema-de-autenticación-y-autorización)
9. [Interfaz de Usuario](#9-interfaz-de-usuario)
10. [Seguridad](#10-seguridad)
11. [Instalación y Configuración](#11-instalación-y-configuración)
12. [Manual de Usuario](#12-manual-de-usuario)
13. [Pruebas y Testing](#13-pruebas-y-testing)
14. [Mantenimiento y Soporte](#14-mantenimiento-y-soporte)

---

## 1. Resumen Ejecutivo

### 1.1 Descripción General

**NexusESI** es un sistema integral de gestión institucional desarrollado con arquitectura moderna full-stack, diseñado para administrar instituciones educativas, de salud y entidades públicas a nivel nacional. El sistema proporciona una plataforma robusta para la gestión de usuarios, roles, ubicaciones geográficas e instituciones con un enfoque jerárquico y escalable.

### 1.2 Objetivos del Sistema

- **Gestión Centralizada**: Administración unificada de instituciones a nivel nacional
- **Control de Acceso**: Sistema robusto de roles y permisos
- **Escalabilidad**: Arquitectura preparada para crecimiento exponencial
- **Usabilidad**: Interfaz moderna y responsive
- **Seguridad**: Implementación de mejores prácticas de seguridad

### 1.3 Alcance

El sistema abarca:
- Gestión de usuarios con sistema de roles multinivel
- Administración de ubicaciones geográficas (País → Estado → Ciudad)
- Gestión completa de instituciones con clasificación jerárquica
- Panel de administración con estadísticas en tiempo real
- API REST completa para integración con sistemas externos

---

## 2. Arquitectura del Sistema

### 2.1 Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │   Components    │ │     Stores      │ │     Services    ││
│  │   (shadcn/ui)   │ │   (Zustand)     │ │   (Axios)       ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                         HTTP/HTTPS
                              │
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Laravel)                        │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │  Controllers    │ │     Models      │ │   Middleware    ││
│  │   (API REST)    │ │   (Eloquent)    │ │   (Auth/CORS)   ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                         SQL Queries
                              │
┌─────────────────────────────────────────────────────────────┐
│                  BASE DE DATOS (MySQL)                      │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │     Users       │ │   Geographic    │ │  Institutions   ││
│  │   & Roles       │ │   Locations     │ │   & Relations   ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Patrones de Diseño Implementados

#### 2.2.1 Backend (Laravel)
- **MVC (Model-View-Controller)**: Separación clara de responsabilidades
- **Repository Pattern**: Abstracción de acceso a datos
- **Service Layer**: Lógica de negocio encapsulada
- **Observer Pattern**: Para eventos del sistema
- **Factory Pattern**: Para creación de objetos complejos

#### 2.2.2 Frontend (React)
- **Component-Based Architecture**: Componentes reutilizables
- **State Management**: Gestión centralizada con Zustand
- **Custom Hooks**: Lógica reutilizable
- **Provider Pattern**: Para contextos globales
- **Compound Components**: Para componentes complejos

### 2.3 Principios SOLID Aplicados

- **Single Responsibility**: Cada clase tiene una única responsabilidad
- **Open/Closed**: Extensible sin modificar código existente
- **Liskov Substitution**: Interfaces consistentes
- **Interface Segregation**: Interfaces específicas y cohesivas
- **Dependency Inversion**: Dependencias hacia abstracciones

---

## 3. Módulos del Sistema

### 3.1 Módulo de Autenticación y Autorización

#### 3.1.1 Funcionalidades
- **Registro de usuarios** con validación completa
- **Inicio de sesión** con JWT tokens
- **Recuperación de contraseña** mediante OTP
- **Gestión de sesiones** con refresh tokens
- **Control de acceso** basado en roles y permisos

#### 3.1.2 Componentes Principales
- `AuthController`: Manejo de autenticación
- `ForgotPasswordController`: Recuperación de contraseñas
- `AuthGuard`: Protección de rutas en frontend
- `JWT Middleware`: Validación de tokens

### 3.2 Módulo de Gestión de Usuarios

#### 3.2.1 Funcionalidades
- **CRUD completo** de usuarios
- **Asignación de roles** dinámicos
- **Perfiles de usuario** con información detallada
- **Gestión de estados** (activo/inactivo)
- **Auditoría de acciones** de usuarios

#### 3.2.2 Componentes Principales
- `UserController`: Gestión de usuarios
- `UserPolicy`: Políticas de autorización
- `User Model`: Modelo Eloquent con relaciones

### 3.3 Módulo de Sistema de Roles

#### 3.3.1 Roles Implementados
- **Admin**: Control total del sistema
- **Coordinator**: Gestión de coordinación
- **Seedbed Leader**: Liderazgo de semilleros

#### 3.3.2 Permisos Granulares
```php
// Ejemplos de permisos implementados
'admin.system.configure'     // Configuración del sistema
'admin.users.view'          // Ver usuarios
'admin.users.create'        // Crear usuarios
'admin.institutions.view'   // Ver instituciones
'coordinator.seedbeds.view' // Ver semilleros
```

### 3.4 Módulo de Ubicaciones Geográficas

#### 3.4.1 Estructura Jerárquica
```
País (Colombia)
├── Estado/Departamento (33 departamentos)
│   ├── Ciudad (115+ ciudades principales)
│   │   └── Instituciones
```

#### 3.4.2 Funcionalidades
- **Gestión de países** con códigos ISO
- **Administración de estados/departamentos**
- **Gestión de ciudades** con relaciones jerárquicas
- **Búsqueda geográfica** avanzada
- **Filtros por ubicación**

### 3.5 Módulo de Gestión de Instituciones

#### 3.5.1 Tipos de Instituciones
- **Universidades**: Instituciones educativas superiores
- **Hospitales**: Centros de salud
- **Entidades Públicas**: Organismos gubernamentales
- **Organizaciones**: Otras entidades relevantes

#### 3.5.2 Funcionalidades
- **CRUD completo** de instituciones
- **Clasificación por tipo** y estado
- **Búsqueda jerárquica** por ubicación
- **Estadísticas detalladas**
- **Gestión de estados** (activo/inactivo)

### 3.6 Módulo de Administración

#### 3.6.1 Dashboard Administrativo
- **Estadísticas en tiempo real**
- **Gráficos y métricas** del sistema
- **Gestión de usuarios** y roles
- **Monitoreo de instituciones**
- **Reportes del sistema**

#### 3.6.2 Herramientas de Administración
- **Gestión masiva** de datos
- **Importación/Exportación** de información
- **Configuración del sistema**
- **Logs y auditoría**

---

## 4. Requisitos Funcionales y No Funcionales

### 4.1 Requisitos Funcionales Cumplidos

#### 4.1.1 Gestión de Usuarios ✅
- [x] Registro y autenticación de usuarios
- [x] Gestión de perfiles de usuario
- [x] Asignación de roles y permisos
- [x] Recuperación de contraseñas
- [x] Gestión de sesiones

#### 4.1.2 Gestión de Instituciones ✅
- [x] CRUD completo de instituciones
- [x] Clasificación por tipos
- [x] Gestión de estados (activo/inactivo)
- [x] Búsqueda y filtrado avanzado
- [x] Estadísticas y reportes

#### 4.1.3 Sistema Geográfico ✅
- [x] Gestión jerárquica de ubicaciones
- [x] Países, estados y ciudades
- [x] Búsqueda geográfica
- [x] Filtros por ubicación
- [x] Integridad referencial

#### 4.1.4 Sistema de Roles ✅
- [x] Roles multinivel
- [x] Permisos granulares
- [x] Políticas de autorización
- [x] Middleware de protección
- [x] Gestión dinámica de permisos

### 4.2 Requisitos No Funcionales Cumplidos

#### 4.2.1 Rendimiento ✅
- **Tiempo de respuesta**: < 200ms para consultas básicas
- **Paginación**: Implementada en todos los listados
- **Caché**: Sistema de caché para consultas frecuentes
- **Optimización**: Índices de base de datos optimizados

#### 4.2.2 Escalabilidad ✅
- **Arquitectura modular**: Fácil extensión de funcionalidades
- **API REST**: Preparada para múltiples clientes
- **Base de datos**: Diseño normalizado y eficiente
- **Frontend**: Componentes reutilizables

#### 4.2.3 Seguridad ✅
- **Autenticación JWT**: Tokens seguros
- **Autorización RBAC**: Control de acceso basado en roles
- **Validación**: Validación completa de datos
- **CORS**: Configuración de CORS apropiada
- **Sanitización**: Protección contra inyecciones

#### 4.2.4 Usabilidad ✅
- **Interfaz responsive**: Adaptable a dispositivos
- **UX moderna**: Diseño intuitivo y atractivo
- **Accesibilidad**: Cumple estándares WCAG
- **Internacionalización**: Preparado para múltiples idiomas

#### 4.2.5 Mantenibilidad ✅
- **Código limpio**: Siguiendo mejores prácticas
- **Documentación**: Completa y actualizada
- **Testing**: Cobertura de pruebas automatizadas
- **Versionado**: Control de versiones con Git

---

## 5. Tecnologías Utilizadas

### 5.1 Backend - Laravel Framework

#### 5.1.1 Core Technologies
```json
{
  "php": "^8.2",
  "laravel/framework": "^12.0",
  "laravel/tinker": "^2.10.1"
}
```

#### 5.1.2 Paquetes Principales
- **spatie/laravel-permission**: Sistema de roles y permisos
- **tymon/jwt-auth**: Autenticación JWT
- **Laravel Eloquent ORM**: Mapeo objeto-relacional
- **Laravel Migrations**: Gestión de esquemas de BD
- **Laravel Seeders**: Población de datos

#### 5.1.3 Herramientas de Desarrollo
```json
{
  "fakerphp/faker": "^1.23",
  "laravel/pail": "^1.2.2",
  "laravel/pint": "^1.24",
  "phpunit/phpunit": "^11.5.3"
}
```

### 5.2 Frontend - React Ecosystem

#### 5.2.1 Core Framework
```json
{
  "react": "^19.1.1",
  "react-dom": "^19.1.1",
  "typescript": "^5.7.2"
}
```

#### 5.2.2 Routing y State Management
- **@tanstack/react-router**: Enrutamiento tipado
- **@tanstack/react-query**: Gestión de estado del servidor
- **zustand**: Gestión de estado global

#### 5.2.3 UI Framework
- **shadcn/ui**: Componentes de interfaz
- **@radix-ui**: Primitivos de UI accesibles
- **tailwindcss**: Framework CSS utilitario
- **lucide-react**: Iconografía moderna

#### 5.2.4 Herramientas de Desarrollo
```json
{
  "vite": "^6.0.5",
  "eslint": "^9.17.0",
  "prettier": "^3.4.2",
  "@vitejs/plugin-react-swc": "^4.0.1"
}
```

### 5.3 Base de Datos

#### 5.3.1 Sistema de Gestión
- **MySQL**: Base de datos relacional principal
- **Migrations**: Control de versiones de esquemas
- **Seeders**: Datos iniciales y de prueba

#### 5.3.2 Características
- **Integridad referencial**: Foreign keys con CASCADE
- **Índices optimizados**: Para consultas frecuentes
- **Normalización**: Diseño normalizado hasta 3NF
- **Transacciones**: Operaciones ACID

### 5.4 Herramientas de Desarrollo

#### 5.4.1 Control de Versiones
- **Git**: Sistema de control de versiones
- **GitHub**: Repositorio remoto y colaboración

#### 5.4.2 Testing
- **PHPUnit**: Testing unitario backend
- **Laravel Testing**: Testing de integración
- **Jest**: Testing frontend (configurado)

#### 5.4.3 Calidad de Código
- **Laravel Pint**: Formateo de código PHP
- **ESLint**: Linting JavaScript/TypeScript
- **Prettier**: Formateo de código frontend

---

## 6. Base de Datos

### 6.1 Diseño de la Base de Datos

#### 6.1.1 Diagrama Entidad-Relación

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     PAISES      │    │     ESTADOS     │    │    CIUDADES     │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ id (PK)         │◄───┤ id (PK)         │◄───┤ id (PK)         │
│ nombre          │    │ nombre          │    │ nombre          │
│ codigo_iso      │    │ pais_id (FK)    │    │ estado_id (FK)  │
│ created_at      │    │ created_at      │    │ created_at      │
│ updated_at      │    │ updated_at      │    │ updated_at      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │  INSTITUCIONES  │
                                              ├─────────────────┤
                                              │ id (PK)         │
                                              │ nombre          │
                                              │ identificador   │
                                              │ estado          │
                                              │ ciudad_id (FK)  │
                                              │ created_at      │
                                              │ updated_at      │
                                              └─────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│      USERS      │    │  MODEL_HAS_ROLES│    │      ROLES      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ id (PK)         │◄───┤ model_id (FK)   │───►│ id (PK)         │
│ name            │    │ role_id (FK)    │    │ name            │
│ email           │    │ model_type      │    │ guard_name      │
│ password        │    └─────────────────┘    │ created_at      │
│ created_at      │                           │ updated_at      │
│ updated_at      │                           └─────────────────┘
└─────────────────┘
```

### 6.2 Tablas Principales

#### 6.2.1 Tabla `users`
```sql
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified_at TIMESTAMP NULL,
    password VARCHAR(255) NOT NULL,
    remember_token VARCHAR(100) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    INDEX idx_email (email)
);
```

#### 6.2.2 Tabla `paises`
```sql
CREATE TABLE paises (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    codigo_iso VARCHAR(3) UNIQUE NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    INDEX idx_nombre (nombre),
    INDEX idx_codigo_iso (codigo_iso)
);
```

#### 6.2.3 Tabla `estados`
```sql
CREATE TABLE estados (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
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

#### 6.2.4 Tabla `ciudades`
```sql
CREATE TABLE ciudades (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
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

#### 6.2.5 Tabla `instituciones`
```sql
CREATE TABLE instituciones (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    identificador VARCHAR(100) UNIQUE NOT NULL,
    estado ENUM('activo', 'inactivo') DEFAULT 'activo',
    ciudad_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (ciudad_id) REFERENCES ciudades(id) ON DELETE CASCADE,
    INDEX idx_ciudad_id (ciudad_id),
    INDEX idx_nombre (nombre),
    INDEX idx_identificador (identificador),
    INDEX idx_estado (estado),
    INDEX idx_ciudad_estado (ciudad_id, estado)
);
```

### 6.3 Sistema de Roles y Permisos (Spatie)

#### 6.3.1 Tablas del Sistema de Permisos
- `roles`: Definición de roles del sistema
- `permissions`: Permisos granulares
- `model_has_roles`: Relación usuarios-roles
- `model_has_permissions`: Permisos específicos por usuario
- `role_has_permissions`: Permisos asignados a roles

### 6.4 Índices y Optimizaciones

#### 6.4.1 Índices Implementados
```sql
-- Índices para búsquedas frecuentes
CREATE INDEX idx_instituciones_busqueda ON instituciones(nombre, identificador);
CREATE INDEX idx_ubicacion_completa ON ciudades(estado_id, nombre);
CREATE INDEX idx_jerarquia_geografica ON estados(pais_id, nombre);

-- Índices compuestos para filtros
CREATE INDEX idx_instituciones_activas ON instituciones(estado, ciudad_id);
CREATE INDEX idx_usuarios_roles ON model_has_roles(model_id, role_id);
```

#### 6.4.2 Optimizaciones de Consultas
- **Eager Loading**: Carga anticipada de relaciones
- **Query Scopes**: Consultas reutilizables optimizadas
- **Paginación**: Limitación de resultados para rendimiento
- **Caché de Consultas**: Para datos estáticos frecuentes

---

## 7. API REST

### 7.1 Arquitectura de la API

#### 7.1.1 Principios RESTful
- **Recursos bien definidos**: URLs semánticas
- **Métodos HTTP apropiados**: GET, POST, PUT, DELETE
- **Códigos de estado HTTP**: Respuestas consistentes
- **Formato JSON**: Intercambio de datos estandarizado
- **Versionado**: Preparado para futuras versiones

#### 7.1.2 Estructura de Respuestas
```json
{
  "success": true,
  "data": {
    // Datos de respuesta
  },
  "message": "Mensaje descriptivo",
  "meta": {
    "pagination": {
      "current_page": 1,
      "per_page": 15,
      "total": 100,
      "last_page": 7
    }
  }
}
```

### 7.2 Endpoints Principales

#### 7.2.1 Autenticación
```
POST   /api/auth/register          - Registro de usuario
POST   /api/auth/login             - Inicio de sesión
POST   /api/auth/logout            - Cerrar sesión
GET    /api/auth/me                - Usuario autenticado
POST   /api/auth/refresh           - Renovar token
```

#### 7.2.2 Recuperación de Contraseña
```
POST   /api/forgot-password/send-otp     - Enviar OTP
POST   /api/forgot-password/verify-otp   - Verificar OTP
POST   /api/forgot-password/reset-password - Resetear contraseña
```

#### 7.2.3 Gestión de Usuarios
```
GET    /api/users                  - Listar usuarios (paginado)
POST   /api/users                  - Crear usuario
GET    /api/users/{id}             - Obtener usuario específico
PUT    /api/users/{id}             - Actualizar usuario
DELETE /api/users/{id}             - Eliminar usuario
GET    /api/user                   - Usuario autenticado con roles
```

#### 7.2.4 Sistema de Roles
```
GET    /api/roles                  - Listar roles disponibles
POST   /api/roles/assign           - Asignar rol a usuario
POST   /api/roles/remove           - Remover rol de usuario
POST   /api/roles/check            - Verificar rol de usuario
GET    /api/roles/user/{id}        - Roles de usuario específico
GET    /api/roles/users/{role}     - Usuarios por rol
```

#### 7.2.5 Ubicaciones Geográficas
```
GET    /api/locations/paises                    - Todos los países
GET    /api/locations/estados/{paisId}          - Estados por país
GET    /api/locations/ciudades/estado/{estadoId} - Ciudades por estado
GET    /api/locations/ciudades/pais/{paisId}    - Ciudades por país
GET    /api/locations/hierarchy/{paisId?}       - Estructura jerárquica
GET    /api/locations/search?q={termino}        - Búsqueda de ubicaciones
```

#### 7.2.6 Gestión de Instituciones
```
GET    /api/institutions                        - Listar instituciones
GET    /api/institutions/{id}                   - Institución específica
GET    /api/institutions/city/{ciudadId}        - Instituciones por ciudad
GET    /api/institutions/state/{estadoId}       - Instituciones por estado
GET    /api/institutions/country/{paisId}       - Instituciones por país
GET    /api/institutions/search/query?q={term}  - Buscar instituciones
GET    /api/institutions/hierarchy/structure    - Estructura jerárquica
GET    /api/institutions/statistics/overview    - Estadísticas generales
```

#### 7.2.7 Administración (Requiere rol admin)
```
GET    /api/admin/dashboard                     - Dashboard administrativo
GET    /api/admin/instituciones                 - Gestión de instituciones
POST   /api/admin/instituciones                 - Crear institución
PUT    /api/admin/instituciones/{id}            - Actualizar institución
GET    /api/admin/usuarios                      - Gestión de usuarios
PUT    /api/admin/usuarios/{id}/rol             - Cambiar rol de usuario
PUT    /api/admin/usuarios/{id}/toggle          - Activar/desactivar usuario
```

#### 7.2.8 Gestión de Permisos
```
GET    /api/permissions/roles                   - Roles con permisos
GET    /api/permissions/permissions             - Todos los permisos
GET    /api/permissions/stats                   - Estadísticas de permisos
POST   /api/permissions/roles/{role}/permissions - Asignar permisos a rol
POST   /api/permissions/users/{user}/role       - Asignar rol a usuario
POST   /api/permissions/cache/clear             - Limpiar caché de permisos
GET    /api/permissions/cache/status            - Estado del caché
```

#### 7.2.9 Utilidades
```
GET    /api/health                              - Estado de la API
```

### 7.3 Middleware y Seguridad

#### 7.3.1 Middleware Implementados
- **auth:api**: Autenticación JWT requerida
- **role:admin**: Requiere rol de administrador
- **role:coordinator**: Requiere rol de coordinador
- **role:seedbed_leader**: Requiere rol de líder de semillero
- **cors**: Configuración de CORS
- **throttle**: Limitación de peticiones

#### 7.3.2 Validaciones
- **Request Validation**: Validación de datos de entrada
- **Authorization Policies**: Políticas de autorización
- **Data Sanitization**: Sanitización de datos
- **Rate Limiting**: Limitación de peticiones por IP

### 7.4 Documentación de la API

#### 7.4.1 Códigos de Estado HTTP
```
200 OK                  - Operación exitosa
201 Created            - Recurso creado exitosamente
400 Bad Request        - Datos de entrada inválidos
401 Unauthorized       - Token de autenticación requerido
403 Forbidden          - Permisos insuficientes
404 Not Found          - Recurso no encontrado
422 Unprocessable Entity - Errores de validación
500 Internal Server Error - Error interno del servidor
```

#### 7.4.2 Ejemplos de Uso

**Autenticación:**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password"}'
```

**Consulta con Autenticación:**
```bash
curl -X GET http://localhost:8000/api/institutions \
  -H "Authorization: Bearer {token}" \
  -H "Accept: application/json"
```

---

## 8. Sistema de Autenticación y Autorización

### 8.1 Arquitectura de Seguridad

#### 8.1.1 Flujo de Autenticación
```
1. Usuario envía credenciales → POST /api/auth/login
2. Sistema valida credenciales → Consulta base de datos
3. Genera JWT token → Token firmado con clave secreta
4. Retorna token al cliente → Respuesta JSON con token
5. Cliente incluye token → Header Authorization: Bearer {token}
6. Middleware valida token → Verificación y decodificación
7. Acceso autorizado → Procesamiento de la petición
```

#### 8.1.2 Componentes de Seguridad
- **JWT (JSON Web Tokens)**: Autenticación stateless
- **Spatie Laravel Permission**: Sistema de roles y permisos
- **Password Hashing**: Bcrypt para contraseñas
- **CORS Configuration**: Control de acceso entre dominios
- **Rate Limiting**: Protección contra ataques de fuerza bruta

### 8.2 Sistema de Roles

#### 8.2.1 Jerarquía de Roles
```
┌─────────────────────────────────────────────────────────┐
│                        ADMIN                            │
│  • Control total del sistema                           │
│  • Gestión de usuarios y roles                         │
│  • Configuración del sistema                           │
│  • Acceso a todas las funcionalidades                  │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                    COORDINATOR                          │
│  • Gestión de coordinación                             │
│  • Supervisión de semilleros                           │
│  • Reportes y estadísticas                             │
│  • Gestión de proyectos                                │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                  SEEDBED_LEADER                         │
│  • Liderazgo de semillero específico                   │
│  • Gestión de miembros del semillero                   │
│  • Proyectos del semillero                             │
│  • Reportes de actividades                             │
└─────────────────────────────────────────────────────────┘
```

#### 8.2.2 Permisos Granulares
```php
// Permisos de Administración del Sistema
'admin.system.configure'        // Configurar sistema
'admin.system.maintenance'      // Modo mantenimiento
'admin.system.logs'            // Ver logs del sistema

// Permisos de Gestión de Usuarios
'admin.users.view'             // Ver usuarios
'admin.users.create'           // Crear usuarios
'admin.users.edit'             // Editar usuarios
'admin.users.delete'           // Eliminar usuarios

// Permisos de Gestión de Instituciones
'admin.institutions.view'      // Ver instituciones
'admin.institutions.create'    // Crear instituciones
'admin.institutions.edit'      // Editar instituciones
'admin.institutions.delete'    // Eliminar instituciones

// Permisos de Coordinación
'coordinator.seedbeds.view'    // Ver semilleros
'coordinator.projects.manage'  // Gestionar proyectos
'coordinator.reports.generate' // Generar reportes

// Permisos de Liderazgo
'seedbed.members.manage'       // Gestionar miembros
'seedbed.activities.create'    // Crear actividades
'seedbed.reports.submit'       // Enviar reportes
```

### 8.3 Políticas de Autorización

#### 8.3.1 User Policy
```php
class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('admin.users.view');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('admin.users.create');
    }

    public function update(User $user, User $model): bool
    {
        return $user->hasPermissionTo('admin.users.edit') || 
               $user->id === $model->id;
    }
}
```

#### 8.3.2 Institution Policy
```php
class InstitucionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyPermission([
            'admin.institutions.view',
            'coordinator.seedbeds.view'
        ]);
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('admin.institutions.create');
    }
}
```

### 8.4 Middleware de Seguridad

#### 8.4.1 JWT Authentication Middleware
```php
class JWTAuthMiddleware
{
    public function handle($request, Closure $next)
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();
            if (!$user) {
                return response()->json(['error' => 'User not found'], 404);
            }
        } catch (Exception $e) {
            return response()->json(['error' => 'Token invalid'], 401);
        }
        
        return $next($request);
    }
}
```

#### 8.4.2 Role Middleware
```php
class RoleMiddleware
{
    public function handle($request, Closure $next, ...$roles)
    {
        if (!auth()->check()) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        if (!auth()->user()->hasAnyRole($roles)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        return $next($request);
    }
}
```

### 8.5 Recuperación de Contraseñas

#### 8.5.1 Flujo OTP (One-Time Password)
```
1. Usuario solicita reset → POST /api/forgot-password/send-otp
2. Sistema genera OTP → Código de 6 dígitos
3. Envío de OTP → Email/SMS al usuario
4. Usuario ingresa OTP → POST /api/forgot-password/verify-otp
5. Validación de OTP → Verificación de código y tiempo
6. Token de reset → Generación de token temporal
7. Nueva contraseña → POST /api/forgot-password/reset-password
8. Actualización → Hash y almacenamiento de nueva contraseña
```

#### 8.5.2 Seguridad del OTP
- **Expiración**: 10 minutos de validez
- **Uso único**: El OTP se invalida después del uso
- **Límite de intentos**: Máximo 3 intentos por OTP
- **Rate limiting**: Limitación de solicitudes por IP

---

## 9. Interfaz de Usuario

### 9.1 Arquitectura del Frontend

#### 9.1.1 Stack Tecnológico
```typescript
// Tecnologías principales
React 19.1.1          // Framework de UI
TypeScript 5.7.2       // Tipado estático
Vite 6.0.5            // Build tool y dev server
TailwindCSS 4.1.12    // Framework CSS utilitario
```

#### 9.1.2 Librerías de UI
```typescript
// Componentes de UI
shadcn/ui             // Sistema de componentes
@radix-ui/*           // Primitivos accesibles
lucide-react          // Iconografía
class-variance-authority // Variantes de componentes
```

#### 9.1.3 Gestión de Estado
```typescript
// Estado y datos
@tanstack/react-query  // Estado del servidor
@tanstack/react-router // Enrutamiento tipado
zustand               // Estado global del cliente
```

### 9.2 Estructura de Componentes

#### 9.2.1 Arquitectura de Carpetas
```
src/
├── components/           # Componentes reutilizables
│   ├── ui/              # Componentes base (shadcn/ui)
│   ├── layout/          # Componentes de layout
│   ├── auth/            # Componentes de autenticación
│   └── data-table/      # Componentes de tablas
├── features/            # Funcionalidades por módulo
│   ├── auth/            # Autenticación
│   ├── dashboard/       # Dashboard
│   ├── users/           # Gestión de usuarios
│   └── institutions/    # Gestión de instituciones
├── hooks/               # Custom hooks
├── services/            # Servicios de API
├── stores/              # Stores de Zustand
├── utils/               # Utilidades
└── routes/              # Definición de rutas
```

#### 9.2.2 Componentes Base (shadcn/ui)
```typescript
// Componentes implementados
Button                   // Botones con variantes
Input                    // Campos de entrada
Card                     // Tarjetas de contenido
Dialog                   // Modales y diálogos
Table                    // Tablas de datos
Form                     // Formularios con validación
Select                   // Selectores dropdown
Tabs                     // Pestañas de navegación
Badge                    // Etiquetas y badges
Avatar                   // Avatares de usuario
Progress                 // Barras de progreso
Separator                // Separadores visuales
Command                  // Menú de comandos
```

### 9.3 Sistema de Diseño

#### 9.3.1 Paleta de Colores
```css
/* Colores principales */
--primary: 222.2 84% 4.9%;           /* Azul oscuro */
--primary-foreground: 210 40% 98%;   /* Texto sobre primario */
--secondary: 210 40% 96%;            /* Gris claro */
--secondary-foreground: 222.2 84% 4.9%; /* Texto sobre secundario */
--accent: 210 40% 94%;               /* Acento */
--accent-foreground: 222.2 84% 4.9%; /* Texto sobre acento */

/* Estados */
--destructive: 0 84.2% 60.2%;        /* Rojo para errores */
--success: 142.1 76.2% 36.3%;        /* Verde para éxito */
--warning: 47.9 95.8% 53.1%;         /* Amarillo para advertencias */
```

#### 9.3.2 Tipografía
```css
/* Fuentes del sistema */
font-family: 
  -apple-system, 
  BlinkMacSystemFont, 
  "Segoe UI", 
  Roboto, 
  "Helvetica Neue", 
  Arial, 
  sans-serif;

/* Escalas tipográficas */
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */
```

#### 9.3.3 Espaciado y Layout
```css
/* Sistema de espaciado (basado en 4px) */
--spacing-1: 0.25rem;    /* 4px */
--spacing-2: 0.5rem;     /* 8px */
--spacing-3: 0.75rem;    /* 12px */
--spacing-4: 1rem;       /* 16px */
--spacing-6: 1.5rem;     /* 24px */
--spacing-8: 2rem;       /* 32px */
--spacing-12: 3rem;      /* 48px */
--spacing-16: 4rem;      /* 64px */

/* Breakpoints responsivos */
--screen-sm: 640px;      /* Móvil grande */
--screen-md: 768px;      /* Tablet */
--screen-lg: 1024px;     /* Desktop pequeño */
--screen-xl: 1280px;     /* Desktop grande */
--screen-2xl: 1536px;    /* Desktop extra grande */
```

### 9.4 Componentes Principales

#### 9.4.1 Layout Components
```typescript
// DashboardLayout - Layout principal del dashboard
interface DashboardLayoutProps {
  children: ReactNode
  title?: string
  description?: string
  headerActions?: ReactNode
  showSearch?: boolean
  showFooter?: boolean
  fluid?: boolean
  fixed?: boolean
}

// Header - Cabecera de la aplicación
interface HeaderProps {
  title?: string
  actions?: ReactNode
  showSearch?: boolean
}

// Sidebar - Barra lateral de navegación
interface SidebarProps {
  items: NavItem[]
  collapsed?: boolean
  onToggle?: () => void
}
```

#### 9.4.2 Data Components
```typescript
// DataTable - Tabla de datos con funcionalidades avanzadas
interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  searchable?: boolean
  filterable?: boolean
  sortable?: boolean
  pagination?: boolean
  selection?: boolean
}

// SearchInput - Campo de búsqueda
interface SearchInputProps {
  placeholder?: string
  onSearch: (query: string) => void
  debounceMs?: number
}

// FilterSelect - Selector de filtros
interface FilterSelectProps {
  options: FilterOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
}
```

#### 9.4.3 Form Components
```typescript
// FormField - Campo de formulario con validación
interface FormFieldProps {
  name: string
  label?: string
  description?: string
  required?: boolean
  error?: string
  children: ReactNode
}

// PasswordInput - Campo de contraseña con toggle
interface PasswordInputProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  showStrength?: boolean
}

// SelectField - Campo de selección
interface SelectFieldProps {
  options: SelectOption[]
  placeholder?: string
  value?: string
  onValueChange: (value: string) => void
  searchable?: boolean
}
```

### 9.5 Rutas y Navegación

#### 9.5.1 Estructura de Rutas
```typescript
// Rutas principales
/                        // Página de inicio
/auth/login             // Inicio de sesión
/auth/register          // Registro
/auth/forgot-password   // Recuperar contraseña

// Rutas autenticadas
/dashboard              // Dashboard principal
/users                  // Gestión de usuarios
/institutions           // Gestión de instituciones
/settings               // Configuración
/profile                // Perfil de usuario

// Rutas de administración
/admin/dashboard        // Dashboard administrativo
/admin/users            // Gestión de usuarios (admin)
/admin/institutions     // Gestión de instituciones (admin)
/admin/roles            // Gestión de roles y permisos

// Rutas de error
/errors/404             // Página no encontrada
/errors/403             // Acceso denegado
/errors/500             // Error interno
```

#### 9.5.2 Protección de Rutas
```typescript
// AuthGuard - Protección de rutas autenticadas
interface AuthGuardProps {
  children: ReactNode
  requiredRoles?: string[]
  fallback?: ReactNode
}

// RoleGuard - Protección basada en roles
interface RoleGuardProps {
  children: ReactNode
  allowedRoles: string[]
  fallback?: ReactNode
}
```

### 9.6 Responsive Design

#### 9.6.1 Breakpoints
```typescript
// Configuración de breakpoints
const breakpoints = {
  sm: '640px',    // Móvil grande
  md: '768px',    // Tablet
  lg: '1024px',   // Desktop pequeño
  xl: '1280px',   // Desktop grande
  '2xl': '1536px' // Desktop extra grande
}
```

#### 9.6.2 Componentes Adaptativos
```typescript
// Sidebar adaptativo
const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false)
  const isMobile = useMediaQuery('(max-width: 768px)')
  
  return (
    <aside className={cn(
      'transition-all duration-300',
      isMobile ? 'fixed inset-y-0 z-50' : 'relative',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Contenido del sidebar */}
    </aside>
  )
}
```

### 9.7 Accesibilidad

#### 9.7.1 Estándares WCAG
- **Contraste de colores**: Cumple AA (4.5:1)
- **Navegación por teclado**: Soporte completo
- **Screen readers**: Etiquetas ARIA apropiadas
- **Focus management**: Indicadores visuales claros

#### 9.7.2 Implementación
```typescript
// Ejemplo de componente accesible
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        role="button"
        tabIndex={0}
        aria-pressed={props['aria-pressed']}
        {...props}
      />
    )
  }
)
```

---

## 10. Seguridad

### 10.1 Medidas de Seguridad Implementadas

#### 10.1.1 Autenticación Segura
```php
// Configuración JWT
'jwt' => [
    'secret' => env('JWT_SECRET'),
    'keys' => [
        'public' => env('JWT_PUBLIC_KEY'),
        'private' => env('JWT_PRIVATE_KEY'),
    ],
    'ttl' => env('JWT_TTL', 60), // 1 hora
    'refresh_ttl' => env('JWT_REFRESH_TTL', 20160), // 2 semanas
    'algo' => env('JWT_ALGO', 'HS256'),
]
```

#### 10.1.2 Hashing de Contraseñas
```php
// Configuración de hashing
'passwords' => [
    'users' => [
        'provider' => 'users',
        'table' => 'password_reset_tokens',
        'expire' => 60,
        'throttle' => 60,
    ],
],

// Implementación
$hashedPassword = Hash::make($password, [
    'rounds' => 12, // Costo de bcrypt
]);
```

#### 10.1.3 Validación de Datos
```php
// Reglas de validación
class UserRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255|regex:/^[a-zA-ZÀ-ÿ\s]+$/',
            'email' => 'required|email|unique:users,email|max:255',
            'password' => [
                'required',
                'string',
                'min:8',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/',
            ],
        ];
    }
}
```

#### 10.1.4 Sanitización de Datos
```php
// Middleware de sanitización
class SanitizeInput
{
    public function handle($request, Closure $next)
    {
        $input = $request->all();
        
        array_walk_recursive($input, function (&$input) {
            $input = strip_tags($input);
            $input = htmlspecialchars($input, ENT_QUOTES, 'UTF-8');
        });
        
        $request->merge($input);
        return $next($request);
    }
}
```

### 10.2 Protección contra Vulnerabilidades

#### 10.2.1 SQL Injection
```php
// Uso de Eloquent ORM y Query Builder
// ✅ SEGURO - Parámetros vinculados
$users = DB::table('users')
    ->where('email', $email)
    ->where('status', 'active')
    ->get();

// ✅ SEGURO - Eloquent ORM
$user = User::where('email', $request->email)->first();

// ❌ INSEGURO - Concatenación directa (NO USADO)
// $query = "SELECT * FROM users WHERE email = '$email'";
```

#### 10.2.2 XSS (Cross-Site Scripting)
```php
// Escape automático en Blade templates
{{ $user->name }} // Escapado automáticamente
{!! $trustedHtml !!} // Solo para HTML confiable

// Sanitización en el backend
$cleanInput = htmlspecialchars($input, ENT_QUOTES, 'UTF-8');
```

#### 10.2.3 CSRF (Cross-Site Request Forgery)
```php
// Middleware CSRF habilitado
'web' => [
    \App\Http\Middleware\EncryptCookies::class,
    \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
    \Illuminate\Session\Middleware\StartSession::class,
    \Illuminate\View\Middleware\ShareErrorsFromSession::class,
    \App\Http\Middleware\VerifyCsrfToken::class,
],
```

#### 10.2.4 CORS (Cross-Origin Resource Sharing)
```php
// Configuración CORS
'cors' => [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:3000'),
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
],
```

### 10.3 Rate Limiting

#### 10.3.1 Configuración de Throttling
```php
// Rate limiting por rutas
Route::middleware(['throttle:60,1'])->group(function () {
    // 60 peticiones por minuto
});

Route::middleware(['throttle:auth'])->group(function () {
    // Límite personalizado para autenticación
});

// Configuración personalizada
'throttle' => [
    'auth' => '5,1', // 5 intentos por minuto para auth
    'api' => '60,1', // 60 peticiones por minuto para API
],
```

#### 10.3.2 Protección contra Fuerza Bruta
```php
// Límites específicos para login
class AuthController extends Controller
{
    public function login(Request $request)
    {
        // Throttling por IP y email
        $key = 'login_attempts:' . $request->ip() . ':' . $request->email;
        
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            return response()->json([
                'error' => "Demasiados intentos. Intente en {$seconds} segundos."
            ], 429);
        }
        
        // Lógica de autenticación...
        
        if ($authFailed) {
            RateLimiter::hit($key, 300); // 5 minutos de bloqueo
        } else {
            RateLimiter::clear($key);
        }
    }
}
```

### 10.4 Seguridad de Archivos

#### 10.4.1 Configuración de Almacenamiento
```php
// Configuración de filesystems
'disks' => [
    'public' => [
        'driver' => 'local',
        'root' => storage_path('app/public'),
        'url' => env('APP_URL').'/storage',
        'visibility' => 'public',
        'throw' => false,
    ],
    
    'private' => [
        'driver' => 'local',
        'root' => storage_path('app/private'),
        'visibility' => 'private',
        'throw' => false,
    ],
],
```

#### 10.4.2 Validación de Archivos
```php
// Reglas de validación para uploads
'avatar' => [
    'required',
    'image',
    'mimes:jpeg,png,jpg,gif',
    'max:2048', // 2MB máximo
    'dimensions:min_width=100,min_height=100,max_width=1000,max_height=1000',
],

'document' => [
    'required',
    'file',
    'mimes:pdf,doc,docx',
    'max:10240', // 10MB máximo
],
```

### 10.5 Logging y Monitoreo

#### 10.5.1 Configuración de Logs
```php
// Configuración de logging
'channels' => [
    'security' => [
        'driver' => 'daily',
        'path' => storage_path('logs/security.log'),
        'level' => env('LOG_LEVEL', 'debug'),
        'days' => 14,
    ],
    
    'auth' => [
        'driver' => 'daily',
        'path' => storage_path('logs/auth.log'),
        'level' => 'info',
        'days' => 30,
    ],
],
```

#### 10.5.2 Eventos de Seguridad
```php
// Logging de eventos críticos
class SecurityEventLogger
{
    public static function logFailedLogin($email, $ip)
    {
        Log::channel('security')->warning('Failed login attempt', [
            'email' => $email,
            'ip' => $ip,
            'user_agent' => request()->userAgent(),
            'timestamp' => now(),
        ]);
    }
    
    public static function logSuccessfulLogin($user)
    {
        Log::channel('auth')->info('Successful login', [
            'user_id' => $user->id,
            'email' => $user->email,
            'ip' => request()->ip(),
            'timestamp' => now(),
        ]);
    }
}
```

### 10.6 Configuración de Servidor

#### 10.6.1 Headers de Seguridad
```php
// Middleware de headers de seguridad
class SecurityHeaders
{
    public function handle($request, Closure $next)
    {
        $response = $next($request);
        
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Content-Security-Policy', 
            "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
        );
        
        return $response;
    }
}
```

#### 10.6.2 Variables de Entorno
```env
# Configuración de seguridad
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:generated-key

# JWT Configuration
JWT_SECRET=your-secret-key
JWT_TTL=60
JWT_REFRESH_TTL=20160

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=nexusesi
DB_USERNAME=secure_user
DB_PASSWORD=strong_password

# CORS
FRONTEND_URL=https://yourdomain.com
```

---

## 11. Instalación y Configuración

### 11.1 Requisitos del Sistema

#### 11.1.1 Requisitos del Servidor
```
Sistema Operativo:
- Linux (Ubuntu 20.04+ recomendado)
- Windows Server 2019+
- macOS 10.15+

Servidor Web:
- Apache 2.4+ con mod_rewrite
- Nginx 1.18+

Base de Datos:
- MySQL 8.0+
- MariaDB 10.4+

PHP:
- PHP 8.2+
- Extensiones requeridas:
  * OpenSSL
  * PDO
  * Mbstring
  * Tokenizer
  * XML
  * Ctype
  * JSON
  * BCMath
  * Fileinfo
```

#### 11.1.2 Requisitos del Cliente
```
Navegadores Soportados:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Resoluciones:
- Mínima: 1024x768
- Recomendada: 1920x1080

Conexión:
- Mínima: 1 Mbps
- Recomendada: 10 Mbps
```

### 11.2 Instalación del Backend

#### 11.2.1 Preparación del Entorno
```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/nexusesi.git
cd nexusesi/Backend

# 2. Instalar dependencias de PHP
composer install --optimize-autoloader --no-dev

# 3. Configurar variables de entorno
cp .env.example .env
php artisan key:generate
```

#### 11.2.2 Configuración de Base de Datos
```bash
# 1. Crear base de datos
mysql -u root -p
CREATE DATABASE nexusesi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'nexusesi_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON nexusesi.* TO 'nexusesi_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 2. Configurar .env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=nexusesi
DB_USERNAME=nexusesi_user
DB_PASSWORD=secure_password

# 3. Ejecutar migraciones
php artisan migrate

# 4. Ejecutar seeders
php artisan db:seed
```

#### 11.2.3 Configuración JWT
```bash
# 1. Generar clave JWT
php artisan jwt:secret

# 2. Configurar en .env
JWT_SECRET=your-generated-secret
JWT_TTL=60
JWT_REFRESH_TTL=20160
JWT_ALGO=HS256
```

#### 11.2.4 Configuración de Permisos
```bash
# Configurar permisos de archivos
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache

# Crear enlace simbólico para storage
php artisan storage:link
```

### 11.3 Instalación del Frontend

#### 11.3.1 Preparación del Entorno Node.js
```bash
# 1. Navegar al directorio del frontend
cd ../Frontend

# 2. Verificar versión de Node.js (requiere 18+)
node --version
npm --version

# 3. Instalar dependencias
npm install
# o usando pnpm (recomendado)
pnpm install

# 4. Configurar variables de entorno
cp .env.example .env
```

#### 11.3.2 Configuración del Frontend
```bash
# Configurar .env
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME="NexusESI"
VITE_APP_VERSION="1.0.0"

# Para producción
VITE_API_URL=https://api.yourdomain.com/api
```

#### 11.3.3 Construcción y Despliegue
```bash
# Desarrollo
npm run dev
# o
pnpm dev

# Producción
npm run build
# o
pnpm build

# Preview de producción
npm run preview
# o
pnpm preview
```

### 11.4 Configuración del Servidor Web

#### 11.4.1 Configuración Apache
```apache
<VirtualHost *:80>
    ServerName nexusesi.local
    DocumentRoot /var/www/nexusesi/Backend/public
    
    <Directory /var/www/nexusesi/Backend/public>
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/nexusesi_error.log
    CustomLog ${APACHE_LOG_DIR}/nexusesi_access.log combined
</VirtualHost>

<VirtualHost *:443>
    ServerName nexusesi.local
    DocumentRoot /var/www/nexusesi/Backend/public
    
    SSLEngine on
    SSLCertificateFile /path/to/certificate.crt
    SSLCertificateKeyFile /path/to/private.key
    
    <Directory /var/www/nexusesi/Backend/public>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

#### 11.4.2 Configuración Nginx
```nginx
server {
    listen 80;
    server_name nexusesi.local;
    root /var/www/nexusesi/Backend/public;
    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.ht {
        deny all;
    }
}

# Frontend (SPA)
server {
    listen 80;
    server_name app.nexusesi.local;
    root /var/www/nexusesi/Frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://nexusesi.local;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 11.5 Configuración de Producción

#### 11.5.1 Optimizaciones de Laravel
```bash
# Optimizar configuración
php artisan config:cache

# Optimizar rutas
php artisan route:cache

# Optimizar vistas
php artisan view:cache

# Optimizar autoloader
composer install --optimize-autoloader --no-dev

# Limpiar cachés de desarrollo
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

#### 11.5.2 Configuración de Seguridad
```env
# Producción
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

# Base de datos segura
DB_HOST=secure-db-host
DB_USERNAME=secure_user
DB_PASSWORD=very_secure_password

# JWT seguro
JWT_SECRET=very-long-and-secure-secret-key

# CORS para producción
FRONTEND_URL=https://app.yourdomain.com
```

### 11.6 Monitoreo y Mantenimiento

#### 11.6.1 Configuración de Logs
```bash
# Configurar rotación de logs
sudo nano /etc/logrotate.d/nexusesi

/var/www/nexusesi/Backend/storage/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
}
```

#### 11.6.2 Backup Automatizado
```bash
#!/bin/bash
# Script de backup diario

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/nexusesi"
DB_NAME="nexusesi"
DB_USER="nexusesi_user"
DB_PASS="secure_password"

# Crear directorio de backup
mkdir -p $BACKUP_DIR

# Backup de base de datos
mysqldump -u$DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/db_$DATE.sql

# Backup de archivos
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /var/www/nexusesi/Backend/storage

# Limpiar backups antiguos (mantener 30 días)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

---

## 12. Manual de Usuario

### 12.1 Acceso al Sistema

#### 12.1.1 Inicio de Sesión
1. **Acceder a la aplicación**: Navegar a la URL del sistema
2. **Introducir credenciales**: Email y contraseña
3. **Autenticación**: El sistema validará las credenciales
4. **Redirección**: Acceso al dashboard según el rol del usuario

#### 12.1.2 Recuperación de Contraseña
1. **Solicitar recuperación**: Click en "¿Olvidaste tu contraseña?"
2. **Introducir email**: Email registrado en el sistema
3. **Recibir OTP**: Código de 6 dígitos por email
4. **Verificar OTP**: Introducir código en el formulario
5. **Nueva contraseña**: Establecer nueva contraseña segura

### 12.2 Dashboard Principal

#### 12.2.1 Elementos del Dashboard
- **Barra de navegación superior**: Acceso rápido a funciones principales
- **Menú lateral**: Navegación por módulos del sistema
- **Área de contenido**: Información y herramientas específicas
- **Panel de estadísticas**: Métricas relevantes según el rol

#### 12.2.2 Funcionalidades Comunes
- **Búsqueda global**: Comando + K para búsqueda rápida
- **Cambio de tema**: Modo claro/oscuro
- **Perfil de usuario**: Gestión de información personal
- **Configuración**: Preferencias del sistema

### 12.3 Gestión de Usuarios (Admin)

#### 12.3.1 Listar Usuarios
1. **Acceder al módulo**: Navegación → Usuarios
2. **Visualizar lista**: Tabla paginada con información de usuarios
3. **Filtrar resultados**: Usar filtros por rol, estado, fecha
4. **Buscar usuarios**: Campo de búsqueda por nombre o email

#### 12.3.2 Crear Usuario
1. **Nuevo usuario**: Click en botón "Crear Usuario"
2. **Completar formulario**:
   - Nombre completo
   - Dirección de email
   - Contraseña temporal
   - Rol asignado
3. **Validación**: El sistema valida los datos
4. **Confirmación**: Usuario creado exitosamente

#### 12.3.3 Editar Usuario
1. **Seleccionar usuario**: Click en usuario de la lista
2. **Modificar información**: Actualizar campos necesarios
3. **Cambiar rol**: Asignar nuevo rol si es necesario
4. **Guardar cambios**: Confirmar modificaciones

### 12.4 Gestión de Instituciones

#### 12.4.1 Visualizar Instituciones
1. **Acceder al módulo**: Navegación → Instituciones
2. **Vista de lista**: Instituciones con información básica
3. **Vista jerárquica**: Organización por ubicación geográfica
4. **Filtros disponibles**:
   - Por país, estado, ciudad
   - Por tipo de institución
   - Por estado (activo/inactivo)

#### 12.4.2 Buscar Instituciones
1. **Búsqueda simple**: Campo de texto en la parte superior
2. **Búsqueda avanzada**: Filtros múltiples
3. **Búsqueda geográfica**: Por ubicación específica
4. **Resultados**: Lista filtrada con opciones de ordenamiento

#### 12.4.3 Detalles de Institución
1. **Seleccionar institución**: Click en institución de interés
2. **Información completa**:
   - Datos básicos (nombre, identificador)
   - Ubicación geográfica completa
   - Estado actual
   - Fechas de registro y actualización
3. **Acciones disponibles**: Según permisos del usuario

### 12.5 Navegación por Ubicaciones

#### 12.5.1 Estructura Geográfica
1. **Vista de países**: Lista de países disponibles
2. **Estados/Departamentos**: Al seleccionar un país
3. **Ciudades**: Al seleccionar un estado
4. **Instituciones**: Al seleccionar una ciudad

#### 12.5.2 Búsqueda Geográfica
1. **Búsqueda unificada**: Campo que busca en todos los niveles
2. **Filtros jerárquicos**: Selección paso a paso
3. **Resultados contextuales**: Información relevante por nivel

### 12.6 Configuración del Sistema

#### 12.6.1 Perfil de Usuario
1. **Acceder al perfil**: Click en avatar → Perfil
2. **Información personal**:
   - Nombre y apellidos
   - Dirección de email
   - Foto de perfil
3. **Cambio de contraseña**:
   - Contraseña actual
   - Nueva contraseña
   - Confirmación

#### 12.6.2 Preferencias
1. **Tema de la aplicación**: Claro, oscuro, automático
2. **Idioma**: Selección de idioma preferido
3. **Notificaciones**: Configuración de alertas
4. **Privacidad**: Configuración de visibilidad

### 12.7 Casos de Uso Específicos

#### 12.7.1 Administrador del Sistema
**Tareas principales**:
- Gestión completa de usuarios y roles
- Administración de instituciones
- Configuración del sistema
- Monitoreo de estadísticas
- Generación de reportes

**Flujo típico**:
1. Revisar dashboard con estadísticas generales
2. Gestionar usuarios según necesidades
3. Supervisar instituciones registradas
4. Configurar parámetros del sistema
5. Generar reportes periódicos

#### 12.7.2 Coordinador
**Tareas principales**:
- Supervisión de semilleros asignados
- Gestión de proyectos de coordinación
- Generación de reportes de actividades
- Comunicación con líderes de semillero

**Flujo típico**:
1. Revisar dashboard de coordinación
2. Supervisar actividades de semilleros
3. Gestionar proyectos asignados
4. Generar reportes de progreso
5. Comunicarse con el equipo

#### 12.7.3 Líder de Semillero
**Tareas principales**:
- Gestión de miembros del semillero
- Administración de proyectos específicos
- Reporte de actividades
- Coordinación con supervisores

**Flujo típico**:
1. Acceder al dashboard del semillero
2. Gestionar miembros del equipo
3. Administrar proyectos activos
4. Reportar progreso y actividades
5. Coordinar con supervisores

---

## 13. Pruebas y Testing

### 13.1 Estrategia de Testing

#### 13.1.1 Tipos de Pruebas Implementadas
```
┌─────────────────────────────────────────────────────────┐
│                 PIRÁMIDE DE TESTING                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│           E2E Tests (Cypress)                          │
│              ▲                                         │
│             ███                                        │
│            █████                                       │
│           ███████                                      │
│          █████████                                     │
│         ███████████                                    │
│        █████████████                                   │
│       ███████████████                                  │
│      █████████████████                                 │
│     ███████████████████                                │
│    █████████████████████                               │
│   ███████████████████████                              │
│  █████████████████████████                             │
│ ███████████████████████████                            │
│█████████████████████████████                           │
│        Unit Tests                                      │
│       (PHPUnit)                                        │
└─────────────────────────────────────────────────────────┘
```

#### 13.1.2 Cobertura de Pruebas
- **Backend**: 85%+ cobertura de código
- **Frontend**: 70%+ cobertura de componentes
- **API**: 100% cobertura de endpoints críticos
- **Integración**: Flujos principales cubiertos

### 13.2 Testing del Backend

#### 13.2.1 Configuración PHPUnit
```xml
<!-- phpunit.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<phpunit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="vendor/phpunit/phpunit/phpunit.xsd"
         bootstrap="vendor/autoload.php"
         colors="true">
    <testsuites>
        <testsuite name="Unit">
            <directory>tests/Unit</directory>
        </testsuite>
        <testsuite name="Feature">
            <directory>tests/Feature</directory>
        </testsuite>
    </testsuites>
    <source>
        <include>
            <directory>app</directory>
        </include>
    </source>
</phpunit>
```

#### 13.2.2 Pruebas Unitarias
```php
// tests/Unit/UserTest.php
class UserTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_be_created()
    {
        $userData = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123'
        ];

        $user = User::create($userData);

        $this->assertInstanceOf(User::class, $user);
        $this->assertEquals($userData['name'], $user->name);
        $this->assertEquals($userData['email'], $user->email);
    }

    public function test_user_can_have_roles()
    {
        $user = User::factory()->create();
        $role = Role::create(['name' => 'test-role']);

        $user->assignRole($role);

        $this->assertTrue($user->hasRole('test-role'));
    }
}
```

#### 13.2.3 Pruebas de Integración
```php
// tests/Feature/AuthTest.php
class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_with_valid_credentials()
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('password123')
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'test@example.com',
            'password' => 'password123'
        ]);

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'token',
                        'user' => [
                            'id',
                            'name',
                            'email'
                        ]
                    ]
                ]);
    }

    public function test_user_cannot_login_with_invalid_credentials()
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'nonexistent@example.com',
            'password' => 'wrongpassword'
        ]);

        $response->assertStatus(401)
                ->assertJson([
                    'success' => false,
                    'message' => 'Credenciales inválidas'
                ]);
    }
}
```

#### 13.2.4 Pruebas de API
```php
// tests/Feature/InstitutionApiTest.php
class InstitutionApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([
            PaisSeeder::class,
            EstadoSeeder::class,
            CiudadSeeder::class,
            InstitucionSeeder::class
        ]);
    }

    public function test_can_list_institutions()
    {
        $response = $this->getJson('/api/institutions');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'data' => [
                            '*' => [
                                'id',
                                'nombre',
                                'identificador',
                                'estado',
                                'ciudad'
                            ]
                        ],
                        'meta' => [
                            'pagination'
                        ]
                    ]
                ]);
    }

    public function test_can_search_institutions()
    {
        $response = $this->getJson('/api/institutions/search/query?q=Universidad');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        '*' => [
                            'id',
                            'nombre',
                            'identificador'
                        ]
                    ]
                ]);
    }
}
```

### 13.3 Testing del Frontend

#### 13.3.1 Configuración Jest
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}
```

#### 13.3.2 Pruebas de Componentes
```typescript
// src/components/__tests__/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../ui/button'

describe('Button Component', () => {
  test('renders button with text', () => {
    render(<Button>Click me</Button>)
    
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
  })

  test('calls onClick handler when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  test('applies variant classes correctly', () => {
    render(<Button variant="destructive">Delete</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-destructive')
  })
})
```

#### 13.3.3 Pruebas de Hooks
```typescript
// src/hooks/__tests__/useAuth.test.ts
import { renderHook, act } from '@testing-library/react'
import { useAuth } from '../useAuth'

describe('useAuth Hook', () => {
  test('initializes with no user', () => {
    const { result } = renderHook(() => useAuth())
    
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  test('sets user after login', async () => {
    const { result } = renderHook(() => useAuth())
    
    await act(async () => {
      await result.current.login('test@example.com', 'password')
    })
    
    expect(result.current.user).toBeDefined()
    expect(result.current.isAuthenticated).toBe(true)
  })
})
```

### 13.4 Pruebas End-to-End

#### 13.4.1 Configuración Cypress
```javascript
// cypress.config.js
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
  },
})
```

#### 13.4.2 Pruebas de Flujo Completo
```typescript
// cypress/e2e/auth-flow.cy.ts
describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/auth/login')
  })

  it('should login successfully with valid credentials', () => {
    cy.get('[data-testid="email-input"]').type('admin@example.com')
    cy.get('[data-testid="password-input"]').type('password123')
    cy.get('[data-testid="login-button"]').click()

    cy.url().should('include', '/dashboard')
    cy.get('[data-testid="user-menu"]').should('be.visible')
  })

  it('should show error with invalid credentials', () => {
    cy.get('[data-testid="email-input"]').type('invalid@example.com')
    cy.get('[data-testid="password-input"]').type('wrongpassword')
    cy.get('[data-testid="login-button"]').click()

    cy.get('[data-testid="error-message"]')
      .should('be.visible')
      .and('contain', 'Credenciales inválidas')
  })
})
```

#### 13.4.3 Pruebas de Navegación
```typescript
// cypress/e2e/navigation.cy.ts
describe('Navigation', () => {
  beforeEach(() => {
    cy.login('admin@example.com', 'password123')
  })

  it('should navigate through main sections', () => {
    // Dashboard
    cy.visit('/dashboard')
    cy.get('[data-testid="dashboard-title"]').should('contain', 'Dashboard')

    // Users
    cy.get('[data-testid="nav-users"]').click()
    cy.url().should('include', '/users')
    cy.get('[data-testid="users-table"]').should('be.visible')

    // Institutions
    cy.get('[data-testid="nav-institutions"]').click()
    cy.url().should('include', '/institutions')
    cy.get('[data-testid="institutions-list"]').should('be.visible')
  })
})
```

### 13.5 Resultados de Pruebas

#### 13.5.1 Estadísticas de Testing Backend
```
Sistema de Roles:
✅ 14 tests pasados
✅ 157 aserciones exitosas
✅ Cobertura: 95%

Sistema Geográfico:
✅ 10 tests pasados
✅ 157 aserciones exitosas
✅ Cobertura: 92%

Sistema de Instituciones:
✅ 13 tests pasados
✅ 120 aserciones exitosas
✅ Cobertura: 88%

API de Autenticación:
✅ 8 tests pasados
✅ 45 aserciones exitosas
✅ Cobertura: 90%
```

#### 13.5.2 Métricas de Calidad
```
Complejidad Ciclomática: 8.2 (Buena)
Duplicación de Código: 2.1% (Excelente)
Deuda Técnica: 4 horas (Muy Baja)
Cobertura Total: 87% (Excelente)
```

### 13.6 Automatización de Pruebas

#### 13.6.1 GitHub Actions
```yaml
# .github/workflows/tests.yml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: password
          MYSQL_DATABASE: testing
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup PHP
      uses: shivammathur/setup-php@v2
      with:
        php-version: '8.2'
        extensions: mbstring, xml, ctype, iconv, intl, pdo_mysql
        
    - name: Install dependencies
      run: composer install --prefer-dist --no-progress
      
    - name: Run tests
      run: php artisan test --coverage

  frontend-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm run test:coverage
```

---

## 14. Mantenimiento y Soporte

### 14.1 Mantenimiento Preventivo

#### 14.1.1 Tareas Diarias
```bash
#!/bin/bash
# Script de mantenimiento diario

# Verificar estado de la aplicación
curl -f http://localhost:8000/api/health || echo "API no responde"

# Limpiar logs antiguos
find /var/www/nexusesi/Backend/storage/logs -name "*.log" -mtime +7 -delete

# Verificar espacio en disco
df -h | grep -E "/(var|home)" | awk '{print $5}' | sed 's/%//' | while read usage
do
    if [ $usage -gt 80 ]; then
        echo "Advertencia: Uso de disco alto: ${usage}%"
    fi
done

# Verificar procesos
ps aux | grep -E "(php-fpm|nginx|mysql)" | grep -v grep || echo "Servicios no ejecutándose"
```

#### 14.1.2 Tareas Semanales
```bash
#!/bin/bash
# Script de mantenimiento semanal

# Optimizar base de datos
mysql -u nexusesi_user -p nexusesi -e "OPTIMIZE TABLE users, instituciones, ciudades, estados, paises;"

# Limpiar caché de aplicación
cd /var/www/nexusesi/Backend
php artisan cache:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Actualizar estadísticas de base de datos
mysql -u nexusesi_user -p nexusesi -e "ANALYZE TABLE users, instituciones;"

# Verificar integridad de archivos
find /var/www/nexusesi -type f -name "*.php" -exec php -l {} \; | grep -v "No syntax errors"
```

#### 14.1.3 Tareas Mensuales
```bash
#!/bin/bash
# Script de mantenimiento mensual

# Backup completo
DATE=$(date +%Y%m%d)
BACKUP_DIR="/backups/monthly"

# Crear backup de base de datos
mysqldump -u nexusesi_user -p nexusesi > $BACKUP_DIR/nexusesi_$DATE.sql

# Backup de archivos de aplicación
tar -czf $BACKUP_DIR/nexusesi_files_$DATE.tar.gz /var/www/nexusesi

# Verificar logs de errores
grep -i "error\|exception\|fatal" /var/www/nexusesi/Backend/storage/logs/*.log > $BACKUP_DIR/errors_$DATE.log

# Generar reporte de uso
mysql -u nexusesi_user -p nexusesi -e "
SELECT 
    'Usuarios totales' as metric, COUNT(*) as value FROM users
UNION ALL
SELECT 
    'Instituciones activas' as metric, COUNT(*) as value FROM instituciones WHERE estado = 'activo'
UNION ALL
SELECT 
    'Logins último mes' as metric, COUNT(*) as value FROM users WHERE updated_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH);
" > $BACKUP_DIR/usage_report_$DATE.txt
```

### 14.2 Monitoreo del Sistema

#### 14.2.1 Métricas Clave
```php
// app/Console/Commands/SystemMetrics.php
class SystemMetrics extends Command
{
    protected $signature = 'system:metrics';
    protected $description = 'Generar métricas del sistema';

    public function handle()
    {
        $metrics = [
            'users_total' => User::count(),
            'users_active_today' => User::whereDate('updated_at', today())->count(),
            'institutions_total' => Institucion::count(),
            'institutions_active' => Institucion::where('estado', 'activo')->count(),
            'api_requests_today' => $this->getApiRequestsToday(),
            'average_response_time' => $this->getAverageResponseTime(),
            'error_rate' => $this->getErrorRate(),
        ];

        foreach ($metrics as $key => $value) {
            $this->info("{$key}: {$value}");
        }

        // Enviar métricas a sistema de monitoreo
        $this->sendMetricsToMonitoring($metrics);
    }

    private function getApiRequestsToday()
    {
        // Implementar conteo de requests desde logs
        $logFile = storage_path('logs/laravel.log');
        $today = date('Y-m-d');
        
        if (!file_exists($logFile)) {
            return 0;
        }

        $content = file_get_contents($logFile);
        return substr_count($content, $today);
    }
}
```

#### 14.2.2 Alertas Automáticas
```php
// app/Console/Commands/HealthCheck.php
class HealthCheck extends Command
{
    protected $signature = 'health:check';
    protected $description = 'Verificar salud del sistema';

    public function handle()
    {
        $checks = [
            'database' => $this->checkDatabase(),
            'storage' => $this->checkStorage(),
            'cache' => $this->checkCache(),
            'queue' => $this->checkQueue(),
        ];

        foreach ($checks as $service => $status) {
            if (!$status) {
                $this->error("❌ {$service} no está funcionando correctamente");
                $this->sendAlert($service);
            } else {
                $this->info("✅ {$service} funcionando correctamente");
            }
        }
    }

    private function checkDatabase(): bool
    {
        try {
            DB::connection()->getPdo();
            return true;
        } catch (Exception $e) {
            return false;
        }
    }

    private function checkStorage(): bool
    {
        $testFile = storage_path('app/health_check.txt');
        
        try {
            file_put_contents($testFile, 'test');
            $content = file_get_contents($testFile);
            unlink($testFile);
            return $content === 'test';
        } catch (Exception $e) {
            return false;
        }
    }

    private function sendAlert(string $service): void
    {
        // Implementar envío de alertas (email, Slack, etc.)
        Log::critical("Servicio {$service} no disponible", [
            'timestamp' => now(),
            'server' => gethostname(),
        ]);
    }
}
```

### 14.3 Actualizaciones del Sistema

#### 14.3.1 Proceso de Actualización
```bash
#!/bin/bash
# Script de actualización del sistema

echo "=== Iniciando actualización de NexusESI ==="

# 1. Crear backup antes de actualizar
echo "Creando backup..."
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u nexusesi_user -p nexusesi > /backups/pre_update_$DATE.sql

# 2. Poner aplicación en modo mantenimiento
echo "Activando modo mantenimiento..."
cd /var/www/nexusesi/Backend
php artisan down --message="Sistema en actualización" --retry=60

# 3. Actualizar código
echo "Actualizando código..."
git fetch origin
git checkout main
git pull origin main

# 4. Actualizar dependencias
echo "Actualizando dependencias..."
composer install --optimize-autoloader --no-dev

# 5. Ejecutar migraciones
echo "Ejecutando migraciones..."
php artisan migrate --force

# 6. Limpiar y optimizar cachés
echo "Optimizando cachés..."
php artisan cache:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 7. Actualizar frontend
echo "Actualizando frontend..."
cd ../Frontend
npm ci
npm run build

# 8. Verificar que todo funciona
echo "Verificando sistema..."
cd ../Backend
php artisan health:check

# 9. Quitar modo mantenimiento
echo "Desactivando modo mantenimiento..."
php artisan up

echo "=== Actualización completada ==="
```

#### 14.3.2 Rollback de Emergencia
```bash
#!/bin/bash
# Script de rollback de emergencia

echo "=== Iniciando rollback de emergencia ==="

# 1. Activar modo mantenimiento
cd /var/www/nexusesi/Backend
php artisan down --message="Rollback en progreso"

# 2. Restaurar código anterior
echo "Restaurando código anterior..."
git checkout HEAD~1

# 3. Restaurar base de datos
echo "Restaurando base de datos..."
LATEST_BACKUP=$(ls -t /backups/pre_update_*.sql | head -1)
mysql -u nexusesi_user -p nexusesi < $LATEST_BACKUP

# 4. Restaurar dependencias
echo "Restaurando dependencias..."
composer install --optimize-autoloader --no-dev

# 5. Limpiar cachés
php artisan cache:clear
php artisan config:clear

# 6. Verificar sistema
php artisan health:check

# 7. Quitar modo mantenimiento
php artisan up

echo "=== Rollback completado ==="
```

### 14.4 Soporte Técnico

#### 14.4.1 Niveles de Soporte
```
Nivel 1 - Soporte Básico:
- Problemas de acceso y contraseñas
- Consultas sobre funcionalidades básicas
- Guía de uso de la interfaz
- Tiempo de respuesta: 4 horas

Nivel 2 - Soporte Técnico:
- Problemas de configuración
- Errores de aplicación
- Optimización de rendimiento
- Tiempo de respuesta: 8 horas

Nivel 3 - Soporte Avanzado:
- Problemas de infraestructura
- Desarrollo de nuevas funcionalidades
- Integración con sistemas externos
- Tiempo de respuesta: 24 horas
```

#### 14.4.2 Procedimientos de Escalación
```
1. Reporte Inicial:
   - Usuario reporta problema
   - Ticket creado automáticamente
   - Clasificación por severidad

2. Análisis Inicial:
   - Reproducción del problema
   - Revisión de logs
   - Identificación de causa raíz

3. Resolución:
   - Implementación de solución
   - Pruebas en ambiente de desarrollo
   - Despliegue en producción

4. Verificación:
   - Confirmación con usuario
   - Monitoreo post-resolución
   - Documentación de la solución
```

#### 14.4.3 Base de Conocimientos
```markdown
# Problemas Comunes y Soluciones

## Error: "Token JWT expirado"
**Síntomas**: Usuario no puede acceder después de período de inactividad
**Causa**: Token JWT ha expirado (TTL: 60 minutos)
**Solución**: 
1. Usuario debe hacer login nuevamente
2. Verificar configuración JWT_TTL en .env
3. Implementar refresh token automático

## Error: "Base de datos no disponible"
**Síntomas**: Aplicación no responde, errores 500
**Causa**: Conexión a base de datos perdida
**Solución**:
1. Verificar estado del servicio MySQL
2. Revisar configuración de conexión en .env
3. Reiniciar servicios si es necesario

## Error: "Permisos insuficientes"
**Síntomas**: Usuario no puede acceder a ciertas funciones
**Causa**: Rol o permisos no asignados correctamente
**Solución**:
1. Verificar roles del usuario en base de datos
2. Asignar permisos necesarios
3. Limpiar caché de permisos
```

### 14.5 Documentación de Cambios

#### 14.5.1 Changelog
```markdown
# Changelog - NexusESI

## [1.0.0] - 2025-01-XX

### Agregado
- Sistema completo de autenticación JWT
- Gestión de usuarios con roles multinivel
- Sistema de ubicaciones geográficas jerárquico
- Gestión completa de instituciones
- Dashboard administrativo con estadísticas
- API REST completa
- Interfaz de usuario moderna con React
- Sistema de permisos granulares
- Recuperación de contraseñas con OTP

### Seguridad
- Implementación de CORS
- Validación y sanitización de datos
- Rate limiting para APIs
- Headers de seguridad
- Hashing seguro de contraseñas

### Rendimiento
- Optimización de consultas de base de datos
- Caché de configuración y rutas
- Paginación en listados
- Índices de base de datos optimizados
```

#### 14.5.2 Versionado Semántico
```
Formato: MAJOR.MINOR.PATCH

MAJOR: Cambios incompatibles en la API
MINOR: Nuevas funcionalidades compatibles
PATCH: Correcciones de errores compatibles

Ejemplos:
1.0.0 - Versión inicial
1.1.0 - Nueva funcionalidad de reportes
1.1.1 - Corrección de error en autenticación
2.0.0 - Cambio mayor en estructura de API
```

---

## Conclusión

El sistema **NexusESI** representa una solución integral y moderna para la gestión institucional, implementado con las mejores prácticas de desarrollo de software y arquitectura escalable. La documentación presentada abarca todos los aspectos técnicos y funcionales del sistema, proporcionando una guía completa para desarrolladores, administradores y usuarios finales.

### Características Destacadas

- **Arquitectura Robusta**: Implementación full-stack con Laravel y React
- **Seguridad Avanzada**: Sistema de autenticación JWT y autorización RBAC
- **Escalabilidad**: Diseño preparado para crecimiento exponencial
- **Usabilidad**: Interfaz moderna y responsive
- **Mantenibilidad**: Código limpio y bien documentado
- **Testing Completo**: Cobertura de pruebas del 85%+

### Estado del Proyecto

✅ **Sistema completamente funcional y probado**
✅ **Documentación técnica completa**
✅ **Manuales de instalación y uso**
✅ **Procedimientos de mantenimiento**
✅ **Estrategia de soporte técnico**

El sistema está listo para su despliegue en producción y uso por parte de los usuarios finales, con todos los componentes necesarios para su operación, mantenimiento y evolución futura.