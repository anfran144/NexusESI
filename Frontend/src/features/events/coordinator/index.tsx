import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Calendar, Users, Eye, Settings } from 'lucide-react'
import { EventForm } from './components/event-form'
import { EventDetails } from './components/event-details'
import { eventService, Event } from '@/services/event.service'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { useEventContext } from '@/stores/event-context-store'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

const statusLabels = {
  'planificación': 'Planificación',
  'en_progreso': 'En Progreso',
  'finalizado': 'Finalizado',
  'cancelado': 'Cancelado'
}

const statusColors = {
  'planificación': 'secondary' as const,
  'en_progreso': 'default' as const,
  'finalizado': 'outline' as const,
  'cancelado': 'destructive' as const
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
        await cargarEventos() // Recargar la lista
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
  const verDetalles = (evento: Event) => {
    setEventoSeleccionado(evento)
    setSelectedEvent(evento.id, evento.name) // Activar menú contextual
    setModalDetallesAbierto(true)
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
    clearSelectedEvent() // Desactivar menú contextual
  }

  // Cargar eventos al montar el componente
  useEffect(() => {
    if (user) {
      cargarEventos()
    }
  }, [user, cargarEventos])

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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Gestión de Eventos
            </CardTitle>
            {hasPermission('events.create') && (
              <Button 
                onClick={() => setModalFormularioAbierto(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Crear Evento
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {eventos.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay eventos</h3>
              <p className="text-muted-foreground mb-4">
                Aún no has creado ningún evento. Comienza creando tu primer evento.
              </p>
              {hasPermission('events.create') && (
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {eventos.map((evento) => (
                <Card key={evento.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-2">
                        {evento.name}
                      </CardTitle>
                      <Badge variant={statusColors[evento.status]}>
                        {statusLabels[evento.status]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {evento.description}
                    </p>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(evento.start_date).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{evento.participants_count} participantes</span>
                      </div>
                    </div>
                    
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
        </CardContent>
      </Card>

      {/* Modal para crear evento */}
      <Dialog open={modalFormularioAbierto} onOpenChange={setModalFormularioAbierto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Evento</DialogTitle>
          </DialogHeader>
          <EventForm
            onSubmit={crearEvento}
            onCancel={() => setModalFormularioAbierto(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal para ver detalles */}
      <Dialog open={modalDetallesAbierto} onOpenChange={cerrarDetalles}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalles del Evento</DialogTitle>
          </DialogHeader>
          {eventoSeleccionado && (
            <EventDetails event={eventoSeleccionado} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}