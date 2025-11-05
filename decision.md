**Datos PLACEHOLDER (marcadores de posición):**
- ⚠️ `mockEventStats.progress` - Progreso general del evento (%)
Para que haya un progreso general del evento, ¿se necesita el total de tareas?

- ⚠️ `mockEventStats.active_committees` - Comités activos
Esto te refieres a manejar ¿estados en los comités? todo comité que se crea está activo.

- ⚠️ `mockEventStats.active_participants` - Participantes activos
Esto te refieres con Participantes activos.

- ⚠️ `mockEventStats.total_tasks` - Total de tareas
Para el total de tareas, me imagino que las tareas deben estar ligadas a un evento (ese campo no existe), y me parece bueno por qué el banco de tareas podrías crear las tareas y luego asignarlas a un comité.


**Datos PLACEHOLDER:**
- ⚠️ `incident.title` - Backend NO tiene este campo (se genera desde descripción)
No se va manejar title en una incidencia.

- ⚠️ `incident.priority` - Sistema de prioridades NO EXISTE
  - Estados: 'low' | 'medium' | 'high' | 'critical'
Las incidencias no tiene prioridades, pero se podrían calcular de acuerdo a la tarea.

- ⚠️ `incident.category` - Sistema de categorías NO EXISTE
  - Categorías: 'technical' | 'logistics' | 'security' | 'communication' | 'other'
Las incidencia no tienen categoría, y tampoco se va manejar. Remover el sistema de categoría.

- ⚠️ `incident.assignedTo` - Usuario asignado para resolver NO EXISTE
Realmente no se asigna un usuario para resolver, a la incidencia se le asigna una tarea y la tarea se asigna a un usuario para que lo resuelva, si esa tarea está completa la incidencia se resolvió.

- ⚠️ `incident.comments[]` - Sistema de comentarios NO EXISTE
Un sistema de comentarios no sé que tan eficiente sea.

Está parte de la incidencia para resolver existen dos caminos que el coordinador se haga cargo o la situacion con la tarea para el lider de semillero que el vea correcto.

**Campo PLACEHOLDER Especial:**
- ⚠️ `task.progress` (porcentaje) - Backend NO tiene este campo
  - Backend tiene `task_progress[]` (historial de avances)
  - Pero NO calcula porcentaje de progreso
Realmente es dificil calcular el porcentaje de progreso, por qué el lider tiene una tarea y si desea sube avances o solo marca completada la tarea sin subir nada.

**Campos PLACEHOLDER de Comités:**
- ⚠️ `committee.color` - Backend NO tiene este campo para visualización

Buscar una alternativa, el backend manejar color no está dentro.