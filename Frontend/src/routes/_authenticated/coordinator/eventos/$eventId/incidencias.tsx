import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardContent } from '@/components/layout/dashboard-content'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { useEventContext } from '@/stores/event-context-store'
import { useState, useEffect } from 'react'
import { eventService, type Event } from '@/services/event.service'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  AlertTriangle, 
  Search, 
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Calendar,
  MessageSquare
} from 'lucide-react'
import { taskService, type Incident as BackendIncident, type Task, type CreateTaskData } from '@/services/taskService'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAdvancedFilters } from '@/hooks/useAdvancedFilters'
import { useFilterFavorites } from '@/hooks/useFilterFavorites'
import { FiltersBar } from '@/components/filters'
import { DatePicker } from '@/components/ui/date-picker'
import { format } from 'date-fns'
import { committeeService } from '@/services/committee.service'

export const Route = createFileRoute('/_authenticated/coordinator/eventos/$eventId/incidencias')({
  component: EventIncidenciasPage,
})

// ============================================
// TIPOS DE DATOS PARA INCIDENCIAS
// ============================================
// Interfaz simplificada según decisiones del documento DatosPlaceholder.md
// Se eliminaron campos que no se van a implementar: title, priority, category, assignedTo, comments

interface Incident {
  id: number
  description: string
  status: 'Reported' | 'Resolved' // Estados reales del backend
  reported_by: number | { id: number; name: string; email?: string }
  reported_by_name?: string // Nombre del usuario que reportó
  task_id: number
  file_name?: string
  file_path?: string
  solution_task_id?: number
  created_at: string
  updated_at: string
  resolved_at?: string
}

interface EventParticipant {
  id: number
  user: {
    id: number
    name: string
    email: string
    institution?: {
      id: number
      nombre: string
      identificador: string
    }
  }
  created_at: string
}

// ============================================
// DATOS REALES CARGADOS DESDE BACKEND
// ============================================

// ============================================
// CONFIGURACIÓN DE ESTADOS Y PRIORIDADES
// ============================================
// Nota: Esta configuración incluye estados PLACEHOLDERS que no existen en el backend

// Solo estados reales del backend según decisiones del documento
const statusConfig = {
  Reported: { label: 'Reportada', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  Resolved: { label: 'Resuelta', color: 'bg-green-100 text-green-800', icon: CheckCircle2 }
}

function EventIncidenciasPage() {
  const { eventId } = Route.useParams()
  const { setSelectedEvent, clearSelectedEvent } = useEventContext()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [committees, setCommittees] = useState<Array<{ id: number; name: string }>>([])
  
  // Filtros avanzados
  const { filters, updateFilters, clearFilters, hasActiveFilters } = useAdvancedFilters({
    initialFilters: { eventId: Number(eventId) },
    syncWithUrl: true,
    filterKey: 'incidencias_filters'
  })
  
  const { favorites, saveFavorite } = useFilterFavorites('incidencias')
  
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false)
  const [resolveMethod, setResolveMethod] = useState<'direct' | 'delegate'>('direct')
  const [solutionTaskForm, setSolutionTaskForm] = useState<CreateTaskData>({
    title: '',
    description: '',
    due_date: '',
    event_id: Number(eventId),
  })
  const [resolving, setResolving] = useState(false)
  const [eventLeaders, setEventLeaders] = useState<EventParticipant[]>([])
  const [selectedLeaderId, setSelectedLeaderId] = useState<string>('')
  const [isLeaderSelectModalOpen, setIsLeaderSelectModalOpen] = useState(false)
  const [previewLeaderId, setPreviewLeaderId] = useState<string>('')
  
  const navigate = useNavigate()

  // Función para cargar incidencias con filtros
  const loadIncidentsWithFilters = async () => {
    try {
      const params: any = {}
      
      // Aplicar filtros avanzados
      if (filters.committeeIds && filters.committeeIds.length > 0) {
        params.committee_ids = filters.committeeIds
      }
      
      if (filters.statuses && filters.statuses.length > 0) {
        params.statuses = filters.statuses
      }
      
      if (filters.excludeStatuses && filters.excludeStatuses.length > 0) {
        params.exclude_statuses = filters.excludeStatuses
      }
      
      if (filters.dateRange && filters.dateRange !== 'custom') {
        params.date_range = filters.dateRange
      } else if (filters.dateRange === 'custom') {
        if (filters.dateFrom) params.created_from = filters.dateFrom
        if (filters.dateTo) params.created_to = filters.dateTo
      }
      
      const incidentsData = await taskService.getIncidents(params)
      
      // Adaptar datos del backend al formato del componente
      const adaptedIncidents: Incident[] = incidentsData.map((backendIncident) => {
        const reportedBy = backendIncident.reported_by
        let reportedByName = ''
        
        if (typeof reportedBy === 'object' && reportedBy?.name) {
          // Limpiar el nombre, removiendo "- Líder de Semillero" o cualquier variación
          reportedByName = reportedBy.name
            .replace(/\s*-\s*Líder de Semillero/gi, '')
            .replace(/\s*-\s*Líder de semillero/gi, '')
            .trim()
        } else if (typeof reportedBy === 'object' && reportedBy?.id) {
          reportedByName = `Usuario #${reportedBy.id}`
        } else {
          reportedByName = `Usuario #${reportedBy}`
        }
        
        return {
          id: backendIncident.id,
          description: backendIncident.description,
          status: backendIncident.status,
          reported_by: typeof backendIncident.reported_by === 'object' ? backendIncident.reported_by.id : backendIncident.reported_by,
          reported_by_name: reportedByName,
          task_id: backendIncident.task_id,
          created_at: backendIncident.created_at,
          updated_at: backendIncident.updated_at,
          resolved_at: backendIncident.resolved_at,
          solution_task_id: backendIncident.solution_task_id
        }
      })
      
      setIncidents(adaptedIncidents)
    } catch (incidentError) {
      console.error('Error loading incidents:', incidentError)
      toast.error('Error al cargar las incidencias')
    }
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Cargar evento
        const eventResponse = await eventService.getEvent(Number(eventId))
        if (eventResponse.success) {
          setEvent(eventResponse.data)
          setSelectedEvent(eventResponse.data.id, eventResponse.data.name)
        }

        // ============================================
        // CARGAR COMITÉS DEL EVENTO
        // ============================================
        try {
          const committeesResponse = await committeeService.getCommittees({ event_id: Number(eventId) })
          const committeesData = committeesResponse.data || []
          setCommittees(committeesData.map((c: any) => ({ id: c.id, name: c.name })))
        } catch (error) {
          console.warn('Error loading committees:', error)
        }

        // ============================================
        // CARGAR INCIDENCIAS CON FILTROS AVANZADOS
        // ============================================
        await loadIncidentsWithFilters()

      } catch (error) {
        console.error('Error loading event:', error)
        toast.error('Error al cargar el evento')
      } finally {
        setLoading(false)
      }
    }

    loadData()

    return () => {
      clearSelectedEvent()
    }
  }, [eventId, setSelectedEvent, clearSelectedEvent])

  // Recargar incidencias cuando cambien los filtros
  useEffect(() => {
    if (!loading && event) {
      loadIncidentsWithFilters()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  // Filtrar incidencias (solo por búsqueda - los estados ya vienen filtrados del backend)
  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = incident.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  // Estadísticas (solo estados reales del backend)
  const stats = {
    total: incidents.length,
    reported: incidents.filter(i => i.status === 'Reported').length,
    resolved: incidents.filter(i => i.status === 'Resolved').length
  }

  const handleViewDetails = (incident: Incident) => {
    setSelectedIncident(incident)
    setIsDetailsDialogOpen(true)
  }

  const handleOpenResolveDialog = async (incident: Incident) => {
    setSelectedIncident(incident)
    setResolveMethod('direct')
    setIsResolveDialogOpen(true)
    setSelectedLeaderId('')
    
    // Cargar líderes del evento (participantes con rol seedbed_leader)
    try {
      const participantsResponse = await eventService.getEventParticipants(Number(eventId))
      if (participantsResponse.success) {
        // Filtrar solo los líderes de semillero (en el futuro el backend debería hacer esto)
        // Por ahora asumimos que todos los participantes son líderes
        setEventLeaders(participantsResponse.data)
      }
    } catch (error) {
      console.error('Error loading event leaders:', error)
      setEventLeaders([])
    }
  }

  const handleResolveIncident = async () => {
    if (!selectedIncident) return

    try {
      setResolving(true)

      if (resolveMethod === 'direct') {
        // Opción A: Resolver directamente
        await taskService.resolveIncident(selectedIncident.id)
        toast.success('Incidencia resuelta exitosamente')
      } else {
        // Opción B: Crear tarea de solución y vincularla
        if (!solutionTaskForm.title || !solutionTaskForm.description || !solutionTaskForm.due_date) {
          toast.error('Por favor completa todos los campos de la tarea de solución')
          return
        }

        // Crear la tarea de solución
        const newTask = await taskService.createTask({
          ...solutionTaskForm,
          event_id: Number(eventId),
        })

        // Asignar la tarea si se seleccionó un líder
        if (selectedLeaderId && selectedLeaderId !== 'none') {
          await taskService.assignTask(newTask.id, Number(selectedLeaderId))
        }

        // Vincular la tarea de solución con la incidencia
        await taskService.resolveIncident(selectedIncident.id, newTask.id)
        
        toast.success('Tarea de solución creada e incidencia vinculada. La incidencia se resolverá automáticamente cuando se complete la tarea de solución.')
      }

      // Recargar incidencias con los mismos filtros
      await loadIncidentsWithFilters()

      setIsResolveDialogOpen(false)
      setIsDetailsDialogOpen(false)
      
      // Resetear formulario
      setSolutionTaskForm({
        title: '',
        description: '',
        due_date: '',
        event_id: Number(eventId),
      })
      setSelectedLeaderId('')
    } catch (error: any) {
      console.error('Error resolving incident:', error)
      toast.error(error.response?.data?.message || 'Error al resolver la incidencia')
    } finally {
      setResolving(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <DashboardLayout showFooter={false}>
        <DashboardContent
          title="Cargando..."
          description="Panel de gestión de incidencias"
        >
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando incidencias...</p>
            </div>
          </div>
        </DashboardContent>
      </DashboardLayout>
    )
  }

  if (!event) {
    return (
      <DashboardLayout showFooter={false}>
        <DashboardContent
          title="Evento no encontrado"
          description="Panel de gestión de incidencias"
        >
          <div className="container mx-auto py-6">
            <p className="text-center text-muted-foreground">Evento no encontrado</p>
          </div>
        </DashboardContent>
      </DashboardLayout>
    )
  }

  return (
    <PermissionGuard permission="incidents.view">
      <DashboardLayout showFooter={false}>
        <DashboardContent
          title="Gestión de Incidencias"
          description={`Incidencias del evento "${event.name}"`}
        >
          <div className="space-y-6">
            {/* Estadísticas */}
            <div className="grid gap-4 md:grid-cols-5">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Reportadas</CardTitle>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats.reported}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Resueltas</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
                </CardContent>
              </Card>
            </div>

            {/* Controles */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Incidencias Reportadas</CardTitle>
                    <CardDescription>
                      Gestiona y resuelve las incidencias reportadas durante el evento
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Barra de búsqueda y filtros - Cumple con ISO 9241-110 */}
                <div className="flex flex-col gap-4 mb-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Buscar incidencias..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                          aria-label="Buscar incidencias por descripción"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* FiltersBar - Filtros visibles y accesibles */}
                  <FiltersBar
                    filters={filters}
                    onFiltersChange={updateFilters}
                    onClearFilters={clearFilters}
                    committees={committees}
                    statusOptions={[
                      { value: 'Reported', label: 'Reportada' },
                      { value: 'Resolved', label: 'Resuelta' },
                    ]}
                    showCommittees={true}
                    showStatuses={true}
                    showDates={true}
                    dateLabel="Fecha de creación"
                    resultsCount={filteredIncidents.length}
                    totalCount={incidents.length}
                    eventStartDate={event?.start_date}
                    eventEndDate={event?.end_date}
                  />
                </div>

                {/* Tabla de incidencias */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Tarea</TableHead>
                        <TableHead>Reportado por</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredIncidents.map((incident) => {
                        const StatusIcon = statusConfig[incident.status].icon
                        return (
                          <TableRow key={incident.id}>
                            <TableCell className="font-medium">
                              {incident.description}
                            </TableCell>
                            <TableCell>
                              <Badge className={statusConfig[incident.status].color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig[incident.status].label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {incident.task_id ? `Tarea #${incident.task_id}` : 'Sin tarea'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{incident.reported_by_name || `Usuario #${incident.reported_by}`}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{formatDate(incident.created_at)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(incident)}
                              >
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Ver Detalles
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {filteredIncidents.length === 0 && (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No se encontraron incidencias</h3>
                    <p className="text-muted-foreground">
                      {searchTerm || hasActiveFilters
                        ? 'Intenta ajustar los filtros de búsqueda'
                        : 'No hay incidencias reportadas para este evento'
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Dialog de detalles de incidencia */}
          <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Detalles de la Incidencia</DialogTitle>
                <DialogDescription>
                  Información completa y comentarios de la incidencia
                </DialogDescription>
              </DialogHeader>
              {selectedIncident && (
                <div className="space-y-4">
                  <div className="grid gap-4">
                    <div>
                      <Label className="text-sm font-medium">Descripción</Label>
                      <p className="text-sm text-muted-foreground mt-1">{selectedIncident.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Estado</Label>
                        <div className="mt-1">
                          <Badge className={statusConfig[selectedIncident.status].color}>
                            {(() => {
                              const StatusIcon = statusConfig[selectedIncident.status].icon
                              return <StatusIcon className="h-3 w-3 mr-1" />
                            })()}
                            {statusConfig[selectedIncident.status].label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Reportado por</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedIncident.reported_by_name || `Usuario ID: ${selectedIncident.reported_by}`}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Fecha de creación</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatDate(selectedIncident.created_at)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Última actualización</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatDate(selectedIncident.updated_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                  Cerrar
                </Button>
                {selectedIncident && selectedIncident.status === 'Reported' && (
                  <Button onClick={() => {
                    setIsDetailsDialogOpen(false)
                    handleOpenResolveDialog(selectedIncident)
                  }}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Resolver Incidencia
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog de resolución de incidencia */}
          <Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Resolver Incidencia</DialogTitle>
                <DialogDescription>
                  Selecciona cómo deseas resolver esta incidencia
                </DialogDescription>
              </DialogHeader>
              {selectedIncident && (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Incidencia a resolver:</h4>
                    <p className="text-sm text-muted-foreground">{selectedIncident.description}</p>
                  </div>

                  <Tabs value={resolveMethod} onValueChange={(v) => setResolveMethod(v as 'direct' | 'delegate')}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="direct">Resolver Directamente</TabsTrigger>
                      <TabsTrigger value="delegate">Delegar (Crear Tarea de Solución)</TabsTrigger>
                    </TabsList>

                    <TabsContent value="direct" className="space-y-4">
                      <div className="p-4 border rounded-lg bg-blue-50">
                        <p className="text-sm text-blue-900">
                          <strong>Opción A:</strong> Marca la incidencia como resuelta directamente. 
                          La tarea original pasará de <strong>Paused</strong> a <strong>InProgress</strong> (o <strong>Delayed</strong> si ya pasó la fecha).
                        </p>
                      </div>
                    </TabsContent>

                    <TabsContent value="delegate" className="space-y-4">
                      <div className="p-4 border rounded-lg bg-yellow-50">
                        <p className="text-sm text-yellow-900">
                          <strong>Opción B:</strong> Crea una tarea de soporte que será asignada a un líder. 
                          Cuando esa tarea se complete, la incidencia se resolverá automáticamente.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="solution-title">Título de la Tarea de Solución *</Label>
                          <Input
                            id="solution-title"
                            value={solutionTaskForm.title}
                            onChange={(e) => setSolutionTaskForm({ ...solutionTaskForm, title: e.target.value })}
                            placeholder="Ej: Arreglar el formulario de registro"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="solution-description">Descripción *</Label>
                          <Textarea
                            id="solution-description"
                            value={solutionTaskForm.description}
                            onChange={(e) => setSolutionTaskForm({ ...solutionTaskForm, description: e.target.value })}
                            placeholder="Describe qué necesita ser resuelto..."
                            rows={4}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="solution-due-date">Fecha Límite *</Label>
                          <DatePicker
                            selected={solutionTaskForm.due_date ? new Date(solutionTaskForm.due_date) : undefined}
                            onSelect={(date) => {
                              setSolutionTaskForm({ 
                                ...solutionTaskForm, 
                                due_date: date ? format(date, 'yyyy-MM-dd') : '' 
                              })
                            }}
                            placeholder="Seleccionar fecha límite"
                            minDate={event?.start_date ? new Date(event.start_date) : undefined}
                            maxDate={event?.end_date ? new Date(event.end_date) : undefined}
                            disabled={(date) => {
                              // Solo permitir fechas dentro del rango del evento
                              if (event?.start_date) {
                                const startDate = new Date(event.start_date)
                                startDate.setHours(0, 0, 0, 0)
                                if (date < startDate) return true
                              }
                              if (event?.end_date) {
                                const endDate = new Date(event.end_date)
                                endDate.setHours(23, 59, 59, 999)
                                if (date > endDate) return true
                              }
                              return false
                            }}
                          />
                          {event && (
                            <p className="text-xs text-muted-foreground">
                              Período válido: {format(new Date(event.start_date), 'd MMM yyyy')} - {format(new Date(event.end_date), 'd MMM yyyy')}
                            </p>
                          )}
                        </div>

                        <div className="space-y-4 border-t pt-4">
                          <div className="space-y-2">
                            <Label htmlFor="solution-leader">Asignar a Líder del Evento (Opcional)</Label>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  // Al abrir el modal, mostrar el líder seleccionado o el primero disponible
                                  const initialPreview = selectedLeaderId && selectedLeaderId !== 'none'
                                    ? selectedLeaderId
                                    : eventLeaders.length > 0
                                    ? eventLeaders[0].user.id.toString()
                                    : ''
                                  setPreviewLeaderId(initialPreview)
                                  setIsLeaderSelectModalOpen(true)
                                }}
                                className="flex-1 justify-start"
                              >
                                {selectedLeaderId && selectedLeaderId !== 'none' ? (
                                  (() => {
                                    const selectedLeader = eventLeaders.find(
                                      p => p.user.id.toString() === selectedLeaderId
                                    )
                                    if (!selectedLeader) return 'Seleccionar líder...'
                                    const cleanName = selectedLeader.user.name
                                      .replace(/\s*-\s*Líder de Semillero/gi, '')
                                      .replace(/\s*-\s*Líder de semillero/gi, '')
                                      .trim()
                                    return cleanName
                                  })()
                                ) : (
                                  'Seleccionar líder...'
                                )}
                              </Button>
                              {selectedLeaderId && selectedLeaderId !== 'none' && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedLeaderId('')}
                                >
                                  Limpiar
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsResolveDialogOpen(false)} disabled={resolving}>
                  Cancelar
                </Button>
                <Button onClick={handleResolveIncident} disabled={resolving}>
                  {resolving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {resolveMethod === 'direct' ? 'Resolver' : 'Crear Tarea y Resolver'}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Modal para seleccionar líder */}
          <Dialog open={isLeaderSelectModalOpen} onOpenChange={setIsLeaderSelectModalOpen}>
            <DialogContent className="sm:max-w-[900px] max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Seleccionar Líder del Evento</DialogTitle>
                <DialogDescription>
                  Elige un líder para asignar la tarea de solución
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-6 mt-4" style={{ minHeight: '400px' }}>
                {/* Lista de líderes */}
                <div className="w-1/2 border-r pr-4 overflow-y-auto">
                  <div className="space-y-2">
                    <Button
                      variant={!previewLeaderId || previewLeaderId === 'none' ? 'default' : 'outline'}
                      className="w-full justify-start"
                      onClick={() => {
                        setPreviewLeaderId('')
                      }}
                      onMouseEnter={() => {
                        if (previewLeaderId && previewLeaderId !== 'none') {
                          setPreviewLeaderId('')
                        }
                      }}
                    >
                      Sin asignar
                    </Button>
                    {eventLeaders.map((participant) => {
                      const cleanName = participant.user.name
                        .replace(/\s*-\s*Líder de Semillero/gi, '')
                        .replace(/\s*-\s*Líder de semillero/gi, '')
                        .trim()
                      
                      const isSelected = selectedLeaderId === participant.user.id.toString()
                      const isPreviewed = previewLeaderId === participant.user.id.toString()
                      
                      return (
                        <Button
                          key={participant.user.id}
                          variant={isSelected ? 'default' : isPreviewed ? 'secondary' : 'outline'}
                          className="w-full justify-start h-auto py-3"
                          onClick={() => {
                            setPreviewLeaderId(participant.user.id.toString())
                          }}
                          onMouseEnter={() => {
                            if (!isSelected) {
                              setPreviewLeaderId(participant.user.id.toString())
                            }
                          }}
                        >
                          <div className="flex flex-col items-start text-left">
                            <span className="font-medium">{cleanName}</span>
                            <span className="text-xs text-muted-foreground mt-0.5">{participant.user.email}</span>
                          </div>
                        </Button>
                      )
                    })}
                  </div>
                </div>

                {/* Perfil del líder */}
                <div className="w-1/2 pl-4 overflow-y-auto">
                  {previewLeaderId && previewLeaderId !== 'none' && previewLeaderId !== '' ? (
                    (() => {
                      const previewLeader = eventLeaders.find(
                        p => p.user.id.toString() === previewLeaderId
                      )
                      if (!previewLeader) return null
                      
                      const cleanName = previewLeader.user.name
                        .replace(/\s*-\s*Líder de Semillero/gi, '')
                        .replace(/\s*-\s*Líder de semillero/gi, '')
                        .trim()
                      
                      return (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 pb-4 border-b">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{cleanName}</h3>
                              <p className="text-sm text-muted-foreground">Líder de Semillero</p>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs text-muted-foreground uppercase">Email</Label>
                              <p className="text-sm mt-1">{previewLeader.user.email}</p>
                            </div>
                            
                            {previewLeader.user.institution && (
                              <div>
                                <Label className="text-xs text-muted-foreground uppercase">Institución</Label>
                                <p className="text-sm mt-1">
                                  {previewLeader.user.institution.nombre}
                                  {previewLeader.user.institution.identificador && (
                                    <span className="text-muted-foreground"> ({previewLeader.user.institution.identificador})</span>
                                  )}
                                </p>
                              </div>
                            )}
                            
                            <div>
                              <Label className="text-xs text-muted-foreground uppercase">Participante desde</Label>
                              <p className="text-sm mt-1">
                                {new Date(previewLeader.created_at).toLocaleDateString('es-ES', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })()
                  ) : (
                    <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                      <div>
                        <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Selecciona un líder para ver su perfil</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsLeaderSelectModalOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    setSelectedLeaderId(previewLeaderId || 'none')
                    setIsLeaderSelectModalOpen(false)
                  }}
                >
                  {previewLeaderId && previewLeaderId !== 'none' ? 'Confirmar Selección' : 'Sin Asignar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </DashboardContent>
      </DashboardLayout>
    </PermissionGuard>
  )
}
