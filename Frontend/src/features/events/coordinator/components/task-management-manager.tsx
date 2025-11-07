import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  FolderKanban,
  Plus,
  ListTodo,
  Edit,
  Trash2,
  MoreVertical,
  Filter,
  X,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Pause,
} from 'lucide-react'
import { taskService, type Task, type CreateTaskData, type UpdateTaskData } from '@/services/taskService'
import { eventService, type Event } from '@/services/event.service'
import { committeeService, type Committee } from '@/services/committee.service'
import { DatePicker } from '@/components/ui/date-picker'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { TaskCard } from '@/components/tasks/TaskCard'
import { TaskProgressHistory } from '@/components/monitoring/TaskProgressHistory'

interface TaskManagementManagerProps {
  eventId: number
}

type StatusFilter = 'all' | 'Pending' | 'InProgress' | 'Completed' | 'Delayed' | 'Paused'
type CommitteeFilter = 'all' | 'unassigned' | number

export function TaskManagementManager({ eventId }: TaskManagementManagerProps) {
  const navigate = useNavigate()
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [committees, setCommittees] = useState<Committee[]>([])
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set())
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [progressHistoryOpen, setProgressHistoryOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)

  // Filtros
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [committeeFilter, setCommitteeFilter] = useState<CommitteeFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Form state para editar tarea
  const [editForm, setEditForm] = useState<UpdateTaskData>({
    title: '',
    description: '',
    due_date: '',
    status: 'Pending',
  })

  const loadEvent = useCallback(async () => {
    try {
      const response = await eventService.getEvent(eventId)
      if (response.success) {
        setEvent(response.data)
      }
    } catch (_error) {
      console.error('Error loading event:', _error)
    }
  }, [eventId])

  const loadCommittees = useCallback(async () => {
    try {
      const response = await committeeService.getCommittees({ event_id: eventId })
      if (response.success) {
        setCommittees(response.data)
      }
    } catch (_error) {
      toast.error('Error al cargar los comités')
    }
  }, [eventId])

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true)
      const tasks = await taskService.getTasks({ event_id: eventId })
      setAllTasks(Array.isArray(tasks) ? tasks : [])
    } catch (_error) {
      toast.error('Error al cargar las tareas')
      setAllTasks([])
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    loadEvent()
    loadCommittees()
    loadTasks()
  }, [loadEvent, loadCommittees, loadTasks])

  // Aplicar filtros a las tareas
  const filteredTasks = allTasks.filter((task) => {
    // Filtro por estado
    if (statusFilter !== 'all' && task.status !== statusFilter) return false

    // Filtro por comité
    if (committeeFilter === 'unassigned' && task.committee_id) return false
    if (committeeFilter === 'all') {
      // Mostrar todas
    } else if (typeof committeeFilter === 'number' && task.committee_id !== committeeFilter) {
      return false
    }

    // Filtro por búsqueda
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !task.description.toLowerCase().includes(searchQuery.toLowerCase())) return false

    return true
  })

  const handleEditTask = (task: Task) => {
    setSelectedTask(task)
    setEditForm({
      title: task.title,
      description: task.description,
      due_date: task.due_date,
      status: task.status,
    })
    setEditDialogOpen(true)
  }

  const handleUpdateTask = async () => {
    if (!selectedTask) return

    try {
      if (!editForm.title || !editForm.description || !editForm.due_date) {
        toast.error('Por favor completa todos los campos requeridos')
        return
      }

      await taskService.updateTask(selectedTask.id, editForm)
      toast.success('Tarea actualizada exitosamente')
      setEditDialogOpen(false)
      setSelectedTask(null)
      await loadTasks()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar la tarea')
    }
  }

  const handleDeleteTask = async () => {
    if (!taskToDelete) return

    try {
      await taskService.deleteTask(taskToDelete.id)
      toast.success('Tarea eliminada exitosamente')
      setDeleteDialogOpen(false)
      setTaskToDelete(null)
      await loadTasks()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar la tarea')
    }
  }

  const handleViewProgress = (task: Task) => {
    setSelectedTask(task)
    setProgressHistoryOpen(true)
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

  // Estadísticas
  const stats = {
    total: allTasks.length,
    unassigned: allTasks.filter(t => !t.committee_id).length,
    assigned: allTasks.filter(t => t.committee_id).length,
    completed: allTasks.filter(t => t.status === 'Completed').length,
    inProgress: allTasks.filter(t => t.status === 'InProgress').length,
    overdue: allTasks.filter(t => {
      const dueDate = new Date(t.due_date)
      return dueDate < new Date() && t.status !== 'Completed'
    }).length,
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ListTodo className="h-5 w-5" />
                Gestión de Tareas
              </CardTitle>
              <CardDescription className="mt-1">
                Ver y editar todas las tareas del evento
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.unassigned}</div>
              <div className="text-xs text-muted-foreground">Sin Asignar</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.assigned}</div>
              <div className="text-xs text-muted-foreground">Asignadas</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.completed}</div>
              <div className="text-xs text-muted-foreground">Completadas</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{stats.inProgress}</div>
              <div className="text-xs text-muted-foreground">En Progreso</div>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
              <div className="text-xs text-muted-foreground">Vencidas</div>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Input
                  id="search"
                  placeholder="Buscar por título o descripción..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            
            <div className="min-w-[150px]">
              <Label>Estado</Label>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as StatusFilter)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Pending">Pendiente</SelectItem>
                  <SelectItem value="InProgress">En Progreso</SelectItem>
                  <SelectItem value="Completed">Completada</SelectItem>
                  <SelectItem value="Delayed">Retrasada</SelectItem>
                  <SelectItem value="Paused">Pausada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[150px]">
              <Label>Comité</Label>
              <Select
                value={committeeFilter === 'all' ? 'all' : committeeFilter === 'unassigned' ? 'unassigned' : committeeFilter.toString()}
                onValueChange={(v) => {
                  if (v === 'all') {
                    setCommitteeFilter('all')
                  } else if (v === 'unassigned') {
                    setCommitteeFilter('unassigned')
                  } else {
                    setCommitteeFilter(Number(v))
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="unassigned">Sin Asignar</SelectItem>
                  {committees.map((committee) => (
                    <SelectItem key={committee.id} value={committee.id.toString()}>
                      {committee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(searchQuery || statusFilter !== 'all' || committeeFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                  setCommitteeFilter('all')
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Limpiar Filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de tareas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
            Tareas ({filteredTasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando tareas...</p>
              </div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <ListTodo className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay tareas</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== 'all' || committeeFilter !== 'all'
                  ? 'No se encontraron tareas con los filtros aplicados'
                  : 'No hay tareas en este evento'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => {
                const committee = committees.find(c => c.id === task.committee_id)
                return (
                  <div key={task.id} className="relative">
                    <TaskCard
                      task={task}
                      committees={[]}
                      showCheckbox={false}
                      showCommitteeActions={false}
                      onViewProgress={handleViewProgress}
                      expandedTasks={expandedTasks}
                      onToggleExpand={toggleTaskExpansion}
                    />
                    <div className="absolute top-2 right-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEditTask(task)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar Tarea
                          </DropdownMenuItem>
                          {task.committee_id && committee && (
                            <DropdownMenuItem
                              onClick={() => navigate({ to: `/coordinator/eventos/${eventId}/comites/${committee.id}` })}
                            >
                              <FolderKanban className="h-4 w-4 mr-2" />
                              Ver Comité: {committee.name}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setTaskToDelete(task)
                              setDeleteDialogOpen(true)
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar Tarea
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de edición */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Tarea</DialogTitle>
            <DialogDescription>
              Modifica los datos de la tarea
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Título *</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="Ej: Preparar presentación"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descripción *</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Describe los detalles de la tarea..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-due_date">Fecha Límite *</Label>
                <DatePicker
                  selected={editForm.due_date ? new Date(editForm.due_date) : undefined}
                  onSelect={(date) => {
                    setEditForm({ 
                      ...editForm, 
                      due_date: date ? format(date, 'yyyy-MM-dd') : '' 
                    })
                  }}
                  placeholder="Seleccionar fecha límite"
                  minDate={event?.start_date ? new Date(event.start_date) : undefined}
                  maxDate={event?.end_date ? new Date(event.end_date) : undefined}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Estado *</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(v) => setEditForm({ ...editForm, status: v as Task['status'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pendiente</SelectItem>
                    <SelectItem value="InProgress">En Progreso</SelectItem>
                    <SelectItem value="Completed">Completada</SelectItem>
                    <SelectItem value="Delayed">Retrasada</SelectItem>
                    <SelectItem value="Paused">Pausada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateTask}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Tarea</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar la tarea "{taskToDelete?.title}"? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteTask}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de historial de avances */}
      <TaskProgressHistory
        task={selectedTask}
        open={progressHistoryOpen}
        onOpenChange={setProgressHistoryOpen}
      />
    </div>
  )
}

