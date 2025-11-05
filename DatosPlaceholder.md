Datos PLACEHOLDER (evento)
mockEventStats.progress (progreso general)
Sí, requiere total de tareas del evento y cuántas completadas. Sin campo directo evento→tareas, úsalo vía comités:
total_tasks = SUM tareas de todos los comités del evento
completed_tasks = SUM tareas con status = Completed
progress = completed_tasks / max(total_tasks, 1)
mockEventStats.active_committees (comités activos)
No manejamos estado de comité. Definición práctica sin cambiar backend:
Activo = comité con al menos 1 tarea no Completed (InProgress, Delayed, Paused)
mockEventStats.active_participants (participantes activos)
Definición práctica:
Usuarios con ≥1 tarea del evento en estado no Completed
mockEventStats.total_tasks (total de tareas)
Sin campo directo evento_id en tareas. Propuesta sin migración:
total_tasks = SUM tareas asociadas a comités del evento (committee.event_id = id)
Incidencias (decisiones)
incident.title
No se usará. Eliminamos del frontend (queda description como única fuente).
incident.priority
No habrá prioridad explícita. Si en el futuro quieres una “discreta” derivada:
Derivada de la tarea: High si la tarea está Delayed o riesgo High, Medium si riesgo Medium, Low si riesgo Low. Pero por ahora: remover.
incident.category
No se usará. Remover del frontend.
incident.assignedTo
Correcto: no se asigna a la incidencia; se crea una solution_task y esa tarea sí tiene assigned_to. Mantener solo solution_task_id.
incident.comments[]
No implementar. Frontend no lo muestra.
Resolución de incidencias
Ya soportado con tus reglas: resolver vía PUT /api/incidents/{id}/resolve (opcional solution_task_id); la tarea original pasa Paused → InProgress/Delayed según fecha.
Campo PLACEHOLDER especial
task.progress (%)
No calcular. Mantener solo histórico de task_progress y el status. El frontend no mostrará barra porcentual; solo timeline/último avance.
Comités
committee.color
Alternativa sin tocar backend: color determinista en frontend por nombre/id (hash→paleta fija), p.ej. tailwind classes o HEX de una lista.
¿Es suficiente para integración 100%?
Sí, con estos ajustes:
Evento: calcular métricas en frontend usando comités→tareas (sin tocar BD).
Incidencias: remover title/priority/category/comments/assignedTo de UI.
Progreso de tarea: no mostrar %.
Colores de comité: hash en frontend.
Pendiente extra (notificaciones en header)
Qué falta: un dropdown/menú en el header con:
GET /api/alerts?is_read=false (y quizá type) para listar últimas N
Acción “marcar leída” PUT /api/alerts/{id}/read y “marcar todas” PUT /api/alerts/read-all
Suscripción realtime (ya tienes pusherService + useRealtimeNotifications en docs): al recibir alert.created refrescar la lista local
Integración mínima:
Icono campana con badge (num no leídas)
Modal/Sheet con lista (mensaje, tarea, fecha, botón “Marcar leída”, “Marcar todas”)
Hook simple:
loadAlerts: GET /alerts?is_read=false
markRead(id)
markAll()
onPusher('alert.created', refetch)
Aclaraciones finales rápidas
total_tasks sin evento_id en Task: se resuelve 100% via join Task→Committee→Event.
active_committees: no requiere estado agregado en BD, es conteo con tareas activas.
active_participants: usuarios con tareas no completadas en el evento (via join).
Resources (sí, según NexusEsi.md): si decides implementarlos:
GET /api/events/{id}/resources
POST /api/events/{id}/resources (multipart)
El frontend puede listarlos en “Mi Evento” y en el panel del coordinador (bloque simple).
Actividad reciente (sí): si no hay tabla, puedes simular con:
feed = últimos task_progress + incidencias + cambios de task.updated (limit 10). Se arma en backend con UNION y type.
Con esto puedes marcar como “integración completa” sin cambios de esquema:
Ajustes de frontend: eliminar campos de incidencia y % de progreso; calcular métricas de evento en cliente; color por hash; dropdown de notificaciones con endpoints existentes y pusher.

