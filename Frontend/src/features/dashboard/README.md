# Dashboard System - NexusESI Frontend

## Descripción
Sistema de dashboards específicos por rol que proporciona interfaces personalizadas para cada tipo de usuario en NexusESI.

## Estructura de Dashboards

### 🔧 Dashboard Base (`/src/features/dashboard/`)
- **Componente**: `Dashboard`
- **Ruta**: `/_authenticated/`
- **Descripción**: Dashboard genérico para usuarios sin rol específico
- **Uso**: Fallback cuando no se puede determinar el rol del usuario

### 👑 Dashboard de Administrador (`/src/features/dashboard/admin/`)
- **Componente**: `AdminDashboard`
- **Ruta**: `/_authenticated/admin/`
- **Rol**: `admin`
- **Descripción**: Panel completo de administración del sistema
- **Características**:
  - Acceso completo al sistema
  - Gestión de usuarios y roles
  - Supervisión de todas las actividades
  - Configuración global del sistema

### 🎯 Dashboard de Coordinador (`/src/features/dashboard/coordinator/`)
- **Componente**: `CoordinatorDashboard`
- **Ruta**: `/_authenticated/coordinator/`
- **Rol**: `coordinator`
- **Descripción**: Panel de coordinación y supervisión
- **Características**:
  - Supervisión de semilleros asignados
  - Coordinación de actividades
  - Reportes y métricas de coordinación
  - Gestión de líderes de semillero

### 🌱 Dashboard de Líder de Semillero (`/src/features/dashboard/seedbed-leader/`)
- **Componente**: `SeedbedLeaderDashboard`
- **Ruta**: `/_authenticated/seedbed-leader/`
- **Rol**: `seedbed_leader`
- **Descripción**: Panel de liderazgo de semillero
- **Características**:
  - Gestión del semillero propio
  - Coordinación del equipo
  - Seguimiento de proyectos
  - Reportes de actividades

## Componentes Compartidos

### DashboardSkeleton
Componente base que proporciona la estructura común para todos los dashboards:
- Layout consistente
- Título personalizable
- Mensaje de bienvenida personalizable
- Contenido dinámico

## Utilidades y Hooks

### `role-utils.ts`
Utilidades para manejo de roles:
- Definición de tipos de roles
- Configuración de rutas por rol
- Funciones de validación de roles
- Generación de títulos y mensajes

### `useRoleRedirect.ts`
Hook para redirección automática:
- Redirección basada en rol del usuario
- Información del dashboard actual
- Verificación de permisos

### `RoleDashboardWrapper.tsx`
Componente wrapper inteligente:
- Renderiza el dashboard correcto según el rol
- Protección de rutas por rol
- Fallback para roles no válidos

## Rutas del Sistema

```
/_authenticated/                 → Dashboard genérico
/_authenticated/admin/           → Dashboard de administrador
/_authenticated/coordinator/     → Dashboard de coordinador
/_authenticated/seedbed-leader/  → Dashboard de líder de semillero
```

## Uso

### Implementación Básica
```tsx
import { AdminDashboard } from '@/features/dashboard/admin'
import { CoordinatorDashboard } from '@/features/dashboard/coordinator'
import { SeedbedLeaderDashboard } from '@/features/dashboard/seedbed-leader'
```

### Con Wrapper Inteligente
```tsx
import { RoleDashboardWrapper } from '@/components/role-based'

// Renderiza automáticamente el dashboard correcto
<RoleDashboardWrapper />
```

### Protección de Rutas
```tsx
import { RoleProtected } from '@/components/role-based'

<RoleProtected allowedRoles={['admin', 'coordinator']}>
  <AdminOnlyComponent />
</RoleProtected>
```

## Extensibilidad

### Agregar Nuevos Componentes por Rol
1. Crear componentes específicos en `/components/` de cada dashboard
2. Exportarlos en el `index.ts` correspondiente
3. Importarlos en el dashboard principal

### Agregar Nuevos Roles
1. Actualizar `UserRole` en `role-utils.ts`
2. Agregar configuración en `ROLE_ROUTES`, `ROLE_TITLES`, etc.
3. Crear nuevo directorio de dashboard
4. Crear ruta correspondiente
5. Actualizar `RoleDashboardWrapper`

## Arquitectura

```
features/dashboard/
├── components/           # Componentes compartidos
├── admin/               # Dashboard de administrador
│   ├── components/      # Componentes específicos
│   └── index.tsx        # Componente principal
├── coordinator/         # Dashboard de coordinador
│   ├── components/      # Componentes específicos
│   └── index.tsx        # Componente principal
├── seedbed-leader/      # Dashboard de líder
│   ├── components/      # Componentes específicos
│   └── index.tsx        # Componente principal
└── index.tsx           # Dashboard genérico y exportaciones
```

Esta estructura permite:
- ✅ Mantenimiento independiente por rol
- ✅ Reutilización de componentes comunes
- ✅ Escalabilidad para nuevos roles
- ✅ Separación clara de responsabilidades
- ✅ Tipado fuerte con TypeScript