import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Calendar, Users, CheckCircle, Clock, Info, Eye } from 'lucide-react'
import { eventService, Event } from '@/services/event.service'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { toast } from 'sonner'

const statusLabels: Record<string, string> = {
  'planificación': 'Planificación',
  'en_progreso': 'En Progreso',
  'finalizado': 'Finalizado',
  'cancelado': 'Cancelado',
  'active': 'Activo',
  'inactive': 'Inactivo',
  'finished': 'Finalizado'
}

const statusColors: Record<string, 'secondary' | 'default' | 'outline' | 'destructive'> = {
  'planificación': 'secondary',
  'en_progreso': 'default',
  'finalizado': 'outline',
  'cancelado': 'destructive',
  'active': 'default',
  'inactive': 'secondary',
  'finished': 'outline'
}


export function EventosSeedbedLeader() {
  const { user } = useAuth()
  const { hasPermission } = usePermissions()
  const [eventosDisponibles, setEventosDisponibles] = useState<Event[]>([])
  const [misEventos, setMisEventos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [participando, setParticipando] = useState<number | null>(null)
  const [eventoSeleccionado, setEventoSeleccionado] = useState<Event | null>(null)
  const [modalDetallesAbierto, setModalDetallesAbierto] = useState(false)

  // Cargar eventos disponibles
  const cargarEventosDisponibles = async () => {
    try {
      const response = await eventService.getAvailableEvents()
      if (response.success) {
        setEventosDisponibles(response.data)
      }
    } catch (error) {
      console.error('Error al cargar eventos disponibles:', error)
    }
  }

  // Cargar mis participaciones
  const cargarMisEventos = async () => {
    try {
      const response = await eventService.getEvents({
        institution_id: user?.institution_id
      })
      
      if (response.success) {
        // Filtrar solo los eventos donde el usuario ha solicitado participar
        // Por ahora mostramos todos, pero idealmente deberíamos filtrar
        setMisEventos(response.data)
      }
    } catch (error) {
      console.error('Error al cargar mis eventos:', error)
    }
  }

  // Cargar todos los datos
  const cargarDatos = async () => {
    try {
      setLoading(true)
      await Promise.all([
        cargarEventosDisponibles(),
        cargarMisEventos()
      ])
    } catch (error) {
      console.error('Error al cargar datos:', error)
      toast.error('Error al cargar los eventos')
    } finally {
      setLoading(false)
    }
  }

  // Participar en un evento (aprobación automática)
  const solicitarParticipacion = async (eventoId: number) => {
    try {
      setParticipando(eventoId)
      const response = await eventService.participateInEvent(eventoId)
      
      if (response.success) {
        toast.success('¡Tu participación ha sido registrada exitosamente!')
        await cargarDatos() // Recargar datos
      }
    } catch (error: any) {
      console.error('Error al solicitar participación:', error)
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else if (error.response?.data?.errors) {
        const errors = error.response.data.errors
        const firstError = Object.values(errors)[0] as string[]
        toast.error(firstError[0])
      } else {
        toast.error('Error al solicitar participación')
      }
    } finally {
      setParticipando(null)
    }
  }

  // Ver detalles del evento
  const verDetalles = (evento: Event) => {
    setEventoSeleccionado(evento)
    setModalDetallesAbierto(true)
  }

  // Cerrar modal de detalles
  const cerrarDetalles = () => {
    setModalDetallesAbierto(false)
    setEventoSeleccionado(null)
  }

  useEffect(() => {
    if (user) {
      cargarDatos()
    }
  }, [user])

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
      <Tabs defaultValue="disponibles" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="disponibles">
            Eventos Disponibles
          </TabsTrigger>
          <TabsTrigger value="mis-eventos">
            Mis Participaciones
          </TabsTrigger>
        </TabsList>

        {/* Tab de Eventos Disponibles */}
        <TabsContent value="disponibles" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Eventos Disponibles para Participar
              </CardTitle>
              <CardDescription>
                Eventos de tu institución en los que puedes solicitar participación
              </CardDescription>
            </CardHeader>
            <CardContent>
              {eventosDisponibles.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No hay eventos disponibles</h3>
                  <p className="text-muted-foreground">
                    No hay eventos disponibles para participar en este momento.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {eventosDisponibles.map((evento) => (
                    <Card key={evento.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg line-clamp-2">
                            {evento.name}
                          </CardTitle>
                          <Badge variant={statusColors[evento.status as keyof typeof statusColors] || 'default'}>
                            {statusLabels[evento.status as keyof typeof statusLabels]}
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
                            {new Date(evento.start_date).toLocaleDateString('es-ES')} - {new Date(evento.end_date).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{evento.participants_count} participantes</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Info className="h-4 w-4" />
                          <span className="line-clamp-1">
                            Coordinador: {evento.coordinator?.name}
                          </span>
                        </div>
                        
                        {hasPermission('events.participate') && (
                          <Button
                            className="w-full mt-2"
                            onClick={() => solicitarParticipacion(evento.id)}
                            disabled={participando === evento.id}
                          >
                            {participando === evento.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Registrando...
                              </>
                            ) : (
                              'Participar en Evento'
                            )}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Mis Participaciones */}
        <TabsContent value="mis-eventos" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Mis Eventos Activos
              </CardTitle>
              <CardDescription>
                Eventos en los que estás participando actualmente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {misEventos.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No tienes eventos activos</h3>
                  <p className="text-muted-foreground">
                    Aún no estás participando en ningún evento.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {misEventos.map((evento) => (
                    <Card key={evento.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg line-clamp-2">
                            {evento.name}
                          </CardTitle>
                          <Badge variant={statusColors[evento.status as keyof typeof statusColors] || 'default'}>
                            {statusLabels[evento.status as keyof typeof statusLabels]}
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
                        
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-green-600 font-medium">
                            Participando
                          </span>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => verDetalles(evento)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Información
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Detalles del Evento */}
      <Dialog open={modalDetallesAbierto} onOpenChange={cerrarDetalles}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Información del Evento</DialogTitle>
            <DialogDescription>
              Detalles completos del evento seleccionado
            </DialogDescription>
          </DialogHeader>
          {eventoSeleccionado && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold mb-2">{eventoSeleccionado.name}</h3>
                <p className="text-muted-foreground">{eventoSeleccionado.description}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Fecha de Inicio</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(eventoSeleccionado.start_date).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Fecha de Fin</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(eventoSeleccionado.end_date).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Coordinador</p>
                      <p className="text-sm text-muted-foreground">
                        {eventoSeleccionado.coordinator?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Participantes</p>
                      <p className="text-sm text-muted-foreground">
                        {eventoSeleccionado.participants_count} líderes de semillero
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Estado</p>
                      <Badge variant={statusColors[eventoSeleccionado.status]} className="mt-1">
                        {statusLabels[eventoSeleccionado.status]}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-base">Tu Participación</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-600 font-medium">
                      Estás participando en este evento
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    El coordinador del evento podrá asignarte a un comité de trabajo. 
                    Revisa el menú lateral para ver tu comité asignado.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
