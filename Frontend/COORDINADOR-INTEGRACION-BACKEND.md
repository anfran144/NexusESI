# Integración Backend - Vistas del Coordinador

Este documento detalla el estado de integración entre las vistas del coordinador y el backend de NexusESI.

## 📊 Estado de Integración por Vista

### ✅ Vista Principal del Evento (`/coordinator/eventos/$eventId`)

**Datos REALES del Backend:**
- ✅ `event.id` - ID del evento
- ✅ `event.name` - Nombre del evento
- ✅ `event.description` - Descripción
- ✅ `event.start_date` - Fecha de inicio
- ✅ `event.end_date` - Fecha de finalización
- ✅ `event.status` - Estado (active, inactive, finished)
- ✅ `event.coordinator` - Datos del coordinador
- ✅ `event.institution` - Datos de la institución
- ✅ `event.committees_count` - Número de comités
- ✅ `event.participants_count` - Número de participantes

**Datos PLACEHOLDER (marcadores de posición):**
- ⚠️ `mockEventStats.progress` - Progreso general del evento (%)
- ⚠️ `mockEventStats.active_committees` - Comités activos
- ⚠️ `mockEventStats.active_participants` - Participantes activos
- ⚠️ `mockEventStats.total_tasks` - Total de tareas
- ⚠️ `mockEventStats.completed_tasks` - Tareas completadas
- ⚠️ `mockEventStats.open_incidents` - Incidencias abiertas
- ⚠️ `mockEventStats.my_tasks` - Mis tareas asignadas
- ⚠️ `recentActivities[]` - Sistema de actividad reciente

**TODO para el Backend:**
```typescript
// Endpoint sugerido: GET /api/events/{id}/statistics
{
  progress: number,              // Calcular: (completed_tasks / total_tasks) * 100
  active_committees: number,     // Comités con tareas activas
  active_participants: number,   // Usuarios con tareas asignadas
  total_tasks: number,          // Tareas del evento
  completed_tasks: number,      // Tareas completadas
  open_incidents: number,       // Incidencias no resueltas
  my_tasks: number             // Tareas asignadas al usuario actual
}
```

---

### ✅ Vista de Comités (`/coordinator/eventos/$eventId/comites`)

**Componente:** `CommitteesManager`

**Datos REALES del Backend:**
- ✅ `committee.id` - ID del comité
- ✅ `committee.name` - Nombre del comité
- ✅ `committee.description` - Descripción
- ✅ `committee.event_id` - ID del evento asociado
- ✅ `committee.members_count` - Número de miembros
- ✅ `committee.members[]` - Lista de miembros

**Datos PLACEHOLDER:**
- ⚠️ Estadísticas de tareas por comité:
  - `totalTasks` - Total de tareas
  - `completedTasks` - Tareas completadas
  - `progress` - Porcentaje de progreso

**TODO para el Backend:**
```typescript
// Endpoint sugerido: GET /api/committees/{id}/statistics
{
  total_tasks: number,
  completed_tasks: number,
  in_progress_tasks: number,
  progress_percentage: number  // (completed_tasks / total_tasks) * 100
}
```

---

### ✅ Vista de Banco de Tareas (`/coordinator/eventos/$eventId/tasks`)

**Componente:** `TaskBankManager`

**Estado de Integración:** ✅ **COMPLETAMENTE INTEGRADO**

**Datos REALES del Backend:**
- ✅ Todas las tareas se cargan desde `taskService.getTasks({ committee_id })`
- ✅ Todos los comités se cargan desde `committeeService.getCommittees({ event_id })`

**Campos de Tarea del Backend:**
- ✅ `id, title, description, status, risk_level, due_date, committee_id, assigned_to_id`
- ✅ `assigned_to` (relación con usuario)
- ✅ `committee` (relación con comité)
- ✅ `created_at, updated_at`

**Sin Placeholders:** ✨ Esta vista está completamente funcional con datos reales.

---

### ⚠️ Vista de Incidencias (`/coordinator/eventos/$eventId/incidencias`)

**Estado de Integración:** ⚠️ **PARCIALMENTE INTEGRADO**

**Datos REALES del Backend:**
- ✅ `incident.id` - ID de la incidencia
- ✅ `incident.description` - Descripción del problema
- ✅ `incident.status` - Estado: 'Reported' | 'Resolved'
- ✅ `incident.task_id` - ID de la tarea relacionada
- ✅ `incident.reported_by_id` - ID del usuario que reportó
- ✅ `incident.reported_by` - Datos del usuario
- ✅ `incident.file_name` - Nombre del archivo adjunto
- ✅ `incident.file_path` - Ruta del archivo
- ✅ `incident.solution_task_id` - ID de la tarea de solución
- ✅ `incident.created_at, updated_at, resolved_at`

**Datos PLACEHOLDER:**
- ⚠️ `incident.title` - Backend NO tiene este campo (se genera desde descripción)
- ⚠️ `incident.priority` - Sistema de prioridades NO EXISTE
  - Estados: 'low' | 'medium' | 'high' | 'critical'
- ⚠️ `incident.category` - Sistema de categorías NO EXISTE
  - Categorías: 'technical' | 'logistics' | 'security' | 'communication' | 'other'
- ⚠️ `incident.assignedTo` - Usuario asignado para resolver NO EXISTE
- ⚠️ `incident.comments[]` - Sistema de comentarios NO EXISTE

**Limitación Actual:**
```typescript
// Backend NO filtra incidencias por evento
// Se cargan TODAS las incidencias del usuario
// TODO: Backend debe agregar filtro por evento:
//   GET /api/incidents?event_id={eventId}
```

**TODO para el Backend:**
```typescript
// Campos sugeridos para agregar a Incidents:
interface IncidentBackend {
  // Campos existentes...
  
  // Nuevos campos sugeridos:
  title?: string,                  // Título corto de la incidencia
  priority?: 'low' | 'medium' | 'high' | 'critical',
  category?: 'technical' | 'logistics' | 'security' | 'communication' | 'other',
  assigned_to_id?: number,         // Usuario asignado para resolver
  assigned_to?: User,              // Relación con usuario
  comments?: IncidentComment[]     // Sistema de comentarios
}

// Nuevo modelo sugerido: IncidentComment
interface IncidentComment {
  id: number,
  incident_id: number,
  user_id: number,
  content: string,
  created_at: string
}
```

---

### ⚠️ Vista de Monitoreo (`/coordinator/eventos/$eventId/monitoreo`)

**Estado de Integración:** ⚠️ **USANDO MOCK DATA**

**Datos REALES del Backend:**
- ✅ `event` - Información básica del evento se carga

**Datos PLACEHOLDER:**
- ⚠️ **TODAS las tareas** - Actualmente usando `mockTasks[]`
- ⚠️ **TODOS los comités** - Actualmente usando `mockCommittees[]`
- ⚠️ **TODOS los miembros** - Actualmente usando `mockMembers[]`

**Campo PLACEHOLDER Especial:**
- ⚠️ `task.progress` (porcentaje) - Backend NO tiene este campo
  - Backend tiene `task_progress[]` (historial de avances)
  - Pero NO calcula porcentaje de progreso

**Campos PLACEHOLDER de Comités:**
- ⚠️ `committee.color` - Backend NO tiene este campo para visualización

**TODO para Integración Completa:**
```typescript
// 1. Cargar tareas del evento:
const tasksResponse = await taskService.getTasks({ event_id: eventId })

// Nota: Backend NO filtra tareas por evento directamente
// Se debe obtener comités del evento y luego filtrar tareas por comité

// 2. Cargar comités del evento:
const committeesResponse = await committeeService.getCommittees({ event_id: eventId })

// 3. Cargar miembros (usuarios con rol seedbed_leader):
const membersResponse = await userService.getUsers({ 
  role: 'seedbed_leader', 
  institution_id: event.institution_id 
})
```

**TODO para el Backend:**
```typescript
// 1. Agregar campo de progreso calculado:
interface Task {
  // Campos existentes...
  progress_percentage?: number  // Calcular desde task_progress
}

// 2. Agregar campo de color/tema para comités:
interface Committee {
  // Campos existentes...
  color?: string,  // Para visualización en Kanban/Gantt
  theme?: string   // Alternativa: nombre de tema predefinido
}

// 3. Filtrar tareas por evento (indirectamente):
//    GET /api/tasks?event_id={eventId}
//    O agregar en respuesta del evento:
interface Event {
  // Campos existentes...
  tasks?: Task[]  // Opcional: incluir todas las tareas del evento
}
```

---

### ✅ Vista de Alertas (`/coordinator/eventos/$eventId/alerts`)

**Estado de Integración:** ✅ **COMPLETAMENTE INTEGRADO**

**Componente:** `AlertList` (ya implementado)

**Datos REALES del Backend:**
- ✅ Todas las alertas se cargan desde `taskService.getAlerts()`
- ✅ Todos los campos son reales del backend
- ✅ Funciones de marcar como leída funcionan correctamente

**Sin Placeholders:** ✨ Esta vista está completamente funcional con datos reales.

---

## 📝 Resumen de Campos PLACEHOLDER por Entidad

### Eventos
| Campo | Existe en Backend | Alternativa |
|-------|------------------|-------------|
| `progress` | ❌ | Calcular: (completed_tasks / total_tasks) * 100 |
| `active_committees` | ❌ | Contar comités con tareas activas |
| `active_participants` | ❌ | Contar usuarios con tareas asignadas |
| `total_tasks` | ❌ | Agregar en estadísticas del evento |
| `completed_tasks` | ❌ | Agregar en estadísticas del evento |
| `open_incidents` | ❌ | Agregar en estadísticas del evento |
| `my_tasks` | ❌ | Filtrar tareas por usuario actual |

### Comités
| Campo | Existe en Backend | Alternativa |
|-------|------------------|-------------|
| `color` | ❌ | Agregar campo para visualización |
| `totalTasks` | ❌ | Endpoint de estadísticas: GET /api/committees/{id}/statistics |
| `completedTasks` | ❌ | Endpoint de estadísticas |
| `progress` | ❌ | Calcular: (completedTasks / totalTasks) * 100 |

### Tareas
| Campo | Existe en Backend | Alternativa |
|-------|------------------|-------------|
| `progress` (porcentaje) | ❌ | Calcular desde task_progress[] |

### Incidencias
| Campo | Existe en Backend | Alternativa |
|-------|------------------|-------------|
| `title` | ❌ | Extraer de description |
| `priority` | ❌ | Sistema nuevo: low, medium, high, critical |
| `category` | ❌ | Sistema nuevo: technical, logistics, security, etc. |
| `assignedTo` | ❌ | Usuario asignado para resolver |
| `comments[]` | ❌ | Sistema de comentarios nuevo |

### Actividades
| Campo | Existe en Backend | Alternativa |
|-------|------------------|-------------|
| `recentActivities[]` | ❌ | Endpoint nuevo: GET /api/events/{id}/activities |

---

## 🚀 Plan de Acción

### Prioridad Alta (Funcionalidades Críticas)
1. ✅ **Tareas por Comité** - YA IMPLEMENTADO
2. ✅ **Alertas** - YA IMPLEMENTADO
3. ⚠️ **Estadísticas de Eventos** - PENDIENTE
4. ⚠️ **Incidencias por Evento** - PARCIALMENTE (falta filtro por evento)

### Prioridad Media (Mejoras de UX)
1. ⚠️ **Estadísticas de Comités**
2. ⚠️ **Porcentaje de Progreso de Tareas**
3. ⚠️ **Monitoreo con Datos Reales**

### Prioridad Baja (Funcionalidades Opcionales)
1. ⚠️ **Sistema de Prioridades en Incidencias**
2. ⚠️ **Sistema de Categorías en Incidencias**
3. ⚠️ **Sistema de Comentarios en Incidencias**
4. ⚠️ **Actividad Reciente del Evento**
5. ⚠️ **Colores/Temas para Comités**

---

## 💡 Notas para Desarrolladores Frontend

### Identificación de Placeholders en el Código
Todos los placeholders están marcados con comentarios:
```typescript
// PLACEHOLDER: [descripción del campo]
// TODO: [acción requerida]
```

### Búsqueda Rápida
Para encontrar todos los placeholders en el código:
```bash
# Buscar comentarios PLACEHOLDER
grep -r "PLACEHOLDER" Frontend/src/routes/_authenticated/coordinator/

# Buscar comentarios TODO relacionados
grep -r "TODO: Backend" Frontend/src/
```

### Adaptación de Datos del Backend
Cuando se cargan datos del backend con campos faltantes:
```typescript
const adaptedData = backendData.map(item => ({
  ...item,
  // PLACEHOLDER: Agregar campos que no existen en backend
  placeholderField: defaultValue
}))
```

---

## 📚 Referencias

- **Documentación de API**: `API-DOCUMENTATION-FRONTEND.md`
- **Contexto del Sistema**: `NexusEsi.md`
- **Implementación Backend**: `ImplementacionNexusEsi.md`

---

**Última Actualización:** Octubre 27, 2025  
**Estado del Proyecto:** Las vistas del coordinador están funcionales con datos reales donde el backend lo soporta, y con placeholders claramente documentados para futuras implementaciones.

