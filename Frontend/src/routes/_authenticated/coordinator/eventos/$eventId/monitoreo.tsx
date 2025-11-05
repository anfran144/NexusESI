import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardContent } from '@/components/layout/dashboard-content'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { useEventContext } from '@/stores/event-context-store'
import { useState, useEffect } from 'react'
import { eventService, type Event } from '@/services/event.service'
import { taskService, type Task } from '@/services/taskService'
import { committeeService, type Committee } from '@/services/committee.service'
import { getCommitteeColor } from '@/utils/committee-colors'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { KPICard } from '@/components/monitoring/KPICard'
import { KanbanBoard } from '@/components/monitoring/KanbanBoard'
import { GanttTimeline } from '@/components/monitoring/GanttTimeline'
import { TaskTable } from '@/components/monitoring/TaskTable'
import { 
  ListTodo, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  LayoutGrid,
  GanttChart,
  Table
} from 'lucide-react'
import { useAdvancedFilters } from '@/hooks/useAdvancedFilters'
import { FiltersBar } from '@/components/filters'

// ============================================
// INTERFACES Y TIPOS
// ============================================

interface TaskWithProgress extends Task {
  progress_count?: number;
}

interface CommitteeWithColor extends Committee {
  color: string;
}

export const Route = createFileRoute('/_authenticated/coordinator/eventos/$eventId/monitoreo')({
  component: EventMonitoreoPage,
})

function EventMonitoreoPage() {
  const { eventId } = Route.useParams()
  const { setSelectedEvent, clearSelectedEvent } = useEventContext()
  const [event, setEvent] = useState<Event | null>(null)
  const [tasks, setTasks] = useState<TaskWithProgress[]>([])
  const [committees, setCommittees] = useState<CommitteeWithColor[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'kanban' | 'gantt'>('kanban')
  
  // Filtros avanzados
  const { filters, updateFilters, clearFilters } = useAdvancedFilters({
    initialFilters: { eventId: Number(eventId) },
    syncWithUrl: true,
    filterKey: 'monitoreo_filters'
  })
  
  const navigate = useNavigate()
  
  // Estadísticas del evento desde backend
  const [stats, setStats] = useState<{
    total_tasks: number
    completed_tasks: number
    in_progress_tasks: number
    delayed_tasks: number
    paused_tasks: number
    progress_percentage: number
    active_committees: number
    active_participants: number
  } | null>(null)

  // Función para cargar tareas con filtros
  const loadTasksWithFilters = async () => {
    try {
      const params: any = {
        event_id: Number(eventId),
      }
      
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
        if (filters.dateFrom) params.due_date_from = filters.dateFrom
        if (filters.dateTo) params.due_date_to = filters.dateTo
      }

      // Filtro por responsable
      if (filters.assignedToId) {
        params.assigned_to_id = filters.assignedToId
      }
      
      const tasksResponse = await taskService.getTasks(params)
      const allTasks = Array.isArray(tasksResponse) ? tasksResponse : []
      
      // Agregar contador de progreso a cada tarea
      const tasksWithProgress = allTasks.map((task: any) => ({
        ...task,
        progress_count: task.progress?.length || 0
      }))
      
      setTasks(tasksWithProgress)
      
      // Actualizar miembros desde las tareas cargadas
      const uniqueMembers = new Map()
      tasksWithProgress.forEach((task: any) => {
        if (task.assigned_to_id && task.assigned_to) {
          uniqueMembers.set(task.assigned_to_id, {
            id: task.assigned_to_id,
            name: task.assigned_to.name,
            email: task.assigned_to.email
          })
        }
      })
      setMembers(Array.from(uniqueMembers.values()))
    } catch (error) {
      console.error('Error loading tasks with filters:', error)
      toast.error('Error al cargar las tareas')
    }
  }

  useEffect(() => {
    const loadEventData = async () => {
      try {
        setLoading(true)
        
        // ============================================
        // CARGAR DATOS DEL EVENTO (REAL - desde backend)
        // ============================================
        const eventResponse = await eventService.getEvent(Number(eventId))
        if (eventResponse.success) {
          setEvent(eventResponse.data)
          setSelectedEvent(eventResponse.data.id, eventResponse.data.name)
        }

        // Cargar estadísticas del evento
        try {
          const statsResponse = await eventService.getEventStatistics(Number(eventId))
          if (statsResponse?.success && statsResponse.data) {
            setStats(statsResponse.data)
          } else {
            setStats(null)
          }
        } catch (_err) {
          setStats(null)
        }

        // ============================================
        // CARGAR COMITÉS DEL EVENTO
        // ============================================
        const committeesResponse = await committeeService.getCommittees({ event_id: Number(eventId) })
        const committeesData = committeesResponse.data || []
        
        // Agregar colores determinísticos a los comités
        const committeesWithColors = committeesData.map((committee: Committee) => ({
          ...committee,
          color: getCommitteeColor(committee.name, committee.id).card.replace('border-', '').replace('-200', '')
        }))
        setCommittees(committeesWithColors)

        // ============================================
        // CARGAR TAREAS CON FILTROS AVANZADOS
        // ============================================
        await loadTasksWithFilters()

      } catch (error) {
        console.error('Error loading event data:', error)
        toast.error('Error al cargar los datos del evento')
      } finally {
        setLoading(false)
      }
    }

    loadEventData()

    return () => {
      clearSelectedEvent()
    }
  }, [eventId, setSelectedEvent, clearSelectedEvent])

  // Recargar tareas cuando cambien los filtros
  useEffect(() => {
    if (committees.length > 0 && !loading) {
      loadTasksWithFilters()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  // ============================================
  // DATOS REALES CARGADOS DESDE BACKEND
  // ============================================
  // Las tareas ya vienen filtradas del backend, solo usamos las tareas cargadas
  const filteredTasks = tasks

  // Calcular KPIs (preferir estadísticas del backend)
  const kpis = {
    total: stats?.total_tasks ?? filteredTasks.length,
    completed: stats?.completed_tasks ?? filteredTasks.filter(t => t.status === 'Completed').length,
    inProgress: stats?.in_progress_tasks ?? filteredTasks.filter(t => t.status === 'InProgress').length,
    overdue: filteredTasks.filter(t => {
      const dueDate = new Date(t.due_date)
      return dueDate < new Date() && t.status !== 'Completed'
    }).length,
    progress: (stats?.progress_percentage !== undefined ? Math.round(stats.progress_percentage) : ((filteredTasks.length > 0 
      ? Math.round((filteredTasks.filter(t => t.status === 'Completed').length / filteredTasks.length) * 100)
      : 0)))
  }

  if (loading) {
    return (
      <DashboardLayout showFooter={false}>
        <DashboardContent
          title="Cargando..."
          description="Monitoreo del evento"
        >
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando datos de monitoreo...</p>
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
          description="Monitoreo del evento"
        >
          <div className="container mx-auto py-6">
            <p className="text-center text-muted-foreground">Evento no encontrado</p>
          </div>
        </DashboardContent>
      </DashboardLayout>
    )
  }

  return (
    <PermissionGuard permission="events.tasks.manage">
      <DashboardLayout showFooter={true}>
        <DashboardContent
          title="Monitoreo"
          description={`Seguimiento y análisis de ${event.name}`}
        >
          <div className="space-y-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: `/coordinator/eventos/${eventId}` })}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Evento
            </Button>

            {/* Filtros Bar - Cumple con ISO 9241-110 */}
            <FiltersBar
              filters={filters}
              onFiltersChange={updateFilters}
              onClearFilters={clearFilters}
              committees={committees.map(c => ({ id: c.id, name: c.name }))}
              members={members.map(m => ({ id: m.id, name: m.name, email: m.email }))}
              statusOptions={[
                { value: 'Pending', label: 'Pendiente' },
                { value: 'InProgress', label: 'En Progreso' },
                { value: 'Completed', label: 'Completada' },
                { value: 'Delayed', label: 'Retrasada' },
                { value: 'Paused', label: 'Pausada' },
              ]}
              showCommittees={true}
              showStatuses={true}
              showDates={true}
              showAssignedTo={true}
              dateLabel="Fecha de vencimiento"
              resultsCount={filteredTasks.length}
              totalCount={tasks.length}
              eventStartDate={event?.start_date}
              eventEndDate={event?.end_date}
            />

            {/* KPIs */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <KPICard
                  title="Tareas Totales"
                  value={kpis.total}
                  subtitle={`${kpis.completed} completadas`}
                  icon={<ListTodo className="w-5 h-5" />}
                />
                <KPICard
                  title="Completadas"
                  value={kpis.completed}
                  subtitle={`${kpis.total - kpis.completed} pendientes`}
                  variant="success"
                  icon={<CheckCircle2 className="w-5 h-5" />}
                />
                <KPICard
                  title="En Progreso"
                  value={kpis.inProgress}
                  subtitle="Tareas activas"
                  variant="default"
                  icon={<Clock className="w-5 h-5" />}
                />
                <KPICard
                  title="Atrasadas"
                  value={kpis.overdue}
                  subtitle="Requieren atención"
                  variant="danger"
                  icon={<AlertTriangle className="w-5 h-5" />}
                />
              </div>

              {/* View Tabs */}
              <Tabs value={view} onValueChange={(v) => setView(v as any)}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Visualización de Tareas</h2>
                  <TabsList>
                    <TabsTrigger value="kanban" className="gap-2">
                      <LayoutGrid className="w-4 h-4" />
                      Kanban
                    </TabsTrigger>
                    <TabsTrigger value="gantt" className="gap-2">
                      <GanttChart className="w-4 h-4" />
                      Cronograma
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="kanban" className="mt-0">
                  <div className="border border-border/50 rounded-lg bg-card/30 overflow-hidden">
                    <KanbanBoard 
                      tasks={filteredTasks.map(t => ({ ...t, committee_id: t.committee_id ?? 0 })) as Task[]} 
                      committees={committees} 
                      members={members} 
                    />
                  </div>
                </TabsContent>

                <TabsContent value="gantt" className="mt-0">
                  <div className="border border-border/50 rounded-lg bg-card/30 overflow-hidden">
                    <GanttTimeline 
                      tasks={filteredTasks.map(t => ({ 
                        id: t.id,
                        title: t.title,
                        status: t.status,
                        committee_id: t.committee_id ?? 0,
                        due_date: t.due_date,
                        created_at: t.created_at
                      }))} 
                      committees={committees} 
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {/* Task Table */}
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Table className="w-4 h-4" />
                  <h2 className="text-lg font-semibold">Lista Detallada de Tareas</h2>
                </div>
                <TaskTable 
                  tasks={filteredTasks.map(t => ({ ...t, committee_id: t.committee_id ?? 0 })) as Task[]} 
                  committees={committees} 
                  members={members} 
                />
              </div>
            </div>
          </div>
        </DashboardContent>
      </DashboardLayout>
    </PermissionGuard>
  )
}
