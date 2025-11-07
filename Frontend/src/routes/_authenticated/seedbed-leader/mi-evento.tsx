import { createFileRoute, Outlet, useLocation } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardContent } from '@/components/layout/dashboard-content'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Calendar, 
  MapPin, 
  Users, 
  User, 
  Mail, 
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Activity,
  Target,
  Award,
  BookOpen,
  MessageSquare,
  FileText,
  BarChart3
} from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { seedbedLeaderService, type Event } from '@/services/seedbed-leader-service'
import { taskService } from '@/services/taskService'
import { eventService } from '@/services/event.service'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/seedbed-leader/mi-evento')({
  component: MiEventoComponent,
  // La ruta de calendario es independiente, no necesita Outlet
})

function MiEventoComponent() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [activeEvent, setActiveEvent] = useState<Event | null>(null)
  const [myTasks, setMyTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [teamProgress, setTeamProgress] = useState<number>(0)

  // Verificar si estamos en una ruta hija (debe ser antes de cualquier return)
  const isChildRoute = location.pathname.includes('/calendario')

  useEffect(() => {
    loadActiveEvent()
  }, [])

  // ============================================
  // FUNCIÓN DE CARGA DEL EVENTO ACTIVO
  // ============================================
  const loadActiveEvent = async () => {
    try {
      setLoading(true)
        const eventData = await seedbedLeaderService.getActiveEvent()
        setActiveEvent(eventData)
        
      // Cargar mis tareas reales y filtrar por el evento activo
        if (eventData && user?.id) {
          const tasksResponse = await taskService.getTasks({ assigned_to_id: user.id })
          const tasks = Array.isArray(tasksResponse) ? tasksResponse : ((tasksResponse as any).data || [])
        const tasksForActiveEvent = tasks.filter((t: any) => t?.committee?.event?.id === eventData.id)
        setMyTasks(tasksForActiveEvent)
        
        // Cargar estadísticas del evento (progreso del equipo)
        try {
          const statsResponse = await eventService.getEventStatistics(eventData.id)
          const stats = statsResponse.data
          setTeamProgress(Math.round(stats.progress_percentage))
        } catch (statsError) {
          console.warn('No se pudieron cargar las estadísticas del evento:', statsError)
          setTeamProgress(0)
        }
      }
    } catch (error: any) {
      if (error?.response?.status === 404) {
        // No hay evento activo para el usuario (respuesta real del backend)
        setActiveEvent(null)
      } else {
      console.error('Error cargando evento activo:', error)
      toast.error('Error al cargar el evento activo')
      setActiveEvent(null)
      }
    } finally {
      setLoading(false)
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Calcular métricas reales desde mis tareas
  const myTasksCompleted = myTasks.filter(task => task.status === 'Completed').length
  const myTasksPending = myTasks.filter(task => task.status === 'InProgress' || task.status === 'Paused').length
  const participationScore = myTasks.length > 0 ? Math.round((myTasksCompleted / myTasks.length) * 100) : 0
  
  // Obtener información contextual del tiempo del evento
  const timeInfo = activeEvent?.time_info || (activeEvent ? {
    message: activeEvent.status === 'finished' 
      ? 'Evento finalizado' 
      : activeEvent.status === 'inactive'
        ? 'Evento en pausa'
        : `${Math.ceil((new Date(activeEvent.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} días restantes`,
    days: activeEvent ? Math.ceil((new Date(activeEvent.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null,
    is_overdue: false,
    is_urgent: false
  } : null)
  const daysRemaining = timeInfo?.days ?? 0
  
  // Encontrar próxima fecha límite
  const upcomingTasks = myTasks
    .filter(task => task.status !== 'Completed' && new Date(task.due_date) > new Date())
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
  const nextDeadline = upcomingTasks.length > 0 ? upcomingTasks[0].due_date : null

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardContent
          title="Mi Evento"
          description="Cargando información del evento..."
        >
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Cargando evento...</p>
            </div>
          </div>
        </DashboardContent>
      </DashboardLayout>
    )
  }

  if (!activeEvent) {
    return (
      <DashboardLayout>
        <DashboardContent
          title="Mi Evento"
          description="No tienes un evento activo"
        >
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay evento activo</h3>
              <p className="text-muted-foreground mb-4">
                No estás participando en ningún evento en este momento.
              </p>
            </CardContent>
          </Card>
        </DashboardContent>
      </DashboardLayout>
    )
  }

  // Si estamos en una ruta hija, solo renderizar el Outlet
  if (isChildRoute) {
    return <Outlet />
  }
  
  // Si no, mostrar el contenido principal
  return (
    <DashboardLayout>
      <DashboardContent
        title="Mi Evento"
        description={`Participando en: ${activeEvent.name}`}
      >
        <div className="space-y-8">
          {/* Header del Evento */}
          <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-2xl text-green-800">{activeEvent.name}</CardTitle>
                    <Badge variant="default" className="bg-green-500">Activo</Badge>
                  </div>
                  <CardDescription className="text-lg text-green-700">
                    {activeEvent.description}
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => navigate({ to: '/seedbed-leader' })}
                  className="border-green-300 text-green-700 hover:bg-green-100"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al Panel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-800">Fechas del Evento</p>
                    <p className="text-sm text-green-700">
                      {formatDate(activeEvent.start_date)} - {formatDate(activeEvent.end_date)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-800">Institución</p>
                    <p className="text-sm text-green-700">{activeEvent.institution.nombre}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-800">Participantes</p>
                    <p className="text-sm text-green-700">{activeEvent.participants_count} miembros</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Métricas de Mi Participación */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Mis Tareas Completadas</p>
                    <p className="text-2xl font-bold text-blue-800">{myTasksCompleted}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-100">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">Tareas Pendientes</p>
                    <p className="text-2xl font-bold text-orange-800">{myTasksPending}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-orange-100">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Progreso del Equipo</p>
                    <p className="text-2xl font-bold text-purple-800">{teamProgress}%</p>
                  </div>
                  <div className="p-2 rounded-lg bg-purple-100">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Días Restantes</p>
                    <p className="text-2xl font-bold text-green-800">{daysRemaining}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-green-100">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progreso Personal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Mi Progreso en el Evento
              </CardTitle>
              <CardDescription>
                Seguimiento de tu participación y rendimiento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Progreso Personal</span>
                    <span className="font-medium">{participationScore}%</span>
                  </div>
                  <Progress value={participationScore} className="h-3" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <div className="text-lg font-bold text-green-600">{myTasksCompleted}</div>
                    <div className="text-sm text-muted-foreground">Tareas Completadas</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <div className="text-lg font-bold text-orange-600">{myTasksPending}</div>
                    <div className="text-sm text-muted-foreground">Tareas Pendientes</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <div className="text-lg font-bold text-purple-600">
                      {nextDeadline ? new Date(nextDeadline).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) : 'N/A'}
                    </div>
                    <div className="text-sm text-muted-foreground">Próxima Fecha Límite</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información del Coordinador */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Coordinador del Evento
              </CardTitle>
              <CardDescription>
                Información de contacto y coordinación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{activeEvent.coordinator.name}</h4>
                  <p className="text-sm text-muted-foreground">Coordinador Principal</p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <Mail className="w-3 h-3" />
                    {activeEvent.coordinator.email}
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contactar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Acciones Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Acciones Rápidas
              </CardTitle>
              <CardDescription>
                Accede a las funciones más importantes del evento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* ✅ FUNCIONAL - Integrado con backend */}
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => navigate({ to: '/seedbed-leader/mis-tareas' })}
                >
                  <Target className="w-6 h-6" />
                  <span className="text-sm">Mis Tareas</span>
                </Button>
                
                {/* ⚠️ PLACEHOLDER - Sistema de reportes NO implementado */}
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => toast.info('Sistema de reportes en desarrollo')}
                >
                  <FileText className="w-6 h-6" />
                  <span className="text-sm">Reportes</span>
                </Button>
                
                {/* ⚠️ PLACEHOLDER - Sistema de recursos NO implementado */}
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => toast.info('Sistema de recursos en desarrollo')}
                >
                  <BookOpen className="w-6 h-6" />
                  <span className="text-sm">Recursos</span>
                </Button>
                
                {/* ⚠️ PLACEHOLDER - Sistema de logros NO implementado */}
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => toast.info('Sistema de logros en desarrollo')}
                >
                  <Award className="w-6 h-6" />
                  <span className="text-sm">Logros</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardContent>
    </DashboardLayout>
  )
}