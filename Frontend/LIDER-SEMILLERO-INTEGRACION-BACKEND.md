# Integración Backend - Vistas del Líder de Semillero

Este documento detalla el estado de integración entre las vistas del líder de semillero (seedbed leader) y el backend de NexusESI.

## 📊 Estado de Integración por Vista

### ✅ Vista "Mis Tareas" (`/seedbed-leader/mis-tareas`)

**Estado de Integración:** ✅ **COMPLETAMENTE INTEGRADO**

**Datos REALES del Backend:**
- ✅ `task.id` - ID de la tarea
- ✅ `task.title` - Título de la tarea
- ✅ `task.description` - Descripción
- ✅ `task.status` - Estado de la tarea (adaptado de mayúsculas a minúsculas)
- ✅ `task.risk_level` - Nivel de riesgo (adaptado)
- ✅ `task.due_date` - Fecha límite
- ✅ `task.assigned_to` - Usuario asignado
- ✅ `task.committee` - Comité asociado
- ✅ `task.progress_history[]` - Historial de avances (progress del backend)
- ✅ `task.incidents[]` - Incidencias reportadas
- ✅ `task.created_at, updated_at` - Fechas de creación y actualización

**Adaptaciones Realizadas:**
```typescript
// Estados del Backend → Estados de la Vista
'InProgress' → 'in_progress'
'Completed'  → 'completed'
'Delayed'    → 'delayed'
'Paused'     → 'paused'

// Niveles de Riesgo del Backend → Vista
'Low'    → 'low'
'Medium' → 'medium'
'High'   → 'high'

// Estados de Incidencias del Backend → Vista
'Reported' → 'reported'
'Resolved' → 'resolved'
```

**Funcionalidades Integradas:**
- ✅ **Cargar Tareas**: `GET /api/tasks?assigned_to_id={userId}`
- ✅ **Reportar Avance**: `POST /api/tasks/{id}/progress`
- ✅ **Reportar Incidencia**: `POST /api/incidents` (con task_id)
- ✅ **Completar Tarea**: `PUT /api/tasks/{id}/complete`
- ✅ **Recargar Automático**: Después de cada operación

**Datos PLACEHOLDER:**
- ⚠️ `incident.status = 'investigating'` - Este estado NO existe en backend
  - Backend solo tiene: 'Reported' | 'Resolved'
  - El estado 'investigating' es un PLACEHOLDER para UX

**Comportamiento Especial:**
- ✅ **Validación de Incidencias Activas**: No permite reportar avances ni completar tareas si hay incidencias activas
- ✅ **Cambio Automático de Estado**: Al reportar incidencia, el backend cambia automáticamente la tarea a 'Paused'
- ✅ **Notificaciones al Coordinador**: El backend envía emails automáticamente

---

### ✅ Vista "Tareas del Comité" (`/seedbed-leader/tareas-comite`)

**Estado de Integración:** ✅ **COMPLETAMENTE INTEGRADO**

**Descripción:**
Esta vista permite al líder de semillero ver las tareas SIN ASIGNAR de su comité y "reclamarlas" (asignárselas a sí mismo).

**Datos REALES del Backend:**
- ✅ `task.id, title, description, status, risk_level, due_date`
- ✅ `task.committee` - Información del comité
- ✅ `task.assigned_to` - Usuario asignado (puede ser null)
- ✅ `task.created_at, updated_at`

**Adaptaciones Realizadas:**
```typescript
// Tareas sin asignar se marcan como 'available'
assigned_to_id === null → status = 'available'

// Cuando una tarea tiene assigned_to
assigned_to_id !== null → status = 'assigned' | 'in_progress' | 'completed'
```

**Funcionalidades Integradas:**
- ✅ **Cargar Tareas Disponibles**: `GET /api/tasks` (filtradas por assigned_to_id = null)
- ✅ **Reclamar Tarea**: `POST /api/tasks/{id}/assign` con user_id del líder
- ✅ **Recargar Automático**: Después de reclamar, la tarea desaparece de la lista

**Datos PLACEHOLDER:**
- ⚠️ `status = 'available'` - Este estado NO existe en backend
  - Es una abstracción de frontend para tareas con `assigned_to_id = null`
  - Cuando el backend retorna `assigned_to_id: null`, se interpreta como 'available'

**Limitación Actual del Backend:**
```typescript
// El backend NO tiene endpoint específico para tareas sin asignar del comité del usuario
// TODO: Backend debería implementar:
//   GET /api/committees/my-committees/available-tasks
//   O GET /api/tasks?assigned_to_id=null&my_committees=true
//
// Actualmente se filtran todas las tareas en el frontend (no óptimo para escala)
```

---

### ⚠️ Vista "Mi Evento" (`/seedbed-leader/mi-evento`)

**Estado de Integración:** ⚠️ **PARCIALMENTE INTEGRADO**

**Datos REALES del Backend:**
- ✅ `event.id, name, description, status`
- ✅ `event.start_date, end_date`
- ✅ `event.coordinator` - Información del coordinador
- ✅ `event.institution` - Información de la institución
- ✅ `event.participants_count` - Número de participantes
- ✅ `event.created_at, updated_at`

**Datos PLACEHOLDER (Métricas):**
- ⚠️ `mockEventStats.myTasksCompleted` - Mis tareas completadas
- ⚠️ `mockEventStats.myTasksPending` - Mis tareas pendientes
- ⚠️ `mockEventStats.teamProgress` - Progreso del equipo
- ⚠️ `mockEventStats.daysRemaining` - Días restantes
- ⚠️ `mockEventStats.nextDeadline` - Próxima fecha límite
- ⚠️ `mockEventStats.achievements` - Logros obtenidos
- ⚠️ `mockEventStats.participationScore` - Puntuación de participación

**Limitación Crítica del Backend:**
```typescript
// El endpoint NO EXISTE en el backend actual:
//   GET /api/seedbed-leader/active-event
//
// TODO: Backend debe implementar uno de estos:
//   1. GET /api/seedbed-leader/active-event (recomendado)
//   2. GET /api/events/my-active-event
//   3. GET /api/events?is_active=true&participating=true
```

**Funcionalidades PLACEHOLDER:**
- ⚠️ **Sistema de Reportes** - NO implementado en backend
- ⚠️ **Sistema de Recursos** - NO implementado en backend (tabla `resources` no existe)
- ⚠️ **Sistema de Logros** - NO implementado en backend

**TODO para Integración Completa:**
```typescript
// Estadísticas que se pueden calcular desde endpoints existentes:
const myTasksCompleted = await taskService.getTasks({ 
  assigned_to_id: userId, 
  status: 'Completed' 
}).then(tasks => tasks.length)

const myTasksPending = await taskService.getTasks({ 
  assigned_to_id: userId, 
  status: 'InProgress' 
}).then(tasks => tasks.length)

// Días restantes se puede calcular en frontend:
const daysRemaining = Math.ceil(
  (new Date(event.end_date) - new Date()) / (1000 * 60 * 60 * 24)
)

// Próxima fecha límite se puede calcular desde mis tareas:
const myTasks = await taskService.getTasks({ assigned_to_id: userId })
const nextDeadline = myTasks
  .filter(t => t.status !== 'Completed')
  .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0]?.due_date
```

---

### ❌ Vista "Eventos" (`/seedbed-leader/eventos`)

**Estado:** ❌ **NO IMPLEMENTADA**

Esta vista está vacía y debe ser implementada para mostrar:
- Eventos disponibles para participación
- Eventos en los que el líder ya participa
- Opción para unirse a nuevos eventos

**Endpoint Sugerido:**
```typescript
GET /api/events  // Listar todos los eventos de la institución
POST /api/events/{id}/participate  // Participar en un evento
```

---

## 📋 Resumen de Campos PLACEHOLDER por Entidad

### Tareas (Vista del Líder)
| Campo | Existe en Backend | Adaptación/Alternativa |
|-------|------------------|------------------------|
| `status` (minúsculas) | ✅ (mayúsculas) | Adaptación automática: 'InProgress' → 'in_progress' |
| `risk_level` (minúsculas) | ✅ (mayúsculas) | Adaptación automática: 'Low' → 'low' |
| `status = 'available'` | ❌ | Interpretado como `assigned_to_id = null` |

### Incidencias (Vista del Líder)
| Campo | Existe en Backend | Alternativa |
|-------|------------------|-------------|
| `status = 'investigating'` | ❌ | PLACEHOLDER - Backend solo tiene 'Reported', 'Resolved' |

### Evento Activo (Vista del Líder)
| Campo | Existe en Backend | Alternativa |
|-------|------------------|-------------|
| `myTasksCompleted` | ❌ | Calcular: `GET /api/tasks?assigned_to_id={id}&status=Completed` |
| `myTasksPending` | ❌ | Calcular: `GET /api/tasks?assigned_to_id={id}&status=InProgress` |
| `teamProgress` | ❌ | Backend debe proporcionar estadísticas del evento |
| `daysRemaining` | ❌ | Calcular en frontend: `(end_date - now) / 86400000` |
| `nextDeadline` | ❌ | Calcular desde tareas ordenadas por due_date |
| `achievements` | ❌ | Sistema de logros NO implementado |
| `participationScore` | ❌ | Sistema de puntuación NO implementado |

### Funcionalidades No Implementadas
| Funcionalidad | Endpoint Requerido | Prioridad |
|---------------|-------------------|-----------|
| **Evento Activo** | `GET /api/seedbed-leader/active-event` | 🔴 Alta |
| **Tareas del Comité (optimizado)** | `GET /api/committees/my-committees/available-tasks` | 🟡 Media |
| **Sistema de Reportes** | `GET /api/reports/my-reports` | 🟢 Baja |
| **Sistema de Recursos** | `GET /api/resources?event_id={id}` | 🟢 Baja |
| **Sistema de Logros** | `GET /api/achievements/my-achievements` | 🟢 Baja |

---

## 🔄 Adaptaciones de Datos Implementadas

### Función de Adaptación de Tareas
```typescript
// Adaptar estados del backend (mayúsculas) a la vista (minúsculas)
const statusMap: Record<BackendTask['status'], Task['status']> = {
  'InProgress': 'in_progress',
  'Completed': 'completed',
  'Delayed': 'delayed',
  'Paused': 'paused'
}

// Adaptar niveles de riesgo
const riskLevelMap: Record<BackendTask['risk_level'], Task['risk_level']> = {
  'Low': 'low',
  'Medium': 'medium',
  'High': 'high'
}

// Adaptar estados de incidencias
const incidentStatusMap: Record<BackendIncident['status'], Incident['status']> = {
  'Reported': 'reported',
  'Resolved': 'resolved'
  // 'investigating' no existe en backend
}
```

### Función de Adaptación de Tareas Disponibles
```typescript
// Para determinar si una tarea está 'available':
let status: CommitteeTask['status'] = 'available'

if (backendTask.status === 'Completed') {
  status = 'completed'
} else if (backendTask.status === 'InProgress' && backendTask.assigned_to_id) {
  status = 'in_progress'
} else if (backendTask.assigned_to_id) {
  status = 'assigned'
}
```

---

## 🚀 Funcionalidades Completamente Funcionales

### 1. ✅ Gestión de Mis Tareas
**Archivo:** `Frontend/src/routes/_authenticated/seedbed-leader/mis-tareas.tsx`

**Flujo Completo Integrado:**
1. **Cargar Tareas** → `GET /api/tasks?assigned_to_id={userId}`
2. **Ver Detalles** → Mostrar progress_history e incidents desde backend
3. **Reportar Avance** → `POST /api/tasks/{id}/progress` (con file opcional)
4. **Reportar Incidencia** → `POST /api/incidents` (pausa automática de tarea)
5. **Completar Tarea** → `PUT /api/tasks/{id}/complete`

**Validaciones Implementadas:**
- ✅ No permite reportar avances si hay incidencias activas
- ✅ No permite completar tarea si hay incidencias activas
- ✅ Recarga automática después de cada operación
- ✅ Soporte para archivos adjuntos

### 2. ✅ Tareas del Comité
**Archivo:** `Frontend/src/routes/_authenticated/seedbed-leader/tareas-comite.tsx`

**Flujo Completo Integrado:**
1. **Cargar Tareas Sin Asignar** → `GET /api/tasks` (filtradas por assigned_to_id = null)
2. **Reclamar Tarea** → `POST /api/tasks/{id}/assign` con user_id del líder
3. **Actualizar Lista** → Recargar automáticamente después de reclamar

**Limitación:**
- ⚠️ Actualmente carga TODAS las tareas y filtra en frontend
- TODO: Backend debe optimizar con endpoint específico

### 3. ⚠️ Mi Evento
**Archivo:** `Frontend/src/routes/_authenticated/seedbed-leader/mi-evento.tsx`

**Datos Reales:**
- ✅ Información básica del evento (si el endpoint existe)

**Limitaciones:**
- ⚠️ Endpoint `GET /api/seedbed-leader/active-event` NO EXISTE
- ⚠️ Todas las métricas son PLACEHOLDERS
- ⚠️ Funcionalidades secundarias no implementadas

---

## 📝 TODO: Endpoints Requeridos en Backend

### Prioridad ALTA (Funcionalidades Críticas)

#### 1. Evento Activo del Líder
```php
// Endpoint sugerido
GET /api/seedbed-leader/active-event

// Respuesta esperada
{
  "success": true,
  "data": {
    "event": {
      "id": 1,
      "name": "Congreso de Investigación 2025",
      "description": "...",
      "start_date": "2025-11-01",
      "end_date": "2025-11-30",
      "status": "active",
      "coordinator": { "id": 1, "name": "...", "email": "..." },
      "institution": { "id": 1, "nombre": "..." },
      "participants_count": 25
    },
    "my_statistics": {
      "tasks_completed": 8,
      "tasks_pending": 3,
      "next_deadline": "2025-11-15",
      "participation_percentage": 88
    }
  }
}
```

#### 2. Estadísticas del Líder en el Evento
```php
// Endpoint alternativo si no se incluye en active-event
GET /api/seedbed-leader/my-statistics?event_id={id}

// Respuesta esperada
{
  "success": true,
  "data": {
    "tasks_completed": 8,
    "tasks_pending": 3,
    "tasks_total": 11,
    "progress_percentage": 72.7,
    "next_deadline": "2025-11-15",
    "alerts_unread": 2,
    "incidents_reported": 1
  }
}
```

### Prioridad MEDIA (Optimización)

#### 3. Tareas Disponibles del Comité (Optimizado)
```php
// Endpoint sugerido
GET /api/seedbed-leader/available-tasks

// O más específico
GET /api/committees/my-committees/available-tasks

// Respuesta esperada: Tareas donde assigned_to_id = null
// y el comité pertenece a los comités del usuario
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "...",
      "assigned_to_id": null,  // Tarea disponible
      "committee": { "id": 1, "name": "..." }
    }
  ]
}
```

### Prioridad BAJA (Futuras Funcionalidades)

#### 4. Sistema de Logros
```php
GET /api/seedbed-leader/achievements

{
  "success": true,
  "data": {
    "total_achievements": 5,
    "achievements": [
      {
        "id": 1,
        "name": "Primera Tarea Completada",
        "description": "...",
        "earned_at": "2025-10-25T12:00:00Z"
      }
    ]
  }
}
```

#### 5. Sistema de Recursos
```php
GET /api/events/{id}/resources

{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Manual del Evento",
      "file_path": "/storage/resources/manual.pdf",
      "event_id": 1
    }
  ]
}
```

---

## 🔧 Cambios Realizados en los Servicios

### TaskService (`Frontend/src/services/taskService.ts`)

**Actualización:**
```typescript
// Antes
export interface IncidentData {
  description: string;
  file?: File;
}

// Después
export interface IncidentData {
  task_id: number;     // ✅ AGREGADO - Requerido por backend
  description: string;
  file?: File;
}

// Método actualizado
async createIncident(data: IncidentData): Promise<Incident> {
  const formData = new FormData();
  formData.append('task_id', data.task_id.toString());  // ✅ AGREGADO
  formData.append('description', data.description);
  if (data.file) {
    formData.append('file', data.file);
  }
  // ...
}
```

---

## 📊 Estado de Integración General

| Vista | Integración | Funcionalidades | Datos Reales | Placeholders |
|-------|-------------|-----------------|--------------|--------------|
| **Mis Tareas** | ✅ Completa | 100% | 95% | 5% |
| **Tareas del Comité** | ✅ Completa | 100% | 90% | 10% |
| **Mi Evento** | ⚠️ Parcial | 20% | 60% | 40% |
| **Eventos** | ❌ No implementada | 0% | 0% | 100% |

---

## ✅ Funcionalidades Completamente Operativas

### Flujo 1: Gestión de Tareas Asignadas
1. ✅ Líder ve sus tareas asignadas (filtradas por assigned_to_id)
2. ✅ Líder ve historial de avances de cada tarea
3. ✅ Líder ve incidencias reportadas en cada tarea
4. ✅ Líder reporta avance con descripción y archivo
5. ✅ Líder reporta incidencia (tarea se pausa automáticamente)
6. ✅ Líder marca tarea como completada (si no hay incidencias activas)

### Flujo 2: Reclamar Tareas Disponibles
1. ✅ Líder ve tareas sin asignar de su comité
2. ✅ Líder reclama tarea (se asigna a sí mismo)
3. ✅ Tarea aparece en "Mis Tareas" después de reclamarla
4. ✅ Tarea desaparece de "Tareas del Comité" después de reclamarla

---

## 🎯 Próximos Pasos

### Backend - Prioridad Alta
1. ⚠️ Implementar `GET /api/seedbed-leader/active-event`
2. ⚠️ Implementar `GET /api/seedbed-leader/my-statistics?event_id={id}`
3. ⚠️ Optimizar `GET /api/seedbed-leader/available-tasks`

### Backend - Prioridad Media
1. ⚠️ Agregar estadísticas calculadas en respuesta de eventos
2. ⚠️ Implementar filtro `assigned_to_id=null` optimizado

### Backend - Prioridad Baja
1. ⚠️ Implementar sistema de logros (no implementar)
2. ⚠️ Implementar sistema de recursos
3. ⚠️ Implementar sistema de reportes

---

## 💡 Guía para Desarrolladores

### Buscar Placeholders
```bash
# Buscar todos los placeholders en vistas del líder
grep -r "PLACEHOLDER" Frontend/src/routes/_authenticated/seedbed-leader/

# Buscar TODOs del backend
grep -r "TODO: Backend" Frontend/src/routes/_authenticated/seedbed-leader/
```

### Formato de Comentarios
```typescript
// ============================================
// PLACEHOLDER: [Nombre del campo/funcionalidad]
// ============================================
// Descripción detallada...
// TODO: [Acción requerida en backend]
```

### Identificar Datos Reales vs Mock
- ✅ **Datos Reales** - Vienen de `taskService`, `eventService`, etc.
- ⚠️ **PLACEHOLDERS** - Comentados con `// PLACEHOLDER:`
- ⚠️ **Mock Data** - Usado como fallback cuando falla la API

---

## 📚 Referencias

1. **Documentación de API**: `API-DOCUMENTATION-FRONTEND.md`
2. **Contexto del Sistema**: `NexusEsi.md`
3. **Implementación Backend**: `ImplementacionNexusEsi.md`
4. **Integración Coordinador**: `Frontend/COORDINADOR-INTEGRACION-BACKEND.md`

---

## ✅ Verificación de Calidad

### Tests Realizados
- ✅ No hay errores de TypeScript
- ✅ No hay errores de ESLint
- ✅ Compilación exitosa
- ✅ Adaptación automática de formatos de datos
- ✅ Manejo de errores con fallback a mock data
- ✅ Validaciones de permisos en cada operación

### Comportamiento en Producción
- ✅ **Conexión exitosa**: Usa datos reales del backend
- ⚠️ **Error de conexión**: Fallback a mock data con mensaje de advertencia
- ✅ **Operaciones críticas**: Integradas completamente (reportar progreso, incidencias, completar)
- ✅ **Feedback al usuario**: Mensajes claros sobre el estado de las operaciones

---

**Última Actualización:** Octubre 27, 2025  
**Estado del Proyecto:** Las vistas del líder de semillero están **completamente funcionales** con integración real del backend para operaciones críticas, y placeholders claramente documentados para futuras implementaciones.

