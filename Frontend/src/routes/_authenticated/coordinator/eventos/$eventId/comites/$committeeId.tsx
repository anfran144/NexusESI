import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardContent } from '@/components/layout/dashboard-content'
import { useEventContext } from '@/stores/event-context-store'
import { useState, useEffect, useCallback } from 'react'
import { committeeService, type Committee } from '@/services/committee.service'
import { taskService, type Task, type TaskProgress } from '@/services/taskService'
import { eventService, type Event } from '@/services/event.service'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft, 
  Users, 
  ListTodo, 
  TrendingUp, 
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Pause,
  Calendar,
  User,
  History
} from 'lucide-react'
import { CommitteeMembers } from '@/features/events/coordinator/components/committee-members'
import { TaskCard } from '@/components/tasks/TaskCard'
import { TaskProgressHistory } from '@/components/monitoring/TaskProgressHistory'
import { format } from 'date-fns'
import { getCommitteeColor } from '@/utils/committee-colors'
import { calculateCommitteeMetrics } from '@/services/event-metrics.service'

export const Route = createFileRoute('/_authenticated/coordinator/eventos/$eventId/comites/$committeeId')({
  component: CommitteeDetailPage,
})

interface CommitteeMetrics {
  total_tasks: number
  completed_tasks: number
  in_progress_tasks: number
  pending_tasks: number
  delayed_tasks: number
  progress: number
}

function CommitteeDetailPage() {
  const { eventId, committeeId } = Route.useParams()
  const { setSelectedEvent } = useEventContext()
  const navigate = useNavigate()
  
  const [committee, setCommittee] = useState<Committee | null>(null)
  const [event, setEvent] = useState<Event | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [metrics, setMetrics] = useState<CommitteeMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('info')
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set())
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [progressHistoryOpen, setProgressHistoryOpen] = useState(false)

  const loadCommittee = useCallback(async () => {
    try {
      const response = await committeeService.getCommittee(Number(committeeId))
      if (response.success) {
        setCommittee(response.data)
      }
    } catch (error) {
      console.error('Error loading committee:', error)
      toast.error('Error al cargar el comité')
    }
  }, [committeeId])

  const loadEvent = useCallback(async () => {
    try {
      const response = await eventService.getEvent(Number(eventId))
      if (response.success) {
        setEvent(response.data)
        setSelectedEvent(response.data.id, response.data.name)
      }
    } catch (error) {
      console.error('Error loading event:', error)
    }
  }, [eventId, setSelectedEvent])

  const loadTasks = useCallback(async () => {
    try {
      const tasksData = await taskService.getTasks({ 
        committee_id: Number(committeeId),
        event_id: Number(eventId)
      })
      setTasks(Array.isArray(tasksData) ? tasksData : [])
    } catch (error) {
      console.error('Error loading tasks:', error)
      toast.error('Error al cargar las tareas')
    }
  }, [committeeId, eventId])

  const loadMetrics = useCallback(async () => {
    try {
      const committeeMetrics = await calculateCommitteeMetrics(Number(committeeId))
      setMetrics({
        total_tasks: committeeMetrics.total_tasks,
        completed_tasks: committeeMetrics.completed_tasks,
        in_progress_tasks: committeeMetrics.in_progress_tasks || 0,
        pending_tasks: committeeMetrics.pending_tasks || 0,
        delayed_tasks: committeeMetrics.delayed_tasks || 0,
        progress: committeeMetrics.progress
      })
    } catch (error) {
      console.error('Error loading metrics:', error)
      // Métricas por defecto
      setMetrics({
        total_tasks: tasks.length,
        completed_tasks: tasks.filter(t => t.status === 'Completed').length,
        in_progress_tasks: tasks.filter(t => t.status === 'InProgress').length,
        pending_tasks: tasks.filter(t => t.status === 'Pending').length,
        delayed_tasks: tasks.filter(t => t.status === 'Delayed').length,
        progress: 0
      })
    }
  }, [committeeId, tasks])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([
        loadEvent(),
        loadCommittee(),
        loadTasks()
      ])
      setLoading(false)
    }
    loadData()
  }, [eventId, committeeId, loadEvent, loadCommittee, loadTasks])

  useEffect(() => {
    if (tasks.length > 0) {
      loadMetrics()
    }
  }, [tasks, loadMetrics])


  const getAllProgress = (): TaskProgress[] => {
    const allProgress: TaskProgress[] = []
    tasks.forEach(task => {
      if (task.progress && task.progress.length > 0) {
        allProgress.push(...task.progress)
      }
    })
    // Ordenar por fecha más reciente
    return allProgress.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }

  const toggleTaskExpansion = (taskId: number) => {
    const newExpanded = new Set(expandedTasks)
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId)
    } else {
      newExpanded.add(taskId)
    }
    setExpandedTasks(newExpanded)
  }

  const handleViewProgress = (task: Task) => {
    setSelectedTask(task)
    setProgressHistoryOpen(true)
  }

  if (loading) {
    return (
      <DashboardLayout showFooter={false}>
        <DashboardContent title="Cargando..." description="Detalles del comité">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando información del comité...</p>
            </div>
          </div>
        </DashboardContent>
      </DashboardLayout>
    )
  }

  if (!committee) {
    return (
      <DashboardLayout showFooter={false}>
        <DashboardContent title="Comité no encontrado" description="Error">
          <div className="container mx-auto py-6">
            <p className="text-center text-muted-foreground">El comité no fue encontrado</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate({ to: `/coordinator/eventos/${eventId}/comites` })}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Comités
            </Button>
          </div>
        </DashboardContent>
      </DashboardLayout>
    )
  }

  const colors = getCommitteeColor(committee.name, committee.id)
  const allProgress = getAllProgress()

  return (
    <PermissionGuard permission="events.committees.manage">
      <DashboardLayout showFooter={true}>
        <DashboardContent
          title={committee.name}
          description={`Comité del evento "${event?.name || ''}"`}
        >
          <div className="space-y-6">
            {/* Navegación */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: `/coordinator/eventos/${eventId}/comites` })}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Comités
            </Button>

            {/* Métricas rápidas */}
            {metrics && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Total de Tareas</CardDescription>
                    <CardTitle className="text-2xl">{metrics.total_tasks}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Progress value={metrics.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      {Math.round(metrics.progress)}% completadas
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Completadas</CardDescription>
                    <CardTitle className="text-2xl text-green-600">{metrics.completed_tasks}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{metrics.in_progress_tasks} en progreso</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Miembros</CardDescription>
                    <CardTitle className="text-2xl">{committee.members_count}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>Participantes activos</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Avances Reportados</CardDescription>
                    <CardTitle className="text-2xl">{allProgress.length}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="w-4 h-4" />
                      <span>Actualizaciones de tareas</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Tabs principales */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="info">Información</TabsTrigger>
                <TabsTrigger value="members">
                  Participantes
                  {committee.members_count > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {committee.members_count}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="tasks">
                  Tareas
                  {tasks.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {tasks.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="progress">
                  Avances
                  {allProgress.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {allProgress.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Tab: Información */}
              <TabsContent value="info" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FolderKanban className="h-5 w-5" />
                      Información del Comité
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                      <p className="text-lg font-semibold">{committee.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Evento</label>
                      <p className="text-lg">{event?.name || 'N/A'}</p>
                    </div>
                    {metrics && (
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Progreso General</label>
                          <div className="mt-2">
                            <Progress value={metrics.progress} className="h-3" />
                            <p className="text-sm text-muted-foreground mt-1">
                              {metrics.completed_tasks} de {metrics.total_tasks} tareas completadas ({Math.round(metrics.progress)}%)
                            </p>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Estado de Tareas</label>
                          <div className="mt-2 space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Completadas:</span>
                              <span className="font-medium text-green-600">{metrics.completed_tasks}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>En Progreso:</span>
                              <span className="font-medium text-blue-600">{metrics.in_progress_tasks}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Pendientes:</span>
                              <span className="font-medium text-gray-600">{metrics.pending_tasks}</span>
                            </div>
                            {metrics.delayed_tasks > 0 && (
                              <div className="flex justify-between text-sm">
                                <span>Retrasadas:</span>
                                <span className="font-medium text-red-600">{metrics.delayed_tasks}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Participantes */}
              <TabsContent value="members">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Participantes del Comité
                    </CardTitle>
                    <CardDescription>
                      Gestiona los miembros asignados a este comité
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CommitteeMembers committeeId={Number(committeeId)} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Tareas */}
              <TabsContent value="tasks" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ListTodo className="h-5 w-5" />
                      Tareas del Comité
                    </CardTitle>
                    <CardDescription>
                      {tasks.length === 0 
                        ? 'No hay tareas asignadas a este comité'
                        : `${tasks.length} ${tasks.length === 1 ? 'tarea asignada' : 'tareas asignadas'}`
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {tasks.length === 0 ? (
                      <div className="text-center py-8">
                        <ListTodo className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No hay tareas asignadas a este comité</p>
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => navigate({ to: `/coordinator/eventos/${eventId}/tasks` })}
                        >
                          Ver Banco de Tareas
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {tasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            committees={[]}
                            showCheckbox={false}
                            showCommitteeActions={false}
                            onViewProgress={handleViewProgress}
                            expandedTasks={expandedTasks}
                            onToggleExpand={toggleTaskExpansion}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Avances */}
              <TabsContent value="progress" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Historial de Avances
                    </CardTitle>
                    <CardDescription>
                      {allProgress.length === 0
                        ? 'No hay avances reportados'
                        : `${allProgress.length} ${allProgress.length === 1 ? 'avance reportado' : 'avances reportados'}`
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {allProgress.length === 0 ? (
                      <div className="text-center py-8">
                        <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No hay avances reportados para las tareas de este comité</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {allProgress.map((progress) => {
                          const task = tasks.find(t => t.id === progress.task_id)
                          return (
                            <Card key={progress.id}>
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20">
                                    <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <div className="flex-1 space-y-2">
                                    {task && (
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs">
                                          {task.title}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">
                                          {task.status === 'Pending' ? 'Pendiente' :
                                           task.status === 'InProgress' ? 'En Progreso' :
                                           task.status === 'Completed' ? 'Completada' :
                                           task.status === 'Delayed' ? 'Retrasada' :
                                           task.status === 'Paused' ? 'Pausada' : task.status}
                                        </Badge>
                                      </div>
                                    )}
                                    <div 
                                      className="prose prose-sm max-w-none text-sm"
                                      dangerouslySetInnerHTML={{ __html: progress.description }}
                                    />
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                      <span className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {progress.user?.name || 'Usuario'}
                                      </span>
                                      <span>•</span>
                                      <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {format(new Date(progress.created_at), 'dd/MM/yyyy HH:mm')}
                                      </span>
                                      {progress.file_name && (
                                        <>
                                          <span>•</span>
                                          <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                            {progress.file_name}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Dialog de historial de avances */}
          <TaskProgressHistory
            task={selectedTask}
            open={progressHistoryOpen}
            onOpenChange={setProgressHistoryOpen}
          />
        </DashboardContent>
      </DashboardLayout>
    </PermissionGuard>
  )
}
