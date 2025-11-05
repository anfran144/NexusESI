import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardContent } from '@/components/layout/dashboard-content'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Calendar, 
  ArrowRight, 
  CheckCircle,
  Target,
  BookOpen,
  Zap,
  Users
} from 'lucide-react'
import { seedbedLeaderService, type Event } from '@/services/seedbed-leader-service'
import { toast } from 'sonner'
import { useNavigate } from '@tanstack/react-router'

export function SeedbedLeaderDashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [joiningEvent, setJoiningEvent] = useState<number | null>(null)
  const [hasActiveEvent, setHasActiveEvent] = useState(false)
  const [activeEvent, setActiveEvent] = useState<Event | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const dashboardData = await seedbedLeaderService.getDashboard()
      
      console.log('Dashboard data received:', dashboardData)
      console.log('Available events:', dashboardData.available_events)
      console.log('Has active event:', dashboardData.has_active_event)
      
      if (dashboardData.has_active_event && dashboardData.active_event) {
        setHasActiveEvent(true)
        setActiveEvent(dashboardData.active_event)
        setEvents([]) // No mostrar eventos si tiene uno activo
      } else {
        setHasActiveEvent(false)
        setActiveEvent(null)
        setEvents(dashboardData.available_events)
        console.log('Setting events to:', dashboardData.available_events)
      }
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error)
      toast.error('Error al cargar los datos del dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinEvent = async (eventId: number) => {
    try {
      setJoiningEvent(eventId)
      await seedbedLeaderService.participateInEvent(eventId)
      toast.success('Te has unido al evento exitosamente')
      // Recargar datos del dashboard para actualizar el estado
      await loadDashboardData()
      // Forzar actualización del sidebar
      window.location.reload()
    } catch (error: any) {
      console.error('Error uniéndose al evento:', error)
      toast.error(error.response?.data?.message || 'Error al unirse al evento')
    } finally {
      setJoiningEvent(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Activo</Badge>
      case 'inactive':
        return <Badge variant="secondary">Inactivo</Badge>
      case 'finished':
        return <Badge variant="outline">Finalizado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const isEventJoinable = (event: Event) => {
    return event.status === 'active' || event.status === 'inactive'
  }

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardContent
          title="Panel de Liderazgo"
          description={`¡Bienvenido, ${user?.name || 'Líder'}! Gestiona tu semillero y coordina las actividades de tu equipo.`}
        >
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Cargando eventos...</p>
            </div>
          </div>
        </DashboardContent>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <DashboardContent
        title="Panel de Control"
        description={`¡Bienvenido, ${user?.name || 'Líder'}!`}
      >
        <div className="space-y-6">
          {/* Estado del Evento Activo - Versión Simplificada */}
          {hasActiveEvent && activeEvent && (
            <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-green-800">Evento Activo</CardTitle>
                      <CardDescription className="text-green-700">
                        Participando en: <strong>{activeEvent.name}</strong>
                      </CardDescription>
                    </div>
                  </div>
                  <Button 
                    onClick={() => navigate({ to: '/seedbed-leader/mi-evento' })}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Ver Mi Evento
                  </Button>
                </div>
              </CardHeader>
            </Card>
          )}

          {/* Estado Sin Evento Activo - Versión Simplificada */}
          {!hasActiveEvent && (
            <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-sky-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-blue-800">Sin Evento Activo</CardTitle>
                      <CardDescription className="text-blue-700">
                        No estás participando en ningún evento actualmente
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )}

          {/* Acciones Rápidas - Versión Simplificada */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Acciones Rápidas
              </CardTitle>
              <CardDescription>
                Accede rápidamente a las funciones principales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => navigate({ to: '/seedbed-leader/mis-tareas' })}
                >
                  <Target className="w-6 h-6" />
                  <span className="text-sm">Mis Tareas</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => navigate({ to: '/seedbed-leader/mi-evento' })}
                  disabled={!hasActiveEvent}
                >
                  <Calendar className="w-6 h-6" />
                  <span className="text-sm">Mi Evento</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => navigate({ to: '/seedbed-leader/tareas-comite' })}
                  disabled={!hasActiveEvent}
                >
                  <Users className="w-6 h-6" />
                  <span className="text-sm">Tareas del Comité</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center gap-2"
                >
                  <BookOpen className="w-6 h-6" />
                  <span className="text-sm">Recursos</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de eventos disponibles - Solo si NO tiene evento activo */}
          {!hasActiveEvent && events && events.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Eventos Disponibles
                </CardTitle>
                <CardDescription>
                  Eventos de tu institución disponibles para participar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {events.map((event) => (
                    <div 
                      key={event.id} 
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <h3 className="font-semibold">{event.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {event.institution.nombre} • {event.participants_count} participantes
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(event.status)}
                        {isEventJoinable(event) && (
                          <Button 
                            size="sm"
                            onClick={() => handleJoinEvent(event.id)}
                            disabled={joiningEvent === event.id}
                          >
                            {joiningEvent === event.id ? 'Uniéndose...' : 'Unirse'}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mensaje cuando no hay eventos */}
          {!hasActiveEvent && (!events || events.length === 0) && (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay eventos disponibles</h3>
                <p className="text-muted-foreground">
                  No hay eventos activos en tu institución en este momento.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardContent>
    </DashboardLayout>
  )
}