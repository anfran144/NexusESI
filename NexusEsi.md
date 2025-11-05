Documento de Contexto y Arquitectura: Plataforma de Gestión de Eventos Académicos
Este documento describe la arquitectura, el funcionamiento, la estructura de datos y la lógica de negocio de la plataforma multi-institucional NexusEsi, un sistema de gestión para la fase de planificación de eventos académicos en semilleros de investigación.
1. Naturaleza y Estructura del Sistema
El sistema es un ecosistema de coordinación y control para la gestión colaborativa de eventos. Su estructura se organiza en tres niveles jerárquicos:
•	Nivel Institucional (Administrador): Garantiza la validez y seguridad de la plataforma, registrando a las instituciones participantes y a sus coordinadores.
•	Nivel Organizacional (Coordinador): Diseña y dirige cada evento académico, creando comités, asignando tareas y resolviendo impedimentos.
•	Nivel Operativo (Líder de Semillero): Ejecuta tareas específicas dentro de los comités a los que es asignado.
Esta estructura permite que cada institución funcione como un mini-ecosistema, donde los eventos son proyectos, los comités son grupos de trabajo y los líderes son los actores que ejecutan las tareas.
2. Procesos Automatizados en Segundo Plano
Para garantizar una operación eficiente y proactiva, el sistema utiliza tres mecanismos clave que funcionan en segundo plano:
•	Email Service (Servicio de Correo) 
Propósito:  Motor de comunicación automatizada para enviar notificaciones, confirmaciones y recordatorios sin intervención manual.
•	Scheduler (Planificador de Tareas) 
Propósito: Ejecuta un proceso programado cada 24 horas para mantener el sistema "vivo". Se encarga de recalcular el riesgo de las tareas, enviar recordatorios y cambiar estados de forma autónoma.
•	Job Queue (Cola de Trabajos) 
Propósito: Gestiona tareas pesadas (como envíos masivos de correos) en segundo plano para que la plataforma se mantenga rápida y estable, sin que el usuario tenga que esperar.
3. Sistema de Categorización Automática de Riesgos
El sistema clasifica automáticamente el riesgo de cada tarea basándose en su fecha límite y su estado, recalculando el nivel de riesgo diariamente.
•	Riesgo Bajo (Verde): La tarea está en progreso y faltan más de 5 días para su vencimiento.
•	Riesgo Medio (Amarillo): La tarea está en progreso, pero faltan entre 2 y 5 días para la fecha límite. Se genera una alerta preventiva.
•	Riesgo Alto (Rojo): La tarea ha superado su fecha límite sin completarse. Su estado cambia automáticamente a "Retrasada" y se genera una alerta crítica.
4. Diseño de la Base de Datos
La estructura de la base de datos está diseñada para reflejar la jerarquía del sistema, asegurando la integridad y la relación entre las distintas entidades.
A continuación, se describen las tablas principales:

Tabla	Propósito	Campos Clave

users	Almacena a todos los usuarios del sistema.	id (PK), name, email, password, role (Admin, Coordinator, Leader), institution_id (FK)

institutions	Registra las instituciones académicas.	id (PK), name, description

events	Contiene la información de cada evento.	id (PK), name, start_date, end_date, coordinator_id (FK a users), institution_id (FK)

committees	Define los comités de trabajo de un evento.	id (PK), name, description, event_id (FK)

committee_members	Tabla pivote que asigna líderes a comités.	id (PK), user_id (FK a users), committee_id (FK)

tasks
	Gestiona las tareas asignadas a los líderes.	id (PK), title, description, due_date, status (Enum: Pending, InProgress, Completed, Delayed, Paused), risk_level (Enum: Low, Medium, High), assigned_to_id (FK a users), committee_id (FK)
task_progress		id (PK), description, file_name, file_path, created_at, task_id (FK), user_id (FK).

incidents	Registra los impedimentos reportados en una tarea.	id (PK), description, status (Enum: Reported, Resolved), task_id (FK), reported_by_id (FK a users), file_name (nullable), file_path (nullable), solution_task_id (FK a tasks, nullable).

alerts	Registra las alertas y notificaciones generadas.	id (PK), message, type (Preventive, Critical), task_id (FK), user_id (FK)

resources	Almacena documentos y otros recursos del evento.	id (PK), file_name, file_path, event_id (FK)

5. Lógica de Negocio
La lógica de negocio define las reglas, permisos y flujos de trabajo que gobiernan las interacciones de los usuarios y los procesos automáticos.
Reglas por Rol de Usuario
1.	Administrador:
o	CRUD sobre institutions.
o	Crear/Verificar users con rol Coordinator.
o	Acceso a un panel de control global.
2.	Coordinador:
o	CRUD sobre events (solo en su institución).
o	CRUD sobre committees dentro de sus eventos.
o	CRUD sobre tasks y asignarlas a comités.
o	Asignar/Desvincular Leaders a/de comités.
o	Resolver incidents.
o	Visualizar el progreso general de sus eventos.
3.	Líder de Semillero:
o	Leer los comités y tareas a los que ha sido asignado.
o	Actualizar el status de sus tareas de InProgress a Completed.
o	Crear incidents para las tareas que tiene asignadas.
o	Restricción: El Líder de Semillero solo puede cambiar el estado de InProgress a Completed. No puede modificar campos críticos como due_date o risk_level, ni cambiar el estado a Delayed, ya que estos son controlados exclusivamente por la lógica de negocio del sistema (el Coordinador o el Scheduler automático)..
o	Recibe notificaciones por correo y dentro del sistema cuando se le asigna una nueva tarea o cuando el riesgo de una tarea cambia.
4.1. Lógica Automatizada: Gestión de Tareas y Riesgos (Scheduler)
Este es el proceso central que se ejecuta cada 24 horas:
1.	Selección: El Scheduler busca todas las tareas cuyo status no sea Completed.
2.	Cálculo de Riesgo: Aplica las siguientes reglas para actualizar el risk_level:
o	Riesgo Alto (High): Si la fecha actual > due_date.
o	Riesgo Medio (Medium): Si faltan entre 2 y 5 días para la due_date.
o	Riesgo Bajo (Low): Si faltan más de 5 días para la due_date.
3.	Acciones Automáticas:
o	Si el risk_level de una tarea cambia (ej. de 'Low' a 'Medium', o de 'Medium' a 'High'), se crea un único registro en alerts y se envía una notificación (preventiva o crítica).
o	Si el risk_level es High, el status de la tarea cambia automáticamente a Delayed.
4.2. Flujo 1: Creación de un Comité
•	Actor: Coordinador
1.	Acción: Selecciona un evento.
2.	Acción: Ingresa el nombre del comité a crear.
3.	Validación del Sistema: Verifica si ya existe un comité con ese nombre para el evento seleccionado.
o	Si existe: Informa al Coordinador que el comité ya está creado.
o	Si no existe: Consulta la lista de usuarios con rol Leader de su institución.
4.	Acción: El Coordinador selecciona un Líder de Semillero para el nuevo comité.
5.	Ejecución del Sistema:
o	Crea un nuevo registro en la tabla committees.
o	Crea un nuevo registro en la tabla committee_members para vincular al líder con el comité.
6.	Notificación: El sistema envía un correo al Líder informando que ha sido asignado al nuevo comité.
4.3. Flujo 2: Asignación de Tareas a un Comité
•	Actor: Coordinador
1.	Acción: Selecciona un evento y luego un comité existente.
2.	Validación del Sistema: Consulta si el comité ya tiene tareas asignadas para informar al Coordinador.
3.	Acción: El Coordinador elige si desea crear una nueva tarea o asignar una existente.
o	Si la tarea no existe: Proporciona los detalles (título, descripción, due_date) para una nueva tarea.
4.	Ejecución del Sistema:
o	Crea un nuevo registro en la tabla tasks con status = InProgress, risk_level = Low, y lo asocia al committee_id. El campo assigned_to_id se deja nulo inicialmente.
5.	Notificación: Envía un mensaje al comité (y a sus miembros) informando que se han asignado nuevas tareas.
4.4. Flujo 3: Asignación de Responsable a una Tarea
•	Actor: Líder de Semillero (Miembro de Comité)
1.	Acción: Selecciona el comité al que pertenece.
2.	Visualización: El sistema muestra las tareas asignadas al comité que aún no tienen un responsable (assigned_to_id es nulo).
3.	Acción: El líder selecciona una tarea de la lista para tomarla.
4.	Validación del Sistema: Confirma que la tarea no tiene un responsable asignado.
5.	Ejecución del Sistema:
o	Actualiza el registro de la task seleccionada, asignando el id del líder al campo assigned_to_id.
o	Actualiza el estado de la tarea si es necesario (generalmente se mantiene InProgress).
6.	Notificación:
o	Envía un mensaje al líder confirmando que la tarea le ha sido asignada.
o	Envía un mensaje al Coordinador informando que la tarea ya tiene un responsable.
4.5. Flujo 4: Ejecución y Seguimiento de Tareas
•	Actor: Líder de Semillero (Responsable de Tarea)
•	Acción: Consulta sus tareas asignadas (tasks.assigned_to_id = self.id).
•	Visualización: El sistema muestra una lista de sus tareas (InProgress, Delayed, Paused).
•	Acción: El líder selecciona una tarea específica.
•	Visualización: El sistema muestra los detalles de la tarea, su historial de avances y le ofrece tres acciones posibles:
•	Opción A: Reportar un Avance (Nuevo Flujo)
o	Propósito: Informar al Coordinador sobre el progreso sin finalizar la tarea.
o	Acción: El líder redacta una descripción de su avance (ej. "Borrador del capítulo 1 terminado") y, opcionalmente, adjunta un archivo.
o	Ejecución del Sistema:
1.	Crea un nuevo registro en la tabla task_progress, vinculando el task_id, el user_id (para auditoría), la descripción y el archivo (si se adjuntó).
o	Notificación:
	(Interna): El Coordinador ve este nuevo avance en el historial de la tarea. No se envía correo para evitar saturación.
•	Opción B: Reportar una Incidencia (Flujo Actualizado)
o	Propósito: Pausar la tarea debido a un impedimento.
o	Acción: El líder redacta una descripción del problema (la incidencia) y, opcionalmente, adjunta un archivo de evidencia (ej. captura de pantalla de un error).
o	Ejecución del Sistema:
1.	Crea un nuevo registro en la tabla incidents (con status = Reported, task_id, reported_by_id, description, y los campos file_name/file_path si se adjuntaron).
2.	El sistema cambia el status de la task a Paused. La tarea sale temporalmente del ciclo de alertas del Scheduler.
o	Notificación:
	(Correo): Envía una alerta crítica por correo al Coordinador, informando sobre la nueva incidencia. Si el líder adjuntó un archivo, este se adjunta al correo.
•	Opción C: Marcar como Completada (Flujo Existente)
o	Propósito: Finalizar la tarea.
o	Acción: El líder confirma que la tarea ha sido completada.
o	Ejecución del Sistema:
1.	Actualiza el status de la task a Completed.
o	Notificación:
	(Interna): Se genera una notificación interna para el Coordinador ("La tarea X ha sido completada").
4.6. Flujo 5: Solución de una Incidencia
•	Actor: Coordinador
1.	Acción: Analiza la incidencia reportada (descripción y archivos adjuntos).
2.	Decisión: El Coordinador determina cómo se debe resolver la incidencia.
o	Opción A: El Coordinador la Resuelve Directamente
	Acción: Ejecuta la solución (ej. proporciona un recurso, aprueba un presupuesto).
	Ejecución del Sistema: 
	Actualiza el `status` del `incident` a `Resolved`.
	Actualiza el `status` de la `task` original de `Paused` a `InProgress` (o `Delayed` si ya pasó la fecha).
	Notificación: Informa al Líder original que la incidencia ha sido resuelta y que puede continuar con su tarea.
o	Opción B: El Coordinador Delega la Solución (Tu escenario)
	Acción: 
1.	El Coordinador crea una nueva tarea de soporte (ej. "Arreglar el formulario de registro")[cite: 196].
2.	Asigna esta nueva tarea a un Líder responsable (ej. al Líder del comité de TI).
	Ejecución del Sistema:
1.	Crea la nueva `task` (Tarea de Soporte).
2.	Vincula la incidencia con esta nueva tarea (guardando el ID de la nueva tarea en `incidents.solution_task_id`). 
3.	El `status` del `incident` original permanece como `Reported` (¡No está resuelto aún!). 
4.	El `status` de la `task` original permanece como `Paused`.
	Notificación: 
	Correo): Informa al Líder de soporte sobre su *nueva tarea*.
	(Interna): Informa al Líder original que su incidencia está siendo gestionada. 
(Flujo Posterior): Completar la Tarea de Soporte
•	Actor: Líder de Soporte (quien recibió la nueva tarea). 
•	Acción: El Líder de Soporte completa la tarea de soporte.
•	Ejecución del Sistema (AUTOMÁTICO):
1.	El sistema detecta que la tarea completada era una `solution_task` (porque estaba vinculada a una incidencia). 
2.	Automáticamente actualiza el `status` del `incident` original a `Resolved`. 
3.	Automáticamente actualiza el `status` de la `task` original de `Paused` a `InProgress`.
•	Notificación: Informa al Líder original que su incidencia ha sido resuelta y que ya puede continuar.

Notificaciones por Correo vs. Internas
El sistema debe manejar ambos tipos de notificaciones. Las notificaciones por correo se reservan para eventos de alta prioridad que requieren la atención del usuario fuera de la plataforma, mientras que las notificaciones internas son para registros de estado que se pueden consultar en un panel o "centro de notificaciones" dentro del sistema.
Notificaciones por Correo Electrónico (Acción Requerida)
Estas son las alertas que deben enviarse activamente a la bandeja de entrada del usuario:
1.	Asignación a un Comité (Flujo 1): Un Líder de Semillero recibe un correo cuando un Coordinador lo asigna a un nuevo comité.
2.	Asignación de una Tarea (Flujo 3): Un Líder de Semillero recibe un correo cuando se le asigna la responsabilidad de una tarea específica.
3.	Alertas de Riesgo (Flujo 4.1):
o	Preventiva (Riesgo Medio): El Líder responsable recibe un correo cuando a su tarea le quedan entre 2 y 5 días para vencer.
o	Crítica (Riesgo Alto): El Líder responsable Y el Coordinador reciben un correo cuando una tarea ha vencido y su estado cambia a Retrasada.
4.	Nueva Incidencia Reportada (Flujo 4.5): El Coordinador recibe un correo de alerta crítica cuando un líder reporta una incidencia (estado Paused).
5.	Solución de Incidencia (Flujo 4.6): El Líder de Semillero recibe un correo cuando su incidencia ha sido marcada como Resolved, para que pueda continuar con su trabajo.
Notificaciones Internas (Registro y Paneles de Control)
Estas son acciones que se registran en la base de datos (probablemente en la tabla alerts) y se muestran en el dashboard, pero no necesariamente envían un correo:
1.	Tarea Completada (Flujo 4.5): Cuando un líder marca una tarea como Completed, se genera una notificación interna para el Coordinador. (Un correo por cada tarea completada sería excesivo).
2.	Tarea Reclamada (Flujo 3): Cuando un líder toma la responsabilidad de una tarea que estaba asignada al comité, se genera una notificación interna para el Coordinador.
3.	Nuevas Tareas para el Comité (Flujo 2): Cuando un Coordinador agrega tareas nuevas a un comité (pero aún sin un responsable específico), se genera una notificación interna para los miembros de ese comité.