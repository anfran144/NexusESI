# Guía de Implementación - Funcionalidades Pendientes NexusESI

> **Propósito**: Este documento establece el orden correcto y las consideraciones para implementar las funcionalidades pendientes en NexusESI.

---

## 📋 Orden de Implementación

### Fase 1: Mejoras de Dashboard y Visualización (Alta Prioridad)

#### 1.1 Dashboard con Métricas Avanzadas
**Objetivo**: Proporcionar métricas en tiempo real y visualizaciones del estado del evento.

**Consideraciones**:
- Agregar endpoints de API para calcular métricas agregadas:
  - Progreso general del evento (porcentaje de tareas completadas)
  - Tareas completadas vs pendientes (contadores)
  - Incidencias activas (contador por estado)
  - Alertas críticas (contador por tipo)
  - Comités activos (contador de comités con tareas pendientes)
- Implementar cálculos en el backend (evitar cálculos pesados en frontend)
- Crear componentes de visualización en frontend:
  - Tarjetas de métricas (KPI cards)
  - Gráficos de progreso circular
  - Gráficos de barras para comparaciones
- Considerar usar librerías como Chart.js o Recharts para gráficos
- Implementar actualización automática de métricas (polling o WebSocket)

**Dependencias**: Ninguna (usa datos existentes)

**Tiempo estimado**: 2-3 semanas

---

#### 1.2 Gráficos Visuales Avanzados
**Objetivo**: Visualizar datos de forma más intuitiva.

**Consideraciones**:
- **Gráfico de progreso por comité**: 
  - Mostrar porcentaje de completitud por comité
  - Usar colores diferenciados por comité
  - Permitir drill-down para ver tareas del comité
- **Timeline del evento**:
  - Visualización cronológica de tareas y hitos importantes
  - Mostrar fechas clave: inicio, fin, hitos intermedios
  - Indicar tareas completadas vs pendientes en la línea de tiempo
- **Distribución de carga de trabajo**:
  - Gráfico que muestre cuántas tareas tiene cada usuario
  - Identificar sobrecarga de trabajo
  - Mostrar balance de carga entre miembros del comité
- **Tendencia de completitud**:
  - Gráfico de líneas que muestre el progreso a lo largo del tiempo
  - Comparar progreso actual vs esperado
  - Mostrar proyecciones basadas en velocidad actual

**Dependencias**: 1.1 (Dashboard con métricas)

**Tiempo estimado**: 1-2 semanas

---

### Fase 2: Exportación y Reportes (Alta Prioridad)

#### 2.1 Exportación de Reportes a PDF/Excel
**Objetivo**: Permitir exportar información del evento en formatos estándar.

**Consideraciones**:
- **PDF**:
  - Usar librería como TCPDF, DomPDF o wkhtmltopdf
  - Generar reportes incluyendo:
    - Resumen ejecutivo del evento
    - Listado de tareas con estados
    - Incidencias reportadas y resueltas
    - Estadísticas de comités
  - Incluir gráficos y tablas formateadas
  - Agregar encabezados y pies de página con logo
  - Permitir personalización de qué secciones incluir
- **Excel**:
  - Usar librería como PhpSpreadsheet o Laravel Excel
  - Exportar datos tabulares:
    - Tareas con todos sus detalles
    - Participantes del evento
    - Incidencias con historial
  - Incluir múltiples hojas por tipo de dato
  - Formatear con colores y estilos según estados
- Implementar endpoints de API:
  - `GET /api/events/{id}/export/pdf`
  - `GET /api/events/{id}/export/excel`
- Agregar botones de exportación en las vistas del coordinador
- Considerar permisos: solo coordinadores pueden exportar

**Dependencias**: 1.1 (necesita métricas para incluir en reportes)

**Tiempo estimado**: 2 semanas

---

#### 2.2 Filtros Avanzados
**Objetivo**: Permitir filtrar información de manera más granular.

**Consideraciones**:
- **Filtros por fecha**:
  - Rango de fechas personalizado
  - Filtros predefinidos (última semana, último mes, etc.)
  - Filtrar tareas por fecha de vencimiento
  - Filtrar eventos por período
- **Filtros por comité**:
  - Selección múltiple de comités
  - Ver tareas de múltiples comités simultáneamente
  - Filtrar participantes por comité
- **Filtros por estado**:
  - Combinación de estados (ej: ver tareas completadas Y pendientes)
  - Excluir estados específicos
  - Filtrar incidencias por estado (reportadas, resueltas)
- **Filtros combinados**:
  - Permitir múltiples filtros simultáneos
  - Guardar filtros favoritos
  - Exportar resultados filtrados
- Implementar persistencia de filtros en URL (query parameters)
- Agregar indicadores visuales de filtros activos

**Dependencias**: Ninguna (mejora funcionalidad existente)

**Tiempo estimado**: 1 semana

---

### Fase 3: Integración con Calendarios (Media Prioridad)

#### 3.1 Vista de Calendario Integrada
**Objetivo**: Mostrar un calendario general del evento que integre todos los elementos temporales relacionados (evento principal, tareas, incidencias) en una vista unificada.

**Consideraciones**:
- **Contexto del calendario**:
  - El calendario se muestra dentro de la página del evento (`/eventos/{eventId}/calendario`)
  - Muestra todos los elementos temporales del evento: evento principal, tareas, incidencias relacionadas
  - El rango de fechas se enfoca en el período del evento (desde `start_date` hasta `end_date`), con opción de mostrar margen antes/después
  - **Nota**: Los recordatorios para reuniones no están incluidos en esta fase (funcionalidad futura)
- **Vista mensual**:
  - Mostrar el evento principal como barra que abarca todo su rango (start_date a end_date)
  - Mostrar todas las tareas del evento en su fecha de vencimiento (`due_date`)
  - Mostrar incidencias relacionadas con las tareas del evento (si tienen fecha asociada)
  - Usar colores diferenciados por tipo de elemento (evento, tareas por comité, incidencias)
  - Permitir hacer clic en un día para ver detalles de todos los elementos del día
- **Vista semanal**:
  - Mostrar distribución completa de tareas por día de la semana
  - Identificar días con mayor carga de trabajo dentro del evento
  - Mostrar el evento principal como barra continua
  - Agrupar tareas por comité o mostrar por asignado
- **Vista diaria**:
  - Lista detallada de todos los elementos del día (tareas, incidencias, hitos del evento)
  - Mostrar tareas con sus detalles completos (comité, usuario asignado, estado, nivel de riesgo)
  - Mostrar incidencias relacionadas con las tareas del día
  - Mostrar horarios estimados si están disponibles (para tareas, no para reuniones)
- **Implementar componentes de calendario**:
  - Usar librería como FullCalendar o react-big-calendar
  - Permitir navegación entre meses/semanas (dentro del rango del evento)
  - Agregar leyenda de colores para diferenciar tipos de elementos
  - Integrar como nueva pestaña en la página del evento
- **Filtros dentro del calendario general**:
  - Filtrar por comité (mostrar/ocultar tareas de comités específicos)
  - Filtrar por usuario asignado (solo participantes del evento)
  - Filtrar por tipo de elemento (evento, tareas, incidencias)
  - Filtrar por estado de tarea (InProgress, Completed, Delayed, Paused)
  - Mostrar/ocultar incidencias
- **Interactividad**:
  - Permitir crear tareas desde el calendario (arrastrar y soltar para establecer fecha)
  - Hacer clic en cualquier elemento para ver detalles y editar
  - Navegar fluidamente entre vistas (mensual, semanal, diaria)
  - Mostrar tooltips al pasar el mouse sobre elementos

**Dependencias**: Ninguna (usa datos existentes del evento)

**Tiempo estimado**: 2 semanas

**Nota**: Los recordatorios para reuniones son una funcionalidad planificada para fases futuras y no están incluidos en esta implementación.

---

#### 3.2 Sincronización con Calendarios Externos
**Objetivo**: Permitir exportar eventos a Google Calender.

**Consideraciones**:
- **Formato iCalendar (.ics)**:
  - Generar archivos .ics estándar
  - Incluir toda la información del evento
  - Agregar recordatorios automáticos
  - Permitir descarga de archivo .ics
- **Integración con Google Calendar**:
  - Usar Google Calendar API
  - OAuth 2.0 para autenticación
  - Crear eventos automáticamente en Google Calendar del usuario
  - Sincronizar cambios bidireccionalmente
- Implementar preferencias de usuario:
  - Permitir elegir qué eventos sincronizar
  - Configurar recordatorios personalizados
- Agregar botones de sincronización en vista de eventos

**Dependencias**: 3.1 (vista de calendario)

**Tiempo estimado**: 2-3 semanas

---

### Fase 4: Mejoras al Sistema de Tareas (Media Prioridad)

#### 4.1 Tiempo Estimado vs Real
**Objetivo**: Comparar tiempo planificado vs tiempo real de ejecución.

**Consideraciones**:
- **Campos necesarios**:
  - `estimated_hours`: Tiempo estimado en horas
  - `actual_hours`: Tiempo real acumulado
  - `started_at`: Timestamp de inicio real
  - `completed_at`: Timestamp de finalización
- **Cálculos**:
  - Calcular tiempo real basado en timestamps
  - Mostrar diferencia entre estimado y real
  - Calcular eficiencia (estimado/real)
- **Reportes**:
  - Mostrar tareas con mayor desviación
  - Calcular promedios de estimación vs realidad
  - Usar para mejorar estimaciones futuras
- **Interfaz**:
  - Mostrar estimado vs real en vista de tarea
  - Alertar si hay desviación significativa
  - Permitir ajustar estimaciones basado en historial

**Dependencias**: Ninguna

**Tiempo estimado**: 1 semana

---

### Fase 5: Mejoras al Sistema de Incidencias (Media Prioridad)

#### 5.1 Escalamiento Automático de Incidencias
**Objetivo**: Elevar automáticamente incidencias sin resolver a niveles superiores.

**Consideraciones**:
- **Niveles de escalamiento**:
  - Nivel 1 (24 horas): Notificar a Administrador
  - Nivel 2 (48 horas): Notificación urgente + Dashboard crítico
  - Nivel 3 (72 horas): Notificar a Administrador Institucional
- **Implementación**:
  - Agregar campos: `escalated_level`, `escalated_at`, `escalated_to_id`
  - Crear comando de scheduler que revise incidencias cada hora
  - Calcular tiempo transcurrido desde reporte
  - Escalar automáticamente según tiempo
  - Enviar notificaciones según nivel
- **Notificaciones**:
  - Email urgente al responsable del nivel
  - Notificación en tiempo real
  - Alertas en dashboard de administradores
- **Visualización**:
  - Mostrar nivel de escalamiento en vista de incidencia
  - Indicar visualmente incidencias escaladas
  - Filtrar por nivel de escalamiento

**Dependencias**: Sistema de notificaciones existente

**Tiempo estimado**: 1-2 semanas

---

#### 5.2 Historial de Resoluciones
**Objetivo**: Registrar todas las acciones relacionadas con la resolución de incidencias.

**Consideraciones**:
- **Información a registrar**:
  - Quién resolvió la incidencia (`resolved_by_id`)
  - Cuándo se resolvió exactamente (`resolved_at`)
  - Cómo se resolvió (descripción/notas de resolución)
  - Método de resolución (directa vs delegada)
  - Tiempo que tardó en resolverse
  - Intentos previos o comentarios durante resolución
- **Implementación**:
  - Agregar campos a tabla `incidents`
  - Crear tabla `incident_resolution_history` para historial detallado
  - Registrar cada acción: creación, intentos de resolución, resolución final
  - Guardar comentarios y notas del coordinador
- **Visualización**:
  - Mostrar historial completo en vista de incidencia
  - Timeline de eventos de la incidencia
  - Mostrar quién hizo qué y cuándo
  - Permitir agregar comentarios al historial

**Dependencias**: Ninguna

**Tiempo estimado**: 1 semana

---

### Fase 6: Documentación y Recursos (Baja Prioridad)

#### 6.1 Repositorio Central de Documentos
**Objetivo**: Centralizar todos los documentos del evento en un solo lugar.

**Consideraciones**:
- **Estructura**:
  - Crear tabla `event_resources` para documentos del evento
  - Organizar por categorías (plantillas, guías, recursos compartidos)
  - Permitir subir múltiples tipos de archivos
- **Funcionalidad**:
  - Subir documentos desde vista del evento
  - Organizar en carpetas/categorías
  - Compartir con todos los participantes o solo comités específicos
  - Control de versiones básico
- **Permisos**:
  - Solo coordinadores pueden subir documentos
  - Participantes pueden descargar según permisos
  - Registrar quién descargó qué y cuándo
- **Interfaz**:
  - Vista de repositorio con lista de documentos
  - Búsqueda y filtros
  - Preview de documentos (si es posible)

**Dependencias**: Sistema de archivos existente

**Tiempo estimado**: 1-2 semanas

---

---

#### 6.2 Guías y Manuales Integrados
**Objetivo**: Proporcionar ayuda contextual dentro de la aplicación.

**Consideraciones**:
- **Contenido**:
  - Guías por rol (Coordinador, Líder, Administrador)
  - Tutoriales paso a paso
  - FAQs integrados
  - Tooltips contextuales
- **Implementación**:
  - Crear sección de Centro de Ayuda (ya existe estructura)
  - Almacenar contenido en base de datos o archivos Markdown
  - Sistema de búsqueda en documentación
- **Interfaz**:
  - Acceso desde menú principal
  - Búsqueda de ayuda
  - Navegación por categorías
  - Enlaces contextuales desde formularios
- **Tooltips**:
  - Agregar iconos de ayuda (?) en campos importantes
  - Tooltips explicativos al pasar mouse
  - Descripciones en formularios

**Dependencias**: Ninguna (ya existe ruta `/help-center`)

**Tiempo estimado**: 2-3 semanas

---

#### 6.3 Versionado de Documentos
**Objetivo**: Mantener historial de versiones de documentos importantes.

**Consideraciones**:
- **Estructura**:
  - Modificar tabla de recursos para incluir versionado
  - Crear tabla `document_versions` para historial
  - Almacenar cada versión con timestamp
- **Funcionalidad**:
  - Guardar versión automáticamente al subir nuevo documento con mismo nombre
  - Mantener versiones anteriores (no eliminar)
  - Permitir descargar versión específica
  - Mostrar historial de versiones
- **Interfaz**:
  - Indicar versión actual en lista de documentos
  - Mostrar historial de cambios
  - Permitir comparar versiones (opcional)
  - Restaurar versión anterior

**Dependencias**: 7.1 (repositorio de documentos)

**Tiempo estimado**: 1 semana

---

### Fase 7: Mejoras Adicionales (Baja Prioridad)

#### 7.1 Perfiles de Participantes
**Objetivo**: Mostrar información detallada de cada participante.

**Consideraciones**:
- **Información adicional**:
  - Bio o descripción del participante
  - Foto de perfil
  - Experiencia previa en eventos
  - Especialización o área de conocimiento
- **Implementación**:
  - Agregar campos a tabla `users` o crear tabla `user_profiles`
  - Permitir editar perfil desde configuración
  - Mostrar perfil en vista de participantes
- **Estadísticas**:
  - Tareas completadas históricas
  - Participación en eventos anteriores
  - Tiempo promedio de completitud
  - Calificación o evaluación (opcional)

**Dependencias**: Ninguna

**Tiempo estimado**: 1 semana

---

#### 7.2 Historial de Participación
**Objetivo**: Registrar participación histórica de usuarios en eventos.

**Consideraciones**:
- **Datos a registrar**:
  - Eventos en los que ha participado
  - Roles desempeñados (líder, coordinador)
  - Tareas completadas por evento
  - Incidencias reportadas y resueltas
- **Visualización**:
  - Mostrar historial en perfil de usuario
  - Timeline de participación
  - Estadísticas agregadas
- **Implementación**:
  - Usar datos existentes de `event_participants` y `tasks`
  - Agregar vista de historial en perfil
  - Calcular estadísticas desde datos históricos

**Dependencias**: 8.1 (perfiles de participantes)

**Tiempo estimado**: 1 semana

---

## 📊 Resumen de Prioridades

### Alta Prioridad (Implementar primero)
1. Dashboard con métricas avanzadas
2. Gráficos visuales avanzados
3. Exportación de reportes (PDF/Excel)
4. Filtros avanzados

### Media Prioridad (Implementar después)
5. Vista de calendario integrada
6. Sincronización con calendarios externos
9. Tiempo estimado vs real
10. Escalamiento automático de incidencias
11. Historial de resoluciones

### Baja Prioridad (Implementar según necesidades)
13. Repositorio central de documentos
15. Guías y manuales integrados
16. Versionado de documentos
17. Perfiles de participantes
18. Historial de participación

---

## ⚠️ Consideraciones Generales

### Antes de Implementar Cualquier Funcionalidad

1. **Revisar arquitectura existente**:
   - Entender cómo funcionan los modelos actuales
   - Revisar políticas de autorización
   - Verificar estructura de API

2. **Validar con usuarios**:
   - Confirmar que la funcionalidad es realmente necesaria
   - Obtener feedback sobre UX/UI
   - Asegurar que no duplica funcionalidad existente

3. **Considerar impacto**:
   - ¿Afecta rendimiento?
   - ¿Requiere migraciones de base de datos?
   - ¿Necesita cambios en frontend y backend?

4. **Documentar**:
   - Actualizar documentación técnica
   - Agregar ejemplos de uso
   - Documentar cambios en API

### Mejores Prácticas

- **Backend primero**: Implementar API antes que interfaz
- **Testing**: Probar cada funcionalidad antes de continuar
- **Iterativo**: Implementar funcionalidad básica primero, luego mejoras
- **Consistencia**: Mantener estilo y patrones del código existente
- **Seguridad**: Validar permisos en cada endpoint
- **Performance**: Optimizar consultas y evitar N+1 queries

---

**Última actualización**: Diciembre 2024  
**Versión**: 1.0  
**Estado**: Guía de referencia para implementación

