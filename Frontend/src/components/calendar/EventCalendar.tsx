import { useState, useEffect, useCallback } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import esLocale from '@fullcalendar/core/locales/es'
import { eventService } from '@/services/event.service'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Filter } from 'lucide-react'
import type { EventClickArg } from '@fullcalendar/core'
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

  // Filtros
  const [filters, setFilters] = useState({
    showEvent: true,
    showTasks: true,
    showIncidents: true,
    showMeetings: true,
    committeeIds: [] as number[],
    taskStatuses: [] as string[],
    meetingTypes: [] as string[],
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

  // Filtrar eventos según los filtros activos
  const filteredEvents = calendarEvents.filter(event => {
    if (!filters.showEvent && event.type === 'event') return false
    if (!filters.showTasks && event.type === 'task') return false
    if (!filters.showIncidents && event.type === 'incident') return false
    if (!filters.showMeetings && event.type === 'meeting') return false

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

    if (event.type === 'meeting') {
      const props = event.extendedProps
      
      // Filtro por tipo de reunión
      if (filters.meetingTypes.length > 0) {
        if (!filters.meetingTypes.includes(props.meetingType)) return false
      }
    }

    return true
  })

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event
    const extendedProps = event.extendedProps
    
    let eventType: 'event' | 'task' | 'incident' | 'meeting' = 'task'
    if (event.id.startsWith('event-')) {
      eventType = 'event'
    } else if (event.id.startsWith('incident-')) {
      eventType = 'incident'
    } else if (event.id.startsWith('task-')) {
      eventType = 'task'
    } else if (event.id.startsWith('meeting-')) {
      eventType = 'meeting'
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
            editable={false}
            selectable={false}
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
              {selectedEvent?.type === 'meeting' && 'Detalles de la reunión'}
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
              {selectedEvent.type === 'meeting' && (
                <>
                  <div>
                    <Label className="text-sm font-semibold">Descripción</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedEvent.extendedProps.description || 'Sin descripción'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold">Tipo de Reunión</Label>
                      <div className="mt-1">
                        <Badge variant="outline">{selectedEvent.extendedProps.meetingTypeLabel || 'Reunión'}</Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Ubicación</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedEvent.extendedProps.location || 'No especificada'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Fecha y Hora</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        <time dateTime={selectedEvent.start}>
                          {format(new Date(selectedEvent.start), "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                        </time>
                      </p>
                    </div>
                    {selectedEvent.extendedProps.hasQrCode && (
                      <div>
                        <Label className="text-sm font-semibold">QR Code</Label>
                        <div className="mt-1">
                          <Badge variant="default">Disponible</Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}