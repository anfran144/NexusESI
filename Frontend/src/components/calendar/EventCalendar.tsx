import { useState, useEffect, useCallback } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import esLocale from '@fullcalendar/core/locales/es'
import { eventService } from '@/services/event.service'
import { taskService, type CreateTaskData } from '@/services/taskService'
import { committeeService } from '@/services/committee.service'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Filter } from 'lucide-react'
import type { DateSelectArg, EventClickArg } from '@fullcalendar/core'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface EventCalendarProps {
  eventId: number
}

export function EventCalendar({ eventId }: EventCalendarProps) {
  const [calendarEvents, setCalendarEvents] = useState<any[]>([])
  const [eventData, setEventData] = useState<any>(null)
  const [committees, setCommittees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false)
  const [taskForm, setTaskForm] = useState<CreateTaskData>({
    title: '',
    description: '',
    due_date: '',
    event_id: eventId,
  })
  const [creatingTask, setCreatingTask] = useState(false)
  const [allCommittees, setAllCommittees] = useState<any[]>([])

  // Filtros
  const [filters, setFilters] = useState({
    showEvent: true,
    showTasks: true,
    showIncidents: true,
    committeeIds: [] as number[],
    taskStatuses: [] as string[],
  })

  const loadCalendarData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await eventService.getEventCalendar(eventId)
      
      if (response.success && response.data) {
        setCalendarEvents(response.data.events)
        setEventData(response.data.event)
        setCommittees(response.data.committees)
      }
    } catch (error) {
      console.error('Error loading calendar data:', error)
      toast.error('Error al cargar los datos del calendario')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    loadCalendarData()
  }, [loadCalendarData])

  // Cargar comités para el formulario de creación
  useEffect(() => {
    const loadCommittees = async () => {
      try {
        const response = await committeeService.getCommittees({ event_id: eventId })
        if (response.success) {
          setAllCommittees(response.data)
        }
      } catch (error) {
        console.error('Error loading committees:', error)
      }
    }
    loadCommittees()
  }, [eventId])

  // Filtrar eventos según los filtros activos
  const filteredEvents = calendarEvents.filter(event => {
    if (!filters.showEvent && event.type === 'event') return false
    if (!filters.showTasks && event.type === 'task') return false
    if (!filters.showIncidents && event.type === 'incident') return false

    if (event.type === 'task') {
      const props = event.extendedProps
      
      // Filtro por comité
      if (filters.committeeIds.length > 0 && props.committeeId) {
        if (!filters.committeeIds.includes(props.committeeId)) return false
      }

      // Filtro por estado
      if (filters.taskStatuses.length > 0) {
        if (!filters.taskStatuses.includes(props.status)) return false
      }
    }

    return true
  })

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    // Formato ISO 8601 para fecha (YYYY-MM-DD)
    const selectedDateStr = format(selectInfo.start, 'yyyy-MM-dd')
    
    // Validar que la fecha esté dentro del rango del evento
    if (eventData) {
      const eventStart = new Date(eventData.start_date)
      const eventEnd = new Date(eventData.end_date)
      const selectedDate = new Date(selectedDateStr)
      
      if (selectedDate < eventStart || selectedDate > eventEnd) {
        toast.error(`La fecha debe estar entre ${format(eventStart, 'dd/MM/yyyy', { locale: es })} y ${format(eventEnd, 'dd/MM/yyyy', { locale: es })}`)
        selectInfo.view.calendar.unselect()
        return
      }
    }
    
    setTaskForm({
      title: '',
      description: '',
      due_date: selectedDateStr,
      event_id: eventId,
    })
    setCreateTaskDialogOpen(true)
    selectInfo.view.calendar.unselect()
  }

  const handleCreateTask = async () => {
    if (!taskForm.title || !taskForm.description || !taskForm.due_date) {
      toast.error('Por favor completa todos los campos requeridos')
      return
    }

    try {
      setCreatingTask(true)
      await taskService.createTask(taskForm)
      toast.success('Tarea creada exitosamente')
      setCreateTaskDialogOpen(false)
      setTaskForm({
        title: '',
        description: '',
        due_date: '',
        event_id: eventId,
      })
      await loadCalendarData()
    } catch (error: any) {
      console.error('Error creating task:', error)
      toast.error(error.response?.data?.message || 'Error al crear la tarea')
    } finally {
      setCreatingTask(false)
    }
  }

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event
    const extendedProps = event.extendedProps
    
    let eventType: 'event' | 'task' | 'incident' = 'task'
    if (event.id.startsWith('event-')) {
      eventType = 'event'
    } else if (event.id.startsWith('incident-')) {
      eventType = 'incident'
    } else if (event.id.startsWith('task-')) {
      eventType = 'task'
    }
    
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.startStr,
      end: event.endStr,
      allDay: event.allDay,
      type: eventType,
      extendedProps: extendedProps,
    })
    setDialogOpen(true)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'Completed': 'default',
      'InProgress': 'secondary',
      'Delayed': 'destructive',
      'Paused': 'outline',
      'Pending': 'outline',
      'Reported': 'destructive',
      'Resolved': 'default',
    }

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando calendario...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <CardTitle className="text-lg">Filtros</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filter-types">Tipo de Elementos</Label>
              <div id="filter-types" className="space-y-2" role="group" aria-label="Filtros por tipo de elemento">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-event"
                    checked={filters.showEvent}
                    onCheckedChange={(checked) =>
                      setFilters({ ...filters, showEvent: checked as boolean })
                    }
                    aria-label="Mostrar eventos"
                  />
                  <Label htmlFor="show-event" className="cursor-pointer">Evento</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-tasks"
                    checked={filters.showTasks}
                    onCheckedChange={(checked) =>
                      setFilters({ ...filters, showTasks: checked as boolean })
                    }
                    aria-label="Mostrar tareas"
                  />
                  <Label htmlFor="show-tasks" className="cursor-pointer">Tareas</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-incidents"
                    checked={filters.showIncidents}
                    onCheckedChange={(checked) =>
                      setFilters({ ...filters, showIncidents: checked as boolean })
                    }
                    aria-label="Mostrar incidencias"
                  />
                  <Label htmlFor="show-incidents" className="cursor-pointer">Incidencias</Label>
                </div>
              </div>
            </div>

            {committees.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="filter-committees">Comités</Label>
                <Select
                  value={filters.committeeIds.length > 0 ? filters.committeeIds[0].toString() : 'all'}
                  onValueChange={(value) => {
                    if (value === 'all') {
                      setFilters({ ...filters, committeeIds: [] })
                    } else {
                      setFilters({ ...filters, committeeIds: [parseInt(value)] })
                    }
                  }}
                >
                  <SelectTrigger id="filter-committees" aria-label="Filtrar por comité">
                    <SelectValue placeholder="Todos los comités" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los comités</SelectItem>
                    {committees.map((committee) => (
                      <SelectItem key={committee.id} value={committee.id.toString()}>
                        {committee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="filter-status">Estado de Tareas</Label>
              <Select
                value={filters.taskStatuses.length > 0 ? filters.taskStatuses[0] : 'all'}
                onValueChange={(value) => {
                  if (value === 'all') {
                    setFilters({ ...filters, taskStatuses: [] })
                  } else {
                    setFilters({ ...filters, taskStatuses: [value] })
                  }
                }}
              >
                <SelectTrigger id="filter-status" aria-label="Filtrar por estado de tarea">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="Pending">Pendiente</SelectItem>
                  <SelectItem value="InProgress">En Progreso</SelectItem>
                  <SelectItem value="Completed">Completada</SelectItem>
                  <SelectItem value="Delayed">Atrasada</SelectItem>
                  <SelectItem value="Paused">Pausada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Leyenda</Label>
              <div className="space-y-1 text-sm" role="list" aria-label="Leyenda de colores">
                <div className="flex items-center gap-2" role="listitem">
                  <div className="w-4 h-4 rounded bg-blue-500" aria-label="Color azul para eventos"></div>
                  <span>Evento</span>
                </div>
                <div className="flex items-center gap-2" role="listitem">
                  <div className="w-4 h-4 rounded bg-indigo-500" aria-label="Color índigo para tareas"></div>
                  <span>Tareas</span>
                </div>
                <div className="flex items-center gap-2" role="listitem">
                  <div className="w-4 h-4 rounded bg-red-500" aria-label="Color rojo para incidencias"></div>
                  <span>Incidencias</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendario - Configuración estándar de FullCalendar con UX/UI y ISO */}
      <Card>
        <CardContent className="pt-6">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            locale={esLocale}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            buttonText={{
              today: 'Hoy',
              month: 'Mes',
              week: 'Semana',
              day: 'Día'
            }}
            events={filteredEvents}
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            weekends={true}
            firstDay={1}
            navLinks={true}
            nowIndicator={true}
            allDaySlot={true}
            slotMinTime="00:00:00"
            slotMaxTime="24:00:00"
            slotDuration="00:30:00"
            slotLabelFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }}
            dayHeaderFormat={{
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              omitCommas: false
            }}
            titleFormat={{
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }}
            eventDisplay="block"
            displayEventTime={true}
            displayEventEnd={true}
            select={handleDateSelect}
            eventClick={handleEventClick}
            height="auto"
            validRange={{
              start: eventData?.start_date,
              end: eventData?.end_date ? new Date(new Date(eventData.end_date).getTime() + 86400000).toISOString().split('T')[0] : undefined,
            }}
          />
        </CardContent>
      </Card>

      {/* Dialog de detalles */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>
              {selectedEvent?.type === 'event' && 'Detalles del evento'}
              {selectedEvent?.type === 'task' && 'Detalles de la tarea'}
              {selectedEvent?.type === 'incident' && 'Detalles de la incidencia'}
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              {selectedEvent.type === 'task' && (
                <>
                  <div>
                    <Label className="text-sm font-semibold">Descripción</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedEvent.extendedProps.description || 'Sin descripción'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold">Estado</Label>
                      <div className="mt-1">
                        {getStatusBadge(selectedEvent.extendedProps.status)}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Nivel de Riesgo</Label>
                      <div className="mt-1">
                        <Badge variant="outline">{selectedEvent.extendedProps.riskLevel}</Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Comité</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedEvent.extendedProps.committeeName || 'Sin comité'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Asignado a</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedEvent.extendedProps.assignedToName || 'Sin asignar'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Fecha de Vencimiento</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      <time dateTime={selectedEvent.start}>
                        {format(new Date(selectedEvent.start), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                      </time>
                      <span className="sr-only">Fecha en formato ISO: {selectedEvent.start}</span>
                    </p>
                  </div>
                </>
              )}
              {selectedEvent.type === 'incident' && (
                <>
                  <div>
                    <Label className="text-sm font-semibold">Descripción</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedEvent.extendedProps.description || 'Sin descripción'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold">Estado</Label>
                      <div className="mt-1">
                        {getStatusBadge(selectedEvent.extendedProps.status)}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Tarea Relacionada</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedEvent.extendedProps.taskTitle || 'Sin tarea'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Reportado por</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedEvent.extendedProps.reportedByName || 'Desconocido'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Fecha de Reporte</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        <time dateTime={selectedEvent.start}>
                          {format(new Date(selectedEvent.start), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                        </time>
                        <span className="sr-only">Fecha en formato ISO: {selectedEvent.start}</span>
                      </p>
                    </div>
                  </div>
                </>
              )}
              {selectedEvent.type === 'event' && (
                <>
                  <div>
                    <Label className="text-sm font-semibold">Descripción</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedEvent.extendedProps.description || 'Sin descripción'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Estado</Label>
                    <div className="mt-1">
                      {getStatusBadge(selectedEvent.extendedProps.status)}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de creación de tarea */}
      <Dialog open={createTaskDialogOpen} onOpenChange={setCreateTaskDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Nueva Tarea</DialogTitle>
            <DialogDescription>
              Crea una nueva tarea para el evento. La fecha de vencimiento se establece automáticamente según la fecha seleccionada en el calendario.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Título *</Label>
              <Input
                id="task-title"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                placeholder="Ej: Preparar presentación"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-description">Descripción *</Label>
              <Textarea
                id="task-description"
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                placeholder="Describe los detalles de la tarea..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-due-date">Fecha de Vencimiento *</Label>
                <Input
                  id="task-due-date"
                  type="date"
                  value={taskForm.due_date}
                  onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                  aria-label="Fecha de vencimiento en formato ISO 8601 (YYYY-MM-DD)"
                  aria-required="true"
                  min={eventData?.start_date}
                  max={eventData?.end_date}
                />
                <p className="text-xs text-muted-foreground">
                  Formato: YYYY-MM-DD (ISO 8601)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-committee">Comité (Opcional)</Label>
                <Select
                  value={taskForm.committee_id?.toString() || ''}
                  onValueChange={(value) =>
                    setTaskForm({
                      ...taskForm,
                      committee_id: value ? parseInt(value) : undefined,
                    })
                  }
                >
                  <SelectTrigger id="task-committee">
                    <SelectValue placeholder="Sin comité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin comité</SelectItem>
                    {allCommittees.map((committee) => (
                      <SelectItem key={committee.id} value={committee.id.toString()}>
                        {committee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateTaskDialogOpen(false)
                setTaskForm({
                  title: '',
                  description: '',
                  due_date: '',
                  event_id: eventId,
                })
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreateTask} disabled={creatingTask}>
              {creatingTask ? 'Creando...' : 'Crear Tarea'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}