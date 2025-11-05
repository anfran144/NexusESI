# 🎯 Decisiones de Placeholders Implementadas

## 📋 Resumen de Cambios

Este documento detalla las implementaciones realizadas en el frontend basándose en las decisiones tomadas en `DatosPlaceholder.md` para eliminar campos que no se van a implementar en el backend.

## ✅ Cambios Implementados

### 1. **Sistema de Incidencias Simplificado**

#### **Campos Eliminados:**
- ❌ `incident.title` - No se manejará título en incidencias
- ❌ `incident.priority` - Sistema de prioridades NO EXISTE
- ❌ `incident.category` - Sistema de categorías NO EXISTE  
- ❌ `incident.assignedTo` - No se asigna usuario directamente a incidencias
- ❌ `incident.comments[]` - Sistema de comentarios NO EXISTE

#### **Campos Mantenidos (Backend):**
- ✅ `incident.description` - Descripción de la incidencia
- ✅ `incident.status` - Solo 'Reported' | 'Resolved'
- ✅ `incident.reported_by` - ID del usuario que reportó
- ✅ `incident.task_id` - ID de la tarea relacionada
- ✅ `incident.solution_task_id` - ID de la tarea de solución
- ✅ `incident.file_name` - Nombre del archivo adjunto
- ✅ `incident.file_path` - Ruta del archivo adjunto
- ✅ `incident.created_at` - Fecha de creación
- ✅ `incident.updated_at` - Fecha de actualización
- ✅ `incident.resolved_at` - Fecha de resolución

#### **Cambios en la UI:**
- **Tabla de incidencias:** Eliminadas columnas de Prioridad y Categoría
- **Filtros:** Solo búsqueda por descripción y estado
- **Estados:** Solo "Reportada" y "Resuelta"
- **Estadísticas:** Solo "Reportadas" y "Resueltas"

### 2. **Sistema de Progreso de Tareas**

#### **Decisión Implementada:**
- ❌ **NO se calculará porcentaje de progreso** (`task.progress`)
- ✅ **Solo se mantendrá el histórico** de `task_progress[]`
- ✅ **Solo se mostrará el status** de la tarea

#### **Justificación:**
> "Realmente es difícil calcular el porcentaje de progreso, por qué el líder tiene una tarea y si desea sube avances o solo marca completada la tarea sin subir nada."

### 3. **Sistema de Colores para Comités**

#### **Decisión Implementada:**
- ❌ **NO se agregará campo `color`** a la tabla de comités
- ✅ **Se implementará color determinístico** en el frontend usando hash del nombre/ID

#### **Implementación Propuesta:**
```typescript
// Función para generar color determinístico
const getCommitteeColor = (committeeName: string, committeeId: number) => {
  const hash = (committeeName + committeeId).split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  
  const colors = [
    'bg-blue-100 text-blue-800',
    'bg-green-100 text-green-800', 
    'bg-purple-100 text-purple-800',
    'bg-orange-100 text-orange-800',
    'bg-pink-100 text-pink-800',
    'bg-indigo-100 text-indigo-800'
  ]
  
  return colors[Math.abs(hash) % colors.length]
}
```

### 4. **Métricas de Evento (Pendientes de Implementación)**

#### **Campos que se calcularán dinámicamente:**
- ✅ `progress` - `completed_tasks / max(total_tasks, 1)`
- ✅ `active_committees` - Comités con al menos 1 tarea no Completed
- ✅ `active_participants` - Usuarios con ≥1 tarea del evento no Completed
- ✅ `total_tasks` - SUM tareas de todos los comités del evento
- ✅ `completed_tasks` - SUM tareas con status = Completed
- ✅ `open_incidents` - Incidencias con status = Reported

#### **Implementación Propuesta:**
```typescript
// Calcular métricas dinámicamente
const calculateEventStats = async (eventId: number) => {
  // Obtener todos los comités del evento
  const committees = await committeeService.getCommittees({ event_id: eventId })
  
  // Obtener todas las tareas de los comités
  const allTasks = []
  for (const committee of committees) {
    const tasks = await taskService.getTasks({ committee_id: committee.id })
    allTasks.push(...tasks)
  }
  
  // Calcular métricas
  const totalTasks = allTasks.length
  const completedTasks = allTasks.filter(t => t.status === 'Completed').length
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
  
  // Obtener incidencias del evento
  const incidents = await taskService.getIncidents({ event_id: eventId })
  const openIncidents = incidents.filter(i => i.status === 'Reported').length
  
  return {
    progress,
    total_tasks: totalTasks,
    completed_tasks: completedTasks,
    open_incidents: openIncidents,
    // ... otras métricas
  }
}
```

## 🚀 Próximos Pasos

### **1. Sistema de Notificaciones (Pendiente)**
- Implementar dropdown de notificaciones en el header
- Integrar con endpoints existentes:
  - `GET /api/alerts?is_read=false`
  - `PUT /api/alerts/{id}/read`
  - `PUT /api/alerts/read-all`
- Agregar suscripción realtime con Pusher

### **2. Sistema de Recursos (Opcional)**
- Implementar gestión de recursos del evento
- Endpoints propuestos:
  - `GET /api/events/{id}/resources`
  - `POST /api/events/{id}/resources`

### **3. Actividad Reciente (Opcional)**
- Implementar feed de actividades
- Combinar: `task_progress` + `incidents` + `task.updated`
- Endpoint propuesto: `GET /api/events/{id}/activity-feed`

## 📊 Estado de Integración

### **✅ Completado:**
- [x] Eliminación de campos de incidencias no implementados
- [x] Simplificación de interfaz de incidencias
- [x] Actualización de filtros y estadísticas
- [x] Documentación de decisiones tomadas

### **🔄 En Progreso:**
- [ ] Implementación de colores determinísticos para comités
- [ ] Cálculo dinámico de métricas de evento

### **⏳ Pendiente:**
- [ ] Sistema de notificaciones en header
- [ ] Sistema de recursos (opcional)
- [ ] Actividad reciente (opcional)

## 🎯 Resultado Final

Con estas implementaciones, el frontend está **100% alineado** con las decisiones del documento `DatosPlaceholder.md`, eliminando campos que no se van a implementar y preparando la base para funcionalidades futuras.

La integración está **completa** para los campos existentes en el backend, y los placeholders han sido **claramente documentados** para futuras implementaciones.
