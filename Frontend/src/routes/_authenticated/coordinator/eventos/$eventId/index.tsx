import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardContent } from '@/components/layout/dashboard-content'
import { useEventContext } from '@/stores/event-context-store'
import { useState, useEffect } from 'react'
import { eventService, type Event } from '@/services/event.service'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, FolderKanban, Calendar, Clock, User } from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'

export const Route = createFileRoute('/_authenticated/coordinator/eventos/$eventId/')({
  component: EventDetailsPage,
})

// Helper para calcular días restantes
function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate)
  const today = new Date()
  const diff = end.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// Helper para formatear fecha
function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

function EventDetailsPage() {
  const { eventId } = Route.useParams()
  const { setSelectedEvent, clearSelectedEvent } = useEventContext()
  const { hasPermission } = usePermissions()
  const navigate = useNavigate()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Cargar evento y activar menú contextual
    const loadEvent = async () => {
      try {
        setLoading(true)
        const response = await eventService.getEvent(Number(eventId))
        if (response.success) {
          setEvent(response.data)
          setSelectedEvent(response.data.id, response.data.name)
        }
      } catch (_error) {
        toast.error('Error al cargar el evento')
      } finally {
        setLoading(false)
      }
    }

    loadEvent()

    // Limpiar al desmontar
    return () => {
      clearSelectedEvent()
    }
  }, [eventId, setSelectedEvent, clearSelectedEvent])

  if (loading) {
    return (
      <DashboardLayout 
        title="Cargando..."
        description="Panel de gestión del evento"
        showFooter={false}
      >
        <DashboardContent>
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando evento...</p>
        </div>
      </div>
        </DashboardContent>
      </DashboardLayout>
    )
  }

  if (!event) {
    return (
      <DashboardLayout 
        title="Evento no encontrado"
        description="Panel de gestión del evento"
        showFooter={false}
      >
        <DashboardContent>
      <div className="container mx-auto py-6">
        <p className="text-center text-muted-foreground">Evento no encontrado</p>
      </div>
        </DashboardContent>
      </DashboardLayout>
    )
  }

  const daysRemaining = getDaysRemaining(event.end_date)

  return (
    <PermissionGuard permission="events.view">
      <DashboardLayout 
        title={event.name}
        description="Panel de gestión del evento"
        showFooter={true}
      >
        <DashboardContent>
          <div className="space-y-6">
            {/* Hero Card del Evento */}
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4">
                  {/* Título y Badge de Estado */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold mb-2">{event.name}</h2>
                      <p className="text-muted-foreground">{event.description}</p>
                    </div>
                    <Badge variant="secondary" className="text-base px-4 py-2">
                      {daysRemaining > 0 ? `${daysRemaining} días restantes` : 'Finalizado'}
                    </Badge>
                  </div>

                  {/* Información del Evento */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Fecha de Inicio</p>
                        <p className="text-sm text-muted-foreground">{formatDate(event.start_date)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Fecha de Fin</p>
                        <p className="text-sm text-muted-foreground">{formatDate(event.end_date)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Coordinador</p>
                        <p className="text-sm text-muted-foreground">{event.coordinator?.name || 'No asignado'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Métricas del Evento */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Métrica: Comités */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">Comités</CardTitle>
                  <FolderKanban className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{event.committees_count}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {event.committees_count === 1 ? 'Comité creado' : 'Comités creados'}
                  </p>
                </CardContent>
              </Card>

              {/* Métrica: Participantes */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">Participantes</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{event.participants_count}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Líderes de semillero
                  </p>
                </CardContent>
              </Card>

              {/* Métrica: Tareas Totales (Placeholder) */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">Tareas Totales</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    En el banco de tareas
                  </p>
                </CardContent>
              </Card>

              {/* Métrica: Días Restantes */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">Días Restantes</CardTitle>
                  <Clock className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{daysRemaining > 0 ? daysRemaining : 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {daysRemaining > 0 ? 'Hasta el final del evento' : 'Evento finalizado'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Accesos Rápidos */}
            <Card>
              <CardHeader>
                <CardTitle>Gestión del Evento</CardTitle>
                <CardDescription>
                  Accede rápidamente a las diferentes áreas de gestión
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Tarjeta Participantes */}
                  {hasPermission('events.manage_participants') && (
                    <Card 
                      className="hover:shadow-md transition-all cursor-pointer border-2 hover:border-primary/50"
                      onClick={() => navigate({ to: `/coordinator/eventos/${eventId}/participantes` })}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Participantes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          Gestiona los líderes de semillero participantes en este evento
                        </p>
                        <Button size="sm" className="w-full">
                          Ver Participantes
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {/* Tarjeta Comités */}
                  {hasPermission('events.committees.manage') && (
                    <Card 
                      className="hover:shadow-md transition-all cursor-pointer border-2 hover:border-primary/50"
                      onClick={() => navigate({ to: `/coordinator/eventos/${eventId}/comites` })}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FolderKanban className="h-5 w-5" />
                          Comités
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          Crea y gestiona los comités de trabajo del evento
                        </p>
                        <Button size="sm" className="w-full">
                          Ver Comités
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
      </div>
        </DashboardContent>
      </DashboardLayout>
    </PermissionGuard>
  )
}
