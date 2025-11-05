# 🚀 Guía Rápida de Integración - NexusESI

## 📍 Navegación Rápida

### Buscar en el Código

```bash
# Encontrar todos los placeholders
grep -r "PLACEHOLDER" Frontend/src/routes/

# Encontrar TODOs del backend
grep -r "TODO: Backend" Frontend/src/

# Encontrar mock data
grep -r "mockEventStats\|mockTasks\|mockIncidents" Frontend/src/

# Encontrar adaptaciones de formato
grep -r "statusMap\|riskLevelMap" Frontend/src/
```

---

## 🎯 Estado por Vista - Vista Rápida

| Vista | Ruta | Integración | Acción |
|-------|------|-------------|---------|
| 🟢 Banco de Tareas | `/coordinator/eventos/{id}/tasks` | 100% | ✅ Usar |
| 🟢 Alertas | `/coordinator/eventos/{id}/alerts` | 100% | ✅ Usar |
| 🟢 Mis Tareas (Líder) | `/seedbed-leader/mis-tareas` | 100% | ✅ Usar |
| 🟢 Tareas Comité (Líder) | `/seedbed-leader/tareas-comite` | 100% | ✅ Usar |
| 🟡 Vista Principal Evento | `/coordinator/eventos/{id}` | 75% | ⚠️ Ver placeholders |
| 🟡 Comités | `/coordinator/eventos/{id}/comites` | 80% | ⚠️ Ver placeholders |
| 🟡 Incidencias | `/coordinator/eventos/{id}/incidencias` | 60% | ⚠️ Ver placeholders |
| 🟡 Mi Evento (Líder) | `/seedbed-leader/mi-evento` | 20% | ⚠️ Endpoint faltante |
| 🔴 Monitoreo | `/coordinator/eventos/{id}/monitoreo` | 20% | ❌ Mock data |
| 🔴 Eventos (Líder) | `/seedbed-leader/eventos` | 0% | ❌ No implementada |

**Leyenda:**
- 🟢 = Completamente funcional
- 🟡 = Funcional con placeholders
- 🔴 = Requiere trabajo adicional

---

## 🔧 Servicios y Endpoints

### ✅ Servicios Listos para Usar

```typescript
// ✅ TaskService - COMPLETAMENTE FUNCIONAL
import { taskService } from '@/services/taskService'

await taskService.getTasks({ assigned_to_id: userId })
await taskService.getTask(taskId)
await taskService.createTask(data)
await taskService.updateTask(taskId, data)
await taskService.assignTask(taskId, userId)
await taskService.completeTask(taskId)
await taskService.reportProgress(taskId, { description, file })
await taskService.createIncident({ task_id, description, file })
await taskService.getIncidents({ task_id })
await taskService.resolveIncident(incidentId, solutionTaskId)
await taskService.getAlerts({ type, is_read })
await taskService.markAlertAsRead(alertId)
await taskService.getAlertStatistics()
```

```typescript
// ✅ CommitteeService - FUNCIONAL
import { committeeService } from '@/services/committee.service'

await committeeService.getCommittees({ event_id })
await committeeService.getCommittee(committeeId)
await committeeService.createCommittee({ name, event_id })
await committeeService.updateCommittee(committeeId, data)
await committeeService.deleteCommittee(committeeId)
await committeeService.assignMember(committeeId, { user_id })
await committeeService.removeMember(committeeId, userId)
```

```typescript
// ✅ EventService - FUNCIONAL
import { eventService } from '@/services/event.service'

await eventService.getEvents({ status, institution_id })
await eventService.getEvent(eventId)
await eventService.createEvent(data)
await eventService.updateEvent(eventId, data)
await eventService.deleteEvent(eventId)
```

---

## 🎨 Componentes Reutilizables

### Componentes Integrados con Backend

```typescript
// ✅ TaskBankManager
<TaskBankManager eventId={eventId} />
// Carga tareas reales desde backend

// ✅ CommitteesManager  
<CommitteesManager eventId={eventId} />
// Carga comités reales desde backend

// ✅ AlertList
<AlertList eventId={eventId} showFilters={true} />
// Carga alertas reales desde backend
```

### Componentes con Placeholders

```typescript
// ⚠️ Vista Principal Evento
// Usa mockEventStats para estadísticas
// Ver: eventos/$eventId/index.tsx líneas 193-220

// ⚠️ Vista de Incidencias
// Usa mock data para priority, category, comments
// Ver: eventos/$eventId/incidencias.tsx líneas 58-115

// ⚠️ Vista Mi Evento (Líder)
// Usa mockEventStats para todas las métricas
// Ver: seedbed-leader/mi-evento.tsx líneas 43-73
```

---

## 📋 Adaptaciones de Datos

### Estados de Tareas
```typescript
// Backend → Frontend (automático)
const statusMap = {
  'InProgress': 'in_progress',
  'Completed': 'completed',
  'Delayed': 'delayed',
  'Paused': 'paused'
}

// Uso
status: statusMap[backendTask.status]
```

### Niveles de Riesgo
```typescript
// Backend → Frontend (automático)
const riskLevelMap = {
  'Low': 'low',
  'Medium': 'medium',
  'High': 'high'
}

// Uso
risk_level: riskLevelMap[backendTask.risk_level]
```

### Estado Virtual 'Available'
```typescript
// Interpretar en frontend
assigned_to_id === null → status = 'available'
assigned_to_id !== null → status = 'assigned' | ...
```

---

## 🔍 Buscar Información Específica

### ¿Qué campos son placeholders?
```bash
# Ver tablas consolidadas
cat Frontend/INTEGRACION-COMPLETA-NEXUSESI.md | grep "PLACEHOLDER"
```

### ¿Qué endpoints faltan en el backend?
```bash
# Ver lista completa
cat Frontend/INTEGRACION-COMPLETA-NEXUSESI.md | grep -A 5 "Endpoints Requeridos"
```

### ¿Cómo integrar una vista específica?
```bash
# Coordinador
cat Frontend/COORDINADOR-INTEGRACION-BACKEND.md

# Líder
cat Frontend/LIDER-SEMILLERO-INTEGRACION-BACKEND.md
```

### ¿Cuál es el estado general del proyecto?
```bash
# Resumen ejecutivo
cat Frontend/INTEGRACION-FINAL-RESUMEN.md
```

---

## ⚡ Acciones Rápidas

### Verificar Compilación
```bash
cd Frontend
npm run build
```

### Ejecutar en Desarrollo
```bash
cd Frontend
npm run dev
```

### Ver Linting
```bash
cd Frontend
npm run lint
```

### Buscar Errores TypeScript
```bash
cd Frontend
npx tsc --noEmit
```

---

## 📊 Estadísticas Clave

### Integración
- **Vistas Totales**: 10
- **100% Integradas**: 4 (40%)
- **Parcialmente Integradas**: 4 (40%)
- **Pendientes**: 2 (20%)

### Funcionalidades
- **Operaciones Críticas**: 100% ✅
- **Estadísticas**: 40% ⚠️
- **Funcionalidades Avanzadas**: 20% ❌

### Código
- **Archivos Modificados**: 11
- **Documentos Creados**: 6
- **Placeholders Identificados**: 26+
- **TODOs para Backend**: 15+

---

## 🎯 Prioridades Recomendadas

### Esta Semana (Crítico)
1. ⚠️ Implementar `GET /api/seedbed-leader/active-event`
2. ⚠️ Implementar `GET /api/events/{id}/statistics`

### Próxima Semana (Importante)
3. ⚠️ Implementar `GET /api/committees/{id}/statistics`
4. ⚠️ Optimizar filtros de tareas

### Próximo Mes (Mejoras)
5. ⚠️ Calcular porcentaje de progreso
6. ⚠️ Sistema de prioridades en incidencias
7. ⚠️ Actividad reciente del evento

---

## 📚 Referencias

| Documento | Contenido | Cuándo Usar |
|-----------|-----------|-------------|
| `API-DOCUMENTATION-FRONTEND.md` | Referencia de API | Ver estructura de respuestas |
| `NexusEsi.md` | Lógica de negocio | Entender flujos del sistema |
| `ImplementacionNexusEsi.md` | Estado del backend | Verificar qué está implementado |
| `COORDINADOR-INTEGRACION-BACKEND.md` | Integración coordinador | Trabajar en vistas del coordinador |
| `LIDER-SEMILLERO-INTEGRACION-BACKEND.md` | Integración líder | Trabajar en vistas del líder |
| `INTEGRACION-COMPLETA-NEXUSESI.md` | Visión consolidada | Vista general del proyecto |
| `INTEGRACION-FINAL-RESUMEN.md` | Resumen ejecutivo | Presentaciones y reportes |
| `GUIA-RAPIDA-INTEGRACION.md` | Esta guía | Referencia rápida diaria |

---

## 💡 Tips Rápidos

### Agregar Nueva Vista
1. Usar servicios existentes (`taskService`, `eventService`, etc.)
2. Adaptar formatos con mapas (statusMap, riskLevelMap)
3. Implementar fallback a mock data
4. Documentar placeholders con formato estándar
5. Verificar compilación y linting

### Identificar si un Campo es Placeholder
```typescript
// Buscar comentario arriba del campo
// PLACEHOLDER: [descripción]

// O buscar en tablas de documentación
cat Frontend/*INTEGRACION*.md | grep "Campo.*Placeholder"
```

### Integrar Nuevo Endpoint
1. Actualizar `taskService` o servicio correspondiente
2. Actualizar interfaces TypeScript
3. Actualizar vista para usar datos reales
4. Quitar mock data
5. Actualizar documentación

---

## ✅ Checklist Diario

### Antes de Codificar
- [ ] Revisar documentación de API
- [ ] Identificar endpoints disponibles
- [ ] Verificar permisos requeridos
- [ ] Revisar placeholders existentes

### Durante el Desarrollo
- [ ] Usar servicios existentes
- [ ] Implementar adaptación de datos
- [ ] Agregar manejo de errores
- [ ] Documentar nuevos placeholders
- [ ] Probar en navegador

### Antes de Commit
- [ ] Verificar compilación (`npm run build`)
- [ ] Verificar linting (`npm run lint`)
- [ ] Actualizar documentación si es necesario
- [ ] Verificar que placeholders estén documentados

---

**🎯 Mantra del Proyecto:**  
> "Integrar donde el backend lo soporta, documentar donde no existe, funcionar siempre."

---

**Última Actualización:** Octubre 27, 2025  
**Mantenido por:** Equipo de Desarrollo NexusESI

