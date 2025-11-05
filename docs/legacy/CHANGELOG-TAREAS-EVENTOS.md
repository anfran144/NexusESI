# Changelog: Integración Tareas-Eventos

## [1.1.0] - 2025-10-24

### ✅ Agregado

#### Backend
- **11 nuevos permisos específicos de eventos:**
  - `events.tasks.*` (6 permisos): view, manage, assign, view_assigned, complete, report_progress
  - `events.incidents.*` (3 permisos): view, report, resolve
  - `events.alerts.*` (2 permisos): view, manage
- Compatibilidad retroactiva con permisos legacy
- TaskPolicy actualizado para soportar ambos tipos de permisos

#### Frontend
- **Breadcrumb contextual** en `DashboardContent`
- **Badge de evento activo** en sidebar
- Permisos específicos en rutas:
  - `events.tasks.manage` para Gestión de Tareas
  - `events.tasks.view_assigned` para Mis Tareas
  - `events.alerts.view` para Mis Alertas

### 🔧 Modificado
- `Backend/database/seeders/PermissionSeeder.php` - Permisos duales
- `Backend/app/Policies/TaskPolicy.php` - Soporte dual de permisos
- `Frontend/src/components/layout/unified-sidebar-data.ts` - Permisos específicos
- `Frontend/src/components/layout/app-sidebar.tsx` - Badge de evento activo
- `Frontend/src/components/layout/dashboard-content.tsx` - Breadcrumb
- `Frontend/src/components/layout/breadcrumb.tsx` - Nuevo componente
- Rutas de tareas (3 archivos) - PermissionGuard actualizado

### 📊 Resultados
- ✅ 63 permisos totales en el sistema
- ✅ 11 permisos específicos de eventos
- ✅ Compatibilidad 100% con código existente
- ✅ Sin errores de compilación

---

## Comandos para Aplicar

```bash
# Backend
cd Backend
php artisan migrate:fresh --seed

# Frontend
cd Frontend
npm run dev
```

## [1.4.1] - 2025-01-24 (Noche)

### 🔧 Modificado

#### Frontend - Panel de Coordinación
- **Dashboard del Coordinador** (`coordinator/index.tsx`)
  - Integrado con `DashboardLayout` y `DashboardContent`
  - Header y footer consistentes con el resto de la aplicación
  - **Contenido completamente vacío** - solo estructura básica
  - Eliminadas métricas estáticas y componentes innecesarios

---

## [1.3.0] - 2025-10-24 (Noche)

### ✅ Agregado

#### Frontend - Módulo de Monitoreo
- **Nueva sección "Monitoreo" en sidebar contextual**
- **Ruta:** `/coordinator/eventos/$eventId/monitoreo`
- **Componentes creados:**
  - `KPICard` - Tarjetas de métricas con variantes (success, danger, warning)
  - `KanbanBoard` - Vista Kanban con columnas por estado
  - `GanttTimeline` - Cronograma visual profesional con timeline horizontal
  - `TaskTable` - Tabla detallada con filtros y acciones
- **Sistema de filtros avanzados:**
  - Filtro por comité (con colores)
  - Filtro por responsable
  - Filtro por rango de fechas (semana, mes, atrasadas)
- **Vistas múltiples:**
  - Vista Kanban (columnas por estado)
  - Vista Cronograma (timeline Gantt)
  - Vista Tabla (lista detallada)
- **KPIs en tiempo real:**
  - Tareas totales y completadas
  - Tareas en progreso y atrasadas
  - Porcentaje de progreso general
- **Datos Mock:** Implementado con datos de prueba para desarrollo y testing

#### Backend
- **Métodos agregados a EventService:**
  - `tasks(eventId)` - Obtener tareas del evento
  - `getEventCommittees(eventId)` - Obtener comités del evento

### 🔧 Modificado
- `Frontend/src/components/layout/data/unified-sidebar-data.ts` - Nuevo item "Monitoreo"
- `Frontend/src/components/layout/nav-group.tsx` - URL dinámica para Monitoreo
- `Frontend/src/components/layout/breadcrumb.tsx` - Breadcrumb para Monitoreo
- `Frontend/src/services/event.service.ts` - Métodos para Monitoreo

### 🗑️ Eliminado
- `Frontend/src/routes/_authenticated/tasks/index.tsx` - Ruta antigua de gestión de tareas
- `Frontend/src/routes/_authenticated/tasks/my-tasks.tsx` - Ruta antigua de mis tareas
- `Frontend/src/routes/_authenticated/tasks/alerts.tsx` - Ruta antigua de alertas
- Referencias a rutas `/tasks/*` en dashboard del coordinador

---

## [1.2.0] - 2025-10-24 (Tarde)

### ✅ Agregado

#### Backend
- **3 nuevos endpoints específicos por evento:**
  - `GET /api/events/{id}/tasks` - Obtener tareas de un evento
  - `GET /api/events/{id}/my-tasks` - Obtener mis tareas del evento
  - `GET /api/events/{id}/alerts` - Obtener alertas del evento
- Validación de institución en endpoints de evento
- Filtrado automático de tareas/alertas por evento

#### Frontend
- **3 nuevas rutas contextuales:**
  - `/coordinator/eventos/$eventId/tasks` - Gestión de tareas contextual
  - `/coordinator/eventos/$eventId/my-tasks` - Mis tareas contextual
  - `/coordinator/eventos/$eventId/alerts` - Alertas contextuales
- URLs dinámicas en sidebar con eventId
- Breadcrumbs mejorados para rutas contextuales
- Componentes TaskDashboard, TaskList y AlertList con prop `eventId`

### 🔧 Modificado
- `Backend/app/Http/Controllers/EventController.php` - 3 métodos nuevos
- `Backend/routes/api/events.php` - 3 rutas nuevas
- `Frontend/src/components/layout/nav-group.tsx` - URLs contextuales
- `Frontend/src/components/layout/breadcrumb.tsx` - Breadcrumbs mejorados

---

## Próximos Pasos

- [ ] Testing de permisos con diferentes roles
- [x] Rutas contextuales con eventId ✅
- [x] Endpoints API específicos por evento ✅

