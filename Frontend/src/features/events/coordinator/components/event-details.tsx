import { useState, useEffect } from 'react'
import { 
  Calendar, 
  Users, 
  Clock, 
  User, 
  Building2, 
  Edit, 
  Settings, 
  TrendingUp, 
  BarChart3, 
  AlertTriangle, 
  CheckSquare, 
  FolderKanban, 
  Activity, 
  Download,
  Play,
  CheckCircle,
  XCircle,
  HelpCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { eventService } from '@/services/event.service'

interface Event {
  id: number
  name: string
  description: string
  start_date: string
  end_date: string
  status: 'active' | 'inactive' | 'finished'
  coordinator: {
    id: number
    name: string
    email?: string
  }
  institution: {
    id: number
    nombre: string
    identificador?: string
  }
  participants_count: number
  committees_count: number
  created_at: string
  progress?: number
  active_committees?: number
  active_participants?: number
  total_tasks?: number
  completed_tasks?: number
  open_incidents?: number
  pending_tasks?: number
}

interface EventDetailsProps {
  event: Event
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
      <Icon className={`h-5 w-5 ${config.color}`} />
    </div>
  )
}

// Helper para calcular días restantes
function getDaysRemaining(endDate: string): number {
  const end = new Date(endDate)
  const today = new Date()
  const diff = end.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// Helper para obtener variante de badge por estado
const getStatusVariant = (status: string) => {
  const variants = {
    'active': 'default' as const,
    'inactive': 'secondary' as const,
    'finished': 'outline' as const
  }
  return variants[status as keyof typeof variants] || 'outline'
}

// Helper para obtener etiqueta de estado
const getStatusLabel = (status: string) => {
  const labels = {
    'active': 'Activo',
    'inactive': 'Inactivo',
    'finished': 'Finalizado'
  }
  return labels[status as keyof typeof labels] || status
}

export function EventDetails({ event }: EventDetailsProps) {
  const [eventStats, setEventStats] = useState<{
    progress: number
    active_committees: number
    active_participants: number
    total_tasks: number
    completed_tasks: number
    open_incidents: number
    pending_tasks: number
  } | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  // Obtener estadísticas del evento desde la API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true)
        const response = await eventService.getEventStatistics(event.id)
        
        if (response.success && response.data) {
          const stats = response.data
          const pendingTasks = stats.total_tasks - stats.completed_tasks
          setEventStats({
            progress: stats.progress_percentage || event.progress || 0,
            active_committees: stats.active_committees || 0,
            active_participants: stats.active_participants || 0,
            total_tasks: stats.total_tasks || 0,
            completed_tasks: stats.completed_tasks || 0,
            open_incidents: stats.open_incidents || 0,
            pending_tasks: pendingTasks > 0 ? pendingTasks : 0
          })
        }
      } catch (error) {
        console.error('Error al cargar estadísticas del evento:', error)
        // Usar valores por defecto si falla la carga
        setEventStats({
          progress: event.progress || 0,
          active_committees: 0,
          active_participants: 0,
          total_tasks: 0,
          completed_tasks: 0,
          open_incidents: 0,
          pending_tasks: 0
        })
      } finally {
        setLoadingStats(false)
      }
    }

    fetchStats()
  }, [event.id, event.progress])

  // Valores por defecto mientras se cargan las estadísticas
  const stats = eventStats || {
    progress: event.progress || 0,
    active_committees: 0,
    active_participants: 0,
    total_tasks: 0,
    completed_tasks: 0,
    open_incidents: 0,
    pending_tasks: 0
  }

  // Actividad reciente mock (por ahora, hasta que haya endpoint de actividades)
  const recentActivities = [
    {
      icon: Users,
      title: 'Nuevo líder asignado',
      description: 'María García fue asignada al Comité de Logística',
      time: 'Hace 2 horas'
    },
    {
      icon: CheckSquare,
      title: 'Tarea completada',
      description: 'Revisión de documentación técnica finalizada',
      time: 'Hace 4 horas'
    },
    {
      icon: AlertTriangle,
      title: 'Nueva incidencia reportada',
      description: 'Problema con el sistema de registro',
      time: 'Hace 6 horas'
    },
    {
      icon: FolderKanban,
      title: 'Comité creado',
      description: 'Comité de Evaluación fue creado exitosamente',
      time: 'Ayer'
    }
  ]

  const daysRemaining = getDaysRemaining(event.end_date)

  return (
    <div className="space-y-6">
      {/* Header Mejorado con Estado Visual */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-bold">{event.name}</h2>
          <StatusIndicator status={event.status} />
        </div>
        <p className="text-muted-foreground text-sm sm:text-base">{event.description}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={getStatusVariant(event.status)}>
            {getStatusLabel(event.status)}
          </Badge>
          <Badge variant="outline">
            {daysRemaining > 0 ? `${daysRemaining} días restantes` : 'Finalizado'}
          </Badge>
        </div>
      </div>

      {/* Botones de Acción - Posición Fija */}
      <div className="flex gap-2 pb-4 border-b">
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-1" />
          Editar
        </Button>
        <Button size="sm">
          <Settings className="h-4 w-4 mr-1" />
          Gestionar
        </Button>
      </div>

      {/* Progreso General del Evento */}
      <Card className="border-2 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5" />
            Progreso del Evento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 sm:space-y-6">
            {/* Progreso general */}
            <div className="space-y-2 sm:space-y-3">
              <div className="flex justify-between text-sm">
                <span>Progreso General</span>
                <span>{loadingStats ? '...' : `${stats.progress}%`}</span>
              </div>
              <Progress value={stats.progress} className="h-3" />
            </div>
            
            {/* Métricas detalladas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-green-600">
                  {loadingStats ? '...' : stats.completed_tasks}
                </div>
                <div className="text-xs text-muted-foreground">Tareas Completadas</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">
                  {loadingStats ? '...' : stats.active_committees}
                </div>
                <div className="text-xs text-muted-foreground">Comités Activos</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información Detallada en Filas */}
      <div className="space-y-6">
        {/* Información del Evento */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="w-5 h-5" />
              Información del Evento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fechas */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Fechas</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Fecha de Inicio</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(event.start_date), 'dd/MM/yyyy', { locale: es })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Fecha de Fin</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(event.end_date), 'dd/MM/yyyy', { locale: es })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Organización */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Organización</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Coordinador</p>
                      <p className="text-sm text-muted-foreground">
                        {event.coordinator.name}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Building2 className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Institución</p>
                      <p className="text-sm text-muted-foreground">
                        {event.institution.nombre}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas Avanzadas */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="w-5 h-5" />
              Estadísticas del Evento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <div className="text-2xl font-bold text-blue-600 mb-1">{event.participants_count}</div>
                <div className="text-sm font-medium">Participantes</div>
                <div className="text-xs text-muted-foreground">
                  ({loadingStats ? '...' : `${stats.active_participants} activos`})
                </div>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <div className="text-2xl font-bold text-green-600 mb-1">{event.committees_count}</div>
                <div className="text-sm font-medium">Comités</div>
                <div className="text-xs text-muted-foreground">
                  ({loadingStats ? '...' : `${stats.active_committees} activos`})
                </div>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {loadingStats ? '...' : stats.total_tasks}
                </div>
                <div className="text-sm font-medium">Tareas</div>
                <div className="text-xs text-muted-foreground">
                  ({loadingStats ? '...' : `${stats.completed_tasks} completadas`})
                </div>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {loadingStats ? '...' : stats.open_incidents}
                </div>
                <div className="text-sm font-medium">Incidencias</div>
                <div className="text-xs text-muted-foreground">
                  ({loadingStats ? '...' : (stats.open_incidents > 0 ? 'Requieren atención' : 'Sin incidencias')})
                </div>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Evento creado</span>
              <span className="text-sm text-muted-foreground">
                {format(new Date(event.created_at), 'dd/MM/yyyy', { locale: es })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Alertas y Notificaciones */}
        <Card className={!loadingStats && stats.open_incidents > 0 ? 'border-orange-200 bg-orange-50' : ''}>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className={`w-5 h-5 ${!loadingStats && stats.open_incidents > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
              Alertas y Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium">Incidencias</span>
                </div>
                <Badge variant={!loadingStats && stats.open_incidents > 0 ? 'destructive' : 'secondary'}>
                  {loadingStats ? '...' : stats.open_incidents}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <CheckSquare className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">Tareas Pendientes</span>
                </div>
                <Badge variant="secondary">
                  {loadingStats ? '...' : stats.pending_tasks}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">Días Restantes</span>
                </div>
                <Badge variant={daysRemaining < 7 ? 'destructive' : 'secondary'}>
                  {daysRemaining}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline de Actividades */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
            Actividad Reciente
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Últimas actividades en el evento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 sm:p-4 rounded-lg bg-muted/30">
                <div className="p-2 rounded-full bg-primary/10 flex-shrink-0">
                  <activity.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}