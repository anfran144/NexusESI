import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Plus, 
  Calendar, 
  Eye, 
  Settings, 
  Search,
  Clock,
  Play,
  CheckCircle,
  HelpCircle,
  Download,
  Grid3X3,
  List
} from 'lucide-react'
import { EventForm } from './components/event-form'
import { EventDetails } from './components/event-details'
import { eventService, Event } from '@/services/event.service'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { useEventContext } from '@/stores/event-context-store'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const statusLabels = {
  'active': 'Activo',
  'inactive': 'Inactivo',
  'finished': 'Finalizado'
}

const statusColors = {
  'active': 'default' as const,
  'inactive': 'secondary' as const,
  'finished': 'outline' as const
}

// Componente StatusIndicator
const StatusIndicator = ({ status }: { status: string }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { 
          icon: Play, 
          color: 'text-green-500', 
          bg: 'bg-green-50',
          label: 'Activo'
        }
      case 'inactive':
        return { 
          icon: Clock, 
          color: 'text-yellow-500', 
          bg: 'bg-yellow-50',
          label: 'Inactivo'
        }
      case 'finished':
        return { 
          icon: CheckCircle, 
          color: 'text-blue-500', 
          bg: 'bg-blue-50',
          label: 'Finalizado'
        }
      default:
        return { 
          icon: HelpCircle, 
          color: 'text-gray-500', 
          bg: 'bg-gray-50',
          label: 'Desconocido'
        }
    }
  }
  
  const config = getStatusConfig(status)
  const Icon = config.icon
  
  return (
    <div className={`p-2 rounded-full ${config.bg}`}>
      <Icon className={`h-4 w-4 ${config.color}`} />
    </div>
  )
}

// Helper functions
const getDaysRemaining = (endDate: string): number => {
  const end = new Date(endDate)
  const now = new Date()
  const diffTime = end.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const getStatusVariant = (status: string) => {
  return statusColors[status as keyof typeof statusColors] || 'outline'
}

const getStatusLabel = (status: string) => {
  return statusLabels[status as keyof typeof statusLabels] || status
}

export function EventosCoordinator() {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const { setSelectedEvent, clearSelectedEvent } = useEventContext()
  const navigate = useNavigate()
  const [eventos, setEventos] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [modalFormularioAbierto, setModalFormularioAbierto] = useState(false)
  const [modalDetallesAbierto, setModalDetallesAbierto] = useState(false)
  const [eventoSeleccionado, setEventoSeleccionado] = useState<Event | null>(null)
  const [cargandoDetalles, setCargandoDetalles] = useState(false)
  
  // Estados para filtros y búsqueda
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  // Cargar eventos desde la API
  // useCallback previene recreación de función en cada render
  const cargarEventos = useCallback(async () => {
    if (!user) return
    
    try {
      setLoading(true)
      // NO enviar institution_id - el backend filtra automáticamente por rol
      const response = await eventService.getEvents()
      
      if (response.success) {
        setEventos(response.data)
      } else {
        toast.error('Error al cargar los eventos')
      }
    } catch (error: any) {
      console.error('Error al cargar eventos:', error)
      
      // Manejo específico de errores
      if (error.response?.status === 403) {
        toast.error('No tienes permisos para ver eventos. Contacta al administrador.')
      } else if (error.response?.status === 401) {
        toast.error('Sesión expirada. Por favor inicia sesión nuevamente.')
      } else {
        toast.error('Error al conectar con el servidor')
      }
    } finally {
      setLoading(false)
    }
  }, [user])

  // Crear nuevo evento
  const crearEvento = async (data: any) => {
    try {
      const eventData = {
        ...data,
        coordinator_id: user?.id,
        institution_id: user?.institution_id,
        status: 'planificación' as const
      }

      const response = await eventService.createEvent(eventData)
      
      if (response.success) {
        toast.success('Evento creado exitosamente')
        setModalFormularioAbierto(false)
        await cargarEventos() // Recargar la lista con datos actualizados
      } else {
        toast.error('Error al crear el evento')
      }
    } catch (error: any) {
      console.error('Error al crear evento:', error)
      
      // Manejar errores de validación
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors
        const firstError = Object.values(errors)[0] as string[]
        toast.error(firstError[0] || 'Error de validación')
      } else {
        toast.error('Error al crear el evento')
      }
    }
  }

  // Ver detalles del evento y activar menú contextual
  const verDetalles = async (evento: Event) => {
    setSelectedEvent(evento.id, evento.name) // Activar menú contextual
    setModalDetallesAbierto(true)
    setCargandoDetalles(true)
    
    try {
      // Obtener datos frescos del evento desde la API
      const response = await eventService.getEvent(evento.id)
      
      if (response.success) {
        setEventoSeleccionado(response.data)
      } else {
        toast.error('Error al cargar los detalles del evento')
        // Usar datos del evento de la lista como fallback
        setEventoSeleccionado(evento)
      }
    } catch (error: any) {
      console.error('Error al cargar detalles del evento:', error)
      toast.error('Error al conectar con el servidor')
      // Usar datos del evento de la lista como fallback
      setEventoSeleccionado(evento)
    } finally {
      setCargandoDetalles(false)
    }
  }
  
  // Gestionar evento - redirige al panel de gestión
  const gestionarEvento = (evento: Event) => {
    setSelectedEvent(evento.id, evento.name) // Activar menú contextual
    navigate({ to: `/coordinator/eventos/${evento.id}` })
  }
  
  // Cerrar detalles y desactivar menú contextual
  const cerrarDetalles = () => {
    setModalDetallesAbierto(false)
    setEventoSeleccionado(null)
    setCargandoDetalles(false)
    clearSelectedEvent() // Desactivar menú contextual
  }

  // Cargar eventos al montar el componente
  useEffect(() => {
    if (user) {
      cargarEventos()
    }
  }, [user, cargarEventos])

  // Filtrar y ordenar eventos
  const filteredEventos = eventos
    .filter(evento => {
      // Filtro por búsqueda
      if (searchQuery && !evento.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      
      // Filtro por estado (usar claves del backend: active|inactive|finished)
      if (statusFilter !== 'all' && evento.status !== statusFilter) {
        return false
      }
      
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'start_date':
          return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        case 'end_date':
          return new Date(a.end_date).getTime() - new Date(b.end_date).getTime()
        case 'progress':
          return (a.progress || 0) - (b.progress || 0)
        case 'participants':
          return a.participants_count - b.participants_count
        default:
          return 0
      }
    })

  // Función para exportar datos
  const exportData = () => {
    const csvContent = [
      ['Nombre', 'Estado', 'Fecha Inicio', 'Fecha Fin', 'Participantes', 'Comités', 'Progreso'].join(','),
      ...filteredEventos.map(evento => [
        evento.name,
        getStatusLabel(evento.status),
        formatDate(evento.start_date),
        formatDate(evento.end_date),
        evento.participants_count,
        evento.committees_count,
        evento.progress || 0
      ].join(','))
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'eventos.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando eventos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con filtros y búsqueda */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Gestión de Eventos
            </CardTitle>
            <div className="flex items-center gap-2">
              {hasPermission('events.create') && (
                <Button 
                  onClick={() => setModalFormularioAbierto(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Crear Evento
                </Button>
              )}
              <Button 
                variant="outline"
                onClick={exportData}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros y búsqueda */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar eventos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Filtros */}
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                  <SelectItem value="finished">Finalizado</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nombre</SelectItem>
                  <SelectItem value="start_date">Fecha de inicio</SelectItem>
                  <SelectItem value="end_date">Fecha de fin</SelectItem>
                  <SelectItem value="progress">Progreso</SelectItem>
                  <SelectItem value="participants">Participantes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Vista de eventos */}
          {filteredEventos.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {eventos.length === 0 ? 'No hay eventos' : 'No se encontraron eventos'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {eventos.length === 0 
                  ? 'Aún no has creado ningún evento. Comienza creando tu primer evento.'
                  : 'Intenta ajustar los filtros de búsqueda.'
                }
              </p>
              {hasPermission('events.create') && eventos.length === 0 && (
                <Button 
                  onClick={() => setModalFormularioAbierto(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Crear Primer Evento
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Seleccionador de vistas */}
              <div className="mb-6 flex items-center justify-end">
                <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode("cards")}
                    className={cn("gap-2", viewMode === "cards" && "bg-accent text-accent-foreground")}
                  >
                    <Grid3X3 className="h-4 w-4" />
                    Tarjetas
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode("table")}
                    className={cn("gap-2", viewMode === "table" && "bg-accent text-accent-foreground")}
                  >
                    <List className="h-4 w-4" />
                    Tabla
                  </Button>
                </div>
              </div>

              {/* Contenido de las vistas */}
              {viewMode === "cards" && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredEventos.map((evento) => (
                    <Card key={evento.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg line-clamp-2">
                              {evento.name}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                              <Badge variant={getStatusVariant(evento.status)}>
                                {getStatusLabel(evento.status)}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {getDaysRemaining(evento.end_date)} días restantes
                              </Badge>
                            </div>
                          </div>
                          <StatusIndicator status={evento.status} />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Descripción */}
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {evento.description}
                        </p>
                        
                        {/* Fechas */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Inicio: {formatDate(evento.start_date)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Fin: {formatDate(evento.end_date)}</span>
                          </div>
                        </div>
                        
                        {/* Progreso */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span>Progreso</span>
                            <span>{evento.progress || 0}%</span>
                          </div>
                          <Progress value={evento.progress || 0} className="h-2" />
                        </div>
                        
                        {/* Estadísticas */}
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <div className="font-semibold">{evento.participants_count}</div>
                            <div className="text-muted-foreground">Participantes</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold">{evento.committees_count}</div>
                            <div className="text-muted-foreground">Comités</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold">{evento.tasks_completed || 0}</div>
                            <div className="text-muted-foreground">Tareas</div>
                          </div>
                        </div>
                        
                        {/* Acciones */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => verDetalles(evento)}
                            className="flex-1"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver Detalles
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => gestionarEvento(evento)}
                            className="flex-1"
                          >
                            <Settings className="h-4 w-4 mr-1" />
                            Gestionar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {viewMode === "table" && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Evento</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fechas</TableHead>
                      <TableHead>Progreso</TableHead>
                      <TableHead>Participantes</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEventos.map((evento) => (
                      <TableRow key={evento.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{evento.name}</div>
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {evento.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StatusIndicator status={evento.status} />
                            <Badge variant={getStatusVariant(evento.status)}>
                              {getStatusLabel(evento.status)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{formatDate(evento.start_date)}</div>
                            <div className="text-muted-foreground">{formatDate(evento.end_date)}</div>
                            <div className="text-xs text-muted-foreground">
                              {getDaysRemaining(evento.end_date)} días restantes
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">{evento.progress || 0}%</div>
                            <Progress value={evento.progress || 0} className="h-2 w-20" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{evento.participants_count} participantes</div>
                            <div className="text-muted-foreground">{evento.committees_count} comités</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm" onClick={() => verDetalles(evento)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" onClick={() => gestionarEvento(evento)}>
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal para crear evento */}
      <Dialog open={modalFormularioAbierto} onOpenChange={setModalFormularioAbierto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Evento</DialogTitle>
            <DialogDescription>
              Completa los datos para crear un nuevo evento
            </DialogDescription>
          </DialogHeader>
          <EventForm
            onSubmit={crearEvento}
            onCancel={() => setModalFormularioAbierto(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal para ver detalles */}
      <Dialog open={modalDetallesAbierto} onOpenChange={cerrarDetalles}>
        <DialogContent className="max-w-6xl max-h-[90vh] w-[95vw] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Detalles del Evento</DialogTitle>
            <DialogDescription>
              Información completa del evento seleccionado
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            {cargandoDetalles ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Cargando detalles del evento...</p>
                </div>
              </div>
            ) : eventoSeleccionado ? (
              <EventDetails event={eventoSeleccionado as any} />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No se pudo cargar la información del evento</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}