import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardContent } from '@/components/layout/dashboard-content'
import { useEventContext } from '@/stores/event-context-store'
import { useState, useEffect, useCallback } from 'react'
import { eventService, type Event } from '@/services/event.service'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Users,
  FolderKanban,
  Calendar,
  Clock,
  User,
  AlertTriangle,
  CheckSquare,
  BarChart3,
  Play,
  CheckCircle,
  HelpCircle,
  Activity,
  TrendingUp,
  ArrowRight,
  Building2,
  FileText,
  FileSpreadsheet,
  Download
} from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'
import { cn } from '@/lib/utils'
import { ProgressChart } from '@/components/charts/ProgressChart'
import { CommitteeProgressChart, type CommitteeData } from '@/components/charts/CommitteeProgressChart'
import { ProgressTimelineChart, type ProgressHistoryData } from '@/components/charts/ProgressTimelineChart'
import { WorkloadChart, type WorkloadData } from '@/components/charts/WorkloadChart'
import { TaskStatusChart, type TaskStatusData } from '@/components/charts/TaskStatusChart'
import { MilestonesTimelineChart, type MilestoneData } from '@/components/charts/MilestonesTimelineChart'
import { useRealtimeEventMetrics } from '@/hooks/useRealtimeEventMetrics'
import { 
  getEventCommitteeMetrics, 
  getEventProgressHistory, 
  getEventWorkload,
  getEventAlertsMetrics,
  getEventMilestones,
  type AlertsMetricsData
} from '@/services/event-metrics-advanced.service'
import { pusherService } from '@/services/pusherService'
import { Wifi, WifiOff, Bell } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/coordinator/eventos/$eventId/')({
  component: EventDetailsPage,
})

// Componente StatusIndicator
const StatusIndicator = ({ status }: { status: string }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'activo':
        return {
          icon: Play,
          color: 'text-green-500',
          bg: 'bg-green-50',
          label: 'Activo'
        }
      case 'inactivo':
        return {
          icon: Clock,
          color: 'text-yellow-500',
          bg: 'bg-yellow-50',
          label: 'Inactivo'
        }
      case 'finalizado':
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

// Componente QuickAccessCard
const QuickAccessCard = ({
  title,
  description,
  icon: Icon,
  count,
  href,
  permission,
  color,
  urgent = false
}: {
  title: string
  description: string
  icon: any
  count: number
  href: string
  permission: string
  color: string
  urgent?: boolean
}) => {
  const { hasPermission } = usePermissions()
  const navigate = useNavigate()

  if (!hasPermission(permission)) return null

  const colorClasses = {
    green: 'text-green-500 border-green-200 hover:border-green-300',
    blue: 'text-blue-500 border-blue-200 hover:border-blue-300',
    purple: 'text-purple-500 border-purple-200 hover:border-purple-300',
    indigo: 'text-indigo-500 border-indigo-200 hover:border-indigo-300',
    orange: 'text-orange-500 border-orange-200 hover:border-orange-300',
    red: 'text-red-500 border-red-200 hover:border-red-300'
  }

  return (
    <Card
      className={`hover:shadow-md transition-all cursor-pointer border-2 ${colorClasses[color as keyof typeof colorClasses]} ${urgent ? 'ring-2 ring-orange-200' : ''}`}
      onClick={() => navigate({ to: href })}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {title}
          </CardTitle>
          {urgent && (
            <Badge variant="destructive" className="text-xs">
              Urgente
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">
          {description}
        </p>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">{count}</div>
          <Button size="sm" variant="outline">
            Acceder
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Componente mejorado para métricas
const MetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  progress,
  onClick,
  urgent = false
}: {
  title: string
  value: number | string
  subtitle?: string
  icon: any
  iconColor: string
  progress?: number
  onClick?: () => void
  urgent?: boolean
}) => {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer",
        urgent && "border-orange-300 bg-gradient-to-br from-orange-50/50 to-orange-100/30",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-2xl" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn("p-2 rounded-lg bg-background/50 backdrop-blur-sm", iconColor.split(" ")[0])}>
          <Icon className={cn(
            "h-5 w-5", 
            urgent 
              ? "text-orange-600 dark:text-orange-400" 
              : iconColor.split(" ")[1] || "text-muted-foreground"
          )} />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="flex items-baseline justify-between mb-2">
          <div className="text-3xl font-bold tracking-tight">{value}</div>
          {urgent && (
            <Badge variant="destructive" className="text-xs animate-pulse">
              Urgente
            </Badge>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mb-3">{subtitle}</p>
        )}
        {progress !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progreso</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
        {onClick && (
          <div className="mt-4 flex items-center text-xs text-primary font-medium group-hover:gap-2 transition-all">
            Ver detalles
            <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

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

// Helper para obtener variante de badge por estado
const getStatusVariant = (status: string) => {
  const variants = {
    'activo': 'default' as const,
    'inactivo': 'secondary' as const,
    'finalizado': 'outline' as const
  }
  return variants[status as keyof typeof variants] || 'outline'
}

// Helper para obtener etiqueta de estado
const getStatusLabel = (status: string) => {
  const labels = {
    'activo': 'Activo',
    'inactivo': 'Inactivo',
    'finalizado': 'Finalizado'
  }
  return labels[status as keyof typeof labels] || status
}

function EventDetailsPage() {
  const { eventId } = Route.useParams()
  const { setSelectedEvent, clearSelectedEvent } = useEventContext()
  const navigate = useNavigate()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)

  // Estadísticas del evento desde backend
  const [stats, setStats] = useState<{
    total_tasks: number
    completed_tasks: number
    in_progress_tasks: number
    delayed_tasks: number
    paused_tasks: number
    overdue: number
    progress_percentage: number
    active_committees: number
    active_participants: number
    open_incidents: number
    my_tasks: number
    critical_alerts?: number
    preventive_alerts?: number
  } | null>(null)

  // Métricas avanzadas
  const [committeeMetrics, setCommitteeMetrics] = useState<CommitteeData[]>([])
  const [progressHistory, setProgressHistory] = useState<ProgressHistoryData[]>([])
  const [workloadData, setWorkloadData] = useState<WorkloadData[]>([])
  const [alertsMetrics, setAlertsMetrics] = useState<AlertsMetricsData | null>(null)
  const [milestones, setMilestones] = useState<MilestoneData[]>([])
  const [loadingMetrics, setLoadingMetrics] = useState(false)
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // ============================================
  // ESTADÍSTICAS DEL EVENTO
  // ============================================
  // Las estadísticas ahora se calculan dinámicamente desde el backend
  // usando los datos reales de comités, tareas e incidencias

  // ============================================
  // ACTIVIDAD RECIENTE
  // ============================================
  // PLACEHOLDER: Sistema de actividad reciente (no implementado en backend)
  // Esta funcionalidad requerirá un nuevo endpoint para obtener el historial
  // de actividades del evento con paginación y filtros.
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

    const loadStats = async () => {
      try {
        const response = await eventService.getEventStatistics(Number(eventId))
        if (response?.success && response.data) {
          setStats(response.data)
        } else {
          setStats(null)
        }
      } catch (_error) {
        setStats(null)
      }
    }

    const loadAdvancedMetrics = async () => {
      try {
        setLoadingMetrics(true)
        const [committeesRes, historyRes, workloadRes, alertsRes, milestonesRes] = await Promise.all([
          getEventCommitteeMetrics(Number(eventId)),
          getEventProgressHistory(Number(eventId), 30),
          getEventWorkload(Number(eventId)),
          getEventAlertsMetrics(Number(eventId)),
          getEventMilestones(Number(eventId))
        ])

        if (committeesRes.success) {
          setCommitteeMetrics(committeesRes.data)
        }
        if (historyRes.success) {
          setProgressHistory(historyRes.data)
        }
        if (workloadRes.success) {
          setWorkloadData(workloadRes.data)
        }
        if (alertsRes.success) {
          setAlertsMetrics(alertsRes.data)
        }
        if (milestonesRes.success) {
          setMilestones(milestonesRes.data)
        }
      } catch (error) {
        console.error('Error loading advanced metrics:', error)
      } finally {
        setLoadingMetrics(false)
      }
    }

    loadEvent()
    loadStats()
    loadAdvancedMetrics()

    // Limpiar al desmontar
    return () => {
      clearSelectedEvent()
    }
  }, [eventId]) // ✅ Solo eventId como dependencia

  // Callback para actualizaciones en tiempo real
  const handleMetricsUpdate = useCallback((updatedMetrics: {
    progress_percentage: number
    total_tasks: number
    completed_tasks: number
    active_committees: number
    open_incidents: number
  }) => {
    // Actualizar stats cuando llega una actualización
    setStats(prev => prev ? { ...prev, ...updatedMetrics } : null)
    setLastUpdate(new Date())

    // Recargar métricas avanzadas
    const reloadMetrics = async () => {
      try {
        const [committeesRes, historyRes, workloadRes, alertsRes, milestonesRes] = await Promise.all([
          getEventCommitteeMetrics(Number(eventId)),
          getEventProgressHistory(Number(eventId), 30),
          getEventWorkload(Number(eventId)),
          getEventAlertsMetrics(Number(eventId)),
          getEventMilestones(Number(eventId))
        ])

        if (committeesRes.success) {
          setCommitteeMetrics(committeesRes.data)
        }
        if (historyRes.success) {
          setProgressHistory(historyRes.data)
        }
        if (workloadRes.success) {
          setWorkloadData(workloadRes.data)
        }
        if (alertsRes.success) {
          setAlertsMetrics(alertsRes.data)
        }
        if (milestonesRes.success) {
          setMilestones(milestonesRes.data)
        }
      } catch (error) {
        console.error('Error reloading metrics:', error)
      }
    }

    reloadMetrics()
  }, [eventId])

  // Hook para actualizaciones en tiempo real
  useRealtimeEventMetrics(Number(eventId), handleMetricsUpdate)

  // Escuchar cambios de estado de conexión de Pusher
  useEffect(() => {
    let handlersSetup = false
    let checkInterval: NodeJS.Timeout | null = null
    
    // Verificar estado inicial
    const checkConnection = () => {
      const isConnected = pusherService.isConnected()
      const connectionState = pusherService.getConnectionState()
      setRealtimeConnected(isConnected && connectionState === 'connected')
    }

    // Handlers para los eventos de conexión
    const handleStateChange = (states: { previous: string; current: string }) => {
      const isConnected = states.current === 'connected'
      setRealtimeConnected(isConnected)
      
      if (isConnected) {
        setLastUpdate(new Date())
      }
    }

    const handleConnected = () => {
      setRealtimeConnected(true)
      setLastUpdate(new Date())
    }

    const handleDisconnected = () => {
      setRealtimeConnected(false)
    }

    // Función para configurar los listeners
    const setupListeners = (pusherInstance: ReturnType<typeof pusherService.getPusherInstance>) => {
      if (!pusherInstance || handlersSetup) return
      
      handlersSetup = true
      pusherInstance.connection.bind('state_change', handleStateChange)
      pusherInstance.connection.bind('connected', handleConnected)
      pusherInstance.connection.bind('disconnected', handleDisconnected)
    }

    // Verificar estado inicial
    checkConnection()

    // Obtener instancia de Pusher para escuchar cambios
    const pusherInstance = pusherService.getPusherInstance()
    
    if (pusherInstance) {
      setupListeners(pusherInstance)
    } else {
      // Si Pusher no está inicializado, verificar periódicamente
      checkInterval = setInterval(() => {
        checkConnection()
        const instance = pusherService.getPusherInstance()
        if (instance) {
          if (checkInterval) {
            clearInterval(checkInterval)
            checkInterval = null
          }
          setupListeners(instance)
        }
      }, 1000)
    }

    // Cleanup
    return () => {
      if (checkInterval) {
        clearInterval(checkInterval)
      }
      
      const instance = pusherService.getPusherInstance()
      if (instance && handlersSetup) {
        instance.connection.unbind('state_change', handleStateChange)
        instance.connection.unbind('connected', handleConnected)
        instance.connection.unbind('disconnected', handleDisconnected)
      }
    }
  }, [])

  if (loading) {
    return (
      <DashboardLayout showFooter={false}>
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
      <DashboardLayout showFooter={false}>
        <DashboardContent>
      <div className="container mx-auto py-6">
        <p className="text-center text-muted-foreground">Evento no encontrado</p>
      </div>
        </DashboardContent>
      </DashboardLayout>
    )
  }

  const daysRemaining = getDaysRemaining(event.end_date)
  const isOverdue = daysRemaining < 0
  const isUrgent = daysRemaining >= 0 && daysRemaining <= 7

  return (
    <PermissionGuard permission="events.view">
      <DashboardLayout showFooter={true}>
        <DashboardContent
          title={event.name}
          description="Panel de gestión del evento"
        >
          <div className="space-y-8">
            {/* Hero Card del Evento Mejorado */}
            <Card className="relative overflow-hidden border-2 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20">
              {/* Patrón de fondo decorativo */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl" />

              <CardContent className="pt-8 pb-8 relative z-10">
                <div className="flex flex-col gap-6">
                  {/* Header mejorado */}
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                          {event.name}
                        </h2>
                        <StatusIndicator status={event.status} />
                      </div>
                      <p className="text-base lg:text-lg text-muted-foreground leading-relaxed max-w-3xl">
                        {event.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 lg:flex-col">
                      <Badge
                        variant={getStatusVariant(event.status)}
                        className="text-sm px-4 py-2 h-auto"
                      >
                        {getStatusLabel(event.status)}
                      </Badge>
                      <Badge
                        variant={isOverdue ? "destructive" : isUrgent ? "secondary" : "outline"}
                        className="text-sm px-4 py-2 h-auto"
                      >
                        {isOverdue
                          ? `Finalizado hace ${Math.abs(daysRemaining)} días`
                          : daysRemaining > 0
                            ? `${daysRemaining} día${daysRemaining !== 1 ? 's' : ''} restante${daysRemaining !== 1 ? 's' : ''}`
                            : 'Finalizado hoy'
                        }
                      </Badge>
                      {/* Botones de Exportación */}
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-border/30">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              toast.loading('Generando reporte PDF...', { id: 'export-pdf' })
                              const blob = await eventService.exportPdf(Number(eventId))
                              const url = window.URL.createObjectURL(blob)
                              const link = document.createElement('a')
                              link.href = url
                              link.download = `reporte_evento_${eventId}_${new Date().toISOString().split('T')[0]}.pdf`
                              document.body.appendChild(link)
                              link.click()
                              document.body.removeChild(link)
                              window.URL.revokeObjectURL(url)
                              toast.success('Reporte PDF descargado exitosamente', { id: 'export-pdf' })
                            } catch (error) {
                              console.error('Error exporting PDF:', error)
                              toast.error('Error al generar el reporte PDF', { id: 'export-pdf' })
                            }
                          }}
                          className="flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          Exportar PDF
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              toast.loading('Generando reporte Excel...', { id: 'export-excel' })
                              const blob = await eventService.exportExcel(Number(eventId))
                              const url = window.URL.createObjectURL(blob)
                              const link = document.createElement('a')
                              link.href = url
                              link.download = `reporte_evento_${eventId}_${new Date().toISOString().split('T')[0]}.xlsx`
                              document.body.appendChild(link)
                              link.click()
                              document.body.removeChild(link)
                              window.URL.revokeObjectURL(url)
                              toast.success('Reporte Excel descargado exitosamente', { id: 'export-excel' })
                            } catch (error) {
                              console.error('Error exporting Excel:', error)
                              toast.error('Error al generar el reporte Excel', { id: 'export-excel' })
                            }
                          }}
                          className="flex items-center gap-2"
                        >
                          <FileSpreadsheet className="h-4 w-4" />
                          Exportar Excel
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Progreso general mejorado */}
                  <div className="space-y-3 pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Progreso General del Evento</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{stats?.progress_percentage ? Math.round(stats.progress_percentage) : 0}%</span>
                        {stats?.progress_percentage && stats.progress_percentage > 50 && (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </div>
                    <Progress
                      value={stats?.progress_percentage ? Math.round(stats.progress_percentage) : 0}
                      className="h-3 bg-muted/50"
                    />
                  </div>

                  {/* Información del evento mejorada */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-border/50">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-colors">
                      <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Inicio</p>
                        <p className="text-sm font-semibold truncate">{formatDate(event.start_date)}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-colors">
                      <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Fin</p>
                        <p className="text-sm font-semibold truncate">{formatDate(event.end_date)}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-colors">
                      <div className="p-2.5 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Coordinador</p>
                        <p className="text-sm font-semibold truncate">{event.coordinator?.name || 'No asignado'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-colors">
                      <div className="p-2.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Institución</p>
                        <p className="text-sm font-semibold truncate">{event.institution?.nombre || 'No asignada'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Métricas Dinámicas Mejoradas */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                <h3 className="text-xl font-semibold mb-1">Métricas del Evento</h3>
                <p className="text-sm text-muted-foreground">Resumen de las áreas de gestión</p>
                </div>
                {/* Indicador de Actualización en Vivo */}
                <div className="flex items-center gap-2">
                  {realtimeConnected ? (
                    <>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                        <Wifi className="h-3.5 w-3.5 text-green-600 dark:text-green-400 animate-pulse" />
                        <span className="text-xs font-medium text-green-700 dark:text-green-300">En Vivo</span>
                      </div>
                      {lastUpdate && (
                        <span className="text-xs text-muted-foreground">
                          Actualizado {lastUpdate.toLocaleTimeString()}
                        </span>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-950/20 border border-gray-200 dark:border-gray-800">
                      <WifiOff className="h-3.5 w-3.5 text-gray-500" />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Sin conexión en tiempo real</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {/* Comités con progreso */}
                <MetricCard
                  title="Comités de Trabajo"
                  value={event.committees_count}
                  subtitle={`${stats?.active_committees || 0} activos`}
                  icon={FolderKanban}
                  iconColor="bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  progress={event.committees_count ? ((stats?.active_committees || 0) / event.committees_count) * 100 : 0}
                  onClick={() => navigate({ to: `/coordinator/eventos/${eventId}/comites` })}
                />

                {/* Líderes con actividad */}
                <MetricCard
                  title="Líderes de Semillero"
                  value={event.participants_count}
                  subtitle={`${stats?.active_participants || 0} activos`}
                  icon={Users}
                  iconColor="bg-green-500/10 text-green-600 dark:text-green-400"
                  progress={event.participants_count ? ((stats?.active_participants || 0) / event.participants_count) * 100 : 0}
                  onClick={() => navigate({ to: `/coordinator/eventos/${eventId}/participantes` })}
                />

                {/* Tareas con progreso */}
                <MetricCard
                  title="Banco de Tareas"
                  value={stats?.total_tasks || 0}
                  subtitle={`${stats?.completed_tasks || 0} completadas`}
                  icon={CheckSquare}
                  iconColor="bg-purple-500/10 text-purple-600 dark:text-purple-400"
                  progress={stats?.total_tasks ? ((stats?.completed_tasks || 0) / stats.total_tasks) * 100 : 0}
                  onClick={() => navigate({ to: `/coordinator/eventos/${eventId}/tasks` })}
                />

                {/* Tareas Atrasadas */}
                <MetricCard
                  title="Tareas Atrasadas"
                  value={stats?.overdue || 0}
                  subtitle={(stats?.overdue || 0) > 0 ? 'Requieren atención' : 'Sin atrasos'}
                  icon={Clock}
                  iconColor="bg-orange-500/10 text-orange-600 dark:text-orange-400"
                  urgent={(stats?.overdue || 0) > 0}
                  onClick={() => navigate({ to: `/coordinator/eventos/${eventId}/tasks?filter=overdue` })}
                />

                                {/* Incidencias con alertas */}
                <MetricCard
                  title="Incidencias"
                  value={stats?.open_incidents || 0}
                  subtitle="Problemas reportados"
                  icon={AlertTriangle}
                  iconColor="bg-red-500/10 text-red-600 dark:text-red-400"      
                  urgent={(stats?.open_incidents || 0) > 0}
                  onClick={() => navigate({ to: `/coordinator/eventos/${eventId}/incidencias` })}
                />

                {/* Alertas Críticas */}
                <MetricCard
                  title="Alertas Críticas"
                  value={alertsMetrics?.total_critical || stats?.critical_alerts || 0}
                  subtitle={`${alertsMetrics?.unread_critical || 0} sin leer`}
                  icon={Bell}
                  iconColor="bg-red-500/10 text-red-600 dark:text-red-400"
                  urgent={(alertsMetrics?.total_critical || stats?.critical_alerts || 0) > 0}
                />

                {/* Alertas Preventivas */}
                <MetricCard
                  title="Alertas Preventivas"
                  value={alertsMetrics?.total_preventive || stats?.preventive_alerts || 0}
                  subtitle={`${alertsMetrics?.unread_preventive || 0} sin leer`}
                  icon={Bell}
                  iconColor="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                />
              </div>
            </div>

            {/* Gráficos Avanzados */}
            {!loadingMetrics && (committeeMetrics.length > 0 || progressHistory.length > 0 || workloadData.length > 0 || milestones.length > 0) && (
              <div className="space-y-6">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold mb-1">Análisis Visual</h3>
                  <p className="text-sm text-muted-foreground">Visualización de métricas y tendencias</p>
                </div>

                {/* Gráficos principales */}
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Progreso General */}
                  {stats && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Progreso General</CardTitle>
                        <CardDescription>Distribución de tareas completadas vs pendientes</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ProgressChart 
                          completed={stats.completed_tasks || 0}
                          total={stats.total_tasks || 0}
                        />
                      </CardContent>
                    </Card>
                  )}

                  {/* Estado de Tareas */}
                  {stats && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Estado de Tareas</CardTitle>
                        <CardDescription>Distribución por estado</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <TaskStatusChart 
                          data={{
                            completed: stats.completed_tasks || 0,
                            in_progress: stats.in_progress_tasks || 0,
                            pending: (stats.total_tasks || 0) - (stats.completed_tasks || 0) - (stats.in_progress_tasks || 0) - (stats.delayed_tasks || 0) - (stats.paused_tasks || 0),
                            delayed: stats.delayed_tasks || 0,
                            paused: stats.paused_tasks || 0,
                          }}
                        />
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Progreso por Comité */}
                {committeeMetrics.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Progreso por Comité</CardTitle>
                      <CardDescription>Comparación del avance entre comités de trabajo</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <CommitteeProgressChart 
                        data={committeeMetrics}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Gráficos secundarios */}
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Historial de Progreso */}
                  {progressHistory.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Evolución del Progreso</CardTitle>
                        <CardDescription>Tendencia de progreso en los últimos 30 días</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ProgressTimelineChart data={progressHistory} />
                      </CardContent>
                    </Card>
                  )}

                  {/* Distribución de Carga de Trabajo */}
                  {workloadData.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Distribución de Carga de Trabajo</CardTitle>
                        <CardDescription>Tareas asignadas por usuario</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <WorkloadChart data={workloadData} />
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Timeline de Hitos Importantes */}
                {milestones.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Timeline de Hitos Importantes</CardTitle>
                      <CardDescription>Cronología de eventos clave del evento</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <MilestonesTimelineChart data={milestones} />
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Dashboard de Actividad Reciente Mejorado */}
            <Card className="overflow-hidden">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Activity className="h-5 w-5 text-primary" />
                      </div>
                      Actividad Reciente
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Últimas actividades en el evento
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {recentActivities.map((activity, index) => (
                    <div
                      key={index}
                      className="group flex items-start gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all border border-transparent hover:border-border/50"
                    >
                      <div className="p-2.5 rounded-full bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                        <activity.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm font-semibold">{activity.title}</p>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {activity.time}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </DashboardContent>
      </DashboardLayout>
    </PermissionGuard>
  )
}
