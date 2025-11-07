import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
  Users,
  MoreVertical,
  TrendingUp,
} from 'lucide-react'
import { committeeService, type Committee } from '@/services/committee.service'
import { taskService, type Task, type CreateTaskData } from '@/services/taskService'
import { eventService, type Event } from '@/services/event.service'
import { DatePicker } from '@/components/ui/date-picker'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { TaskCard } from '@/components/tasks/TaskCard'
import { TaskProgressHistory } from '@/components/monitoring/TaskProgressHistory'

interface TaskBankManagerProps {
  eventId: number
  filter?: 'overdue'
  onClearFilter?: () => void
}


export function TaskBankManager({ eventId, filter }: TaskBankManagerProps) {
  const [committees, setCommittees] = useState<Committee[]>([])
  const [unassignedTasks, setUnassignedTasks] = useState<Task[]>([]) // Solo tareas sin comité
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingCommittees, setLoadingCommittees] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set())
  const [assigning, setAssigning] = useState(false)
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set())
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [progressHistoryOpen, setProgressHistoryOpen] = useState(false)

  // Sin filtros - solo asignación

  // Form state para crear tarea
  const [taskForm, setTaskForm] = useState<CreateTaskData>({
    title: '',
    description: '',
    due_date: '',
    event_id: eventId,
  })

  const loadCommittees = useCallback(async () => {
    try {
      setLoadingCommittees(true)
      const response = await committeeService.getCommittees({ event_id: eventId })
      if (response.success) {
        setCommittees(response.data)
      }
    } catch (_error) {
      toast.error('Error al cargar los comités')
    } finally {
      setLoadingCommittees(false)
    }
  }, [eventId])

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

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true)
      // Cargar TODAS las tareas del evento y filtrar solo las sin comité
      const tasks = await taskService.getTasks({ event_id: eventId })
      const allTasksArray = Array.isArray(tasks) ? tasks : []
      // Filtrar solo tareas sin comité asignado
      const unassigned = allTasksArray.filter(task => !task.committee_id)
      setUnassignedTasks(unassigned)
    } catch (_error) {
      toast.error('Error al cargar las tareas')
      setUnassignedTasks([])
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    loadEvent()
  }, [loadEvent])

  useEffect(() => {
    loadCommittees()
  }, [loadCommittees])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  // Mostrar todas las tareas sin comité (sin filtros)
  const filteredTasks = unassignedTasks.filter((task) => {
    // Solo filtrar por vencidas si viene del prop
    if (filter === 'overdue') {
      const dueDate = new Date(task.due_date)
      if (dueDate >= new Date() || task.status === 'Completed') return false
    }
    return true
  })

  const handleCreateTask = async () => {
    try {
      if (!taskForm.title || !taskForm.description || !taskForm.due_date) {
        toast.error('Por favor completa todos los campos requeridos')
        return
      }

      await taskService.createTask({
        ...taskForm,
        event_id: eventId,
        committee_id: undefined, // No asignar a comité
      })

      toast.success('Tarea creada en el banco exitosamente')
      setCreateDialogOpen(false)
      setTaskForm({
        title: '',
        description: '',
        due_date: '',
        event_id: eventId,
      })
      await loadTasks()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear la tarea')
    }
  }

  const handleAssignTaskToCommittee = async (taskId: number, committeeId: number) => {
    if (assigning) return
    
    try {
      setAssigning(true)
      await taskService.updateTask(taskId, { committee_id: committeeId })
      toast.success('Tarea asignada al comité exitosamente')
      await loadTasks()
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.committee_id?.[0] ||
        'Error al asignar la tarea'
      toast.error(errorMessage)
    } finally {
      setAssigning(false)
    }
  }

  const handleAssignSelectedTasks = async (committeeId: number) => {
    if (selectedTasks.size === 0) {
      toast.error('Selecciona al menos una tarea')
      return
    }

    if (assigning) return

    try {
      setAssigning(true)
      const promises = Array.from(selectedTasks).map((taskId) =>
        taskService.updateTask(taskId, { committee_id: committeeId })
      )
      await Promise.all(promises)
      toast.success(`${selectedTasks.size} tarea${selectedTasks.size > 1 ? 's' : ''} asignada${selectedTasks.size > 1 ? 's' : ''} exitosamente`)
      setSelectedTasks(new Set())
      setAssignDialogOpen(false)
      await loadTasks()
    } catch (error: any) {
      toast.error('Error al asignar las tareas')
    } finally {
      setAssigning(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTasks(new Set(filteredTasks.map((t) => t.id)))
    } else {
      setSelectedTasks(new Set())
    }
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



  if (loadingCommittees) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando comités...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas y acciones */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5" />
                Banco de Tareas
              </CardTitle>
              <CardDescription className="mt-1">
                Asigna tareas sin comité a los comités del evento
              </CardDescription>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Tarea
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {filteredTasks.length === 0 
              ? 'No hay tareas sin asignar a comités' 
              : `${filteredTasks.length} ${filteredTasks.length === 1 ? 'tarea sin asignar' : 'tareas sin asignar'}`
            }
          </p>
        </CardContent>
      </Card>

      {/* Lista de tareas con divulgación progresiva */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ListTodo className="h-5 w-5" />
                Tareas ({filteredTasks.length})
              </CardTitle>
              {selectedTasks.size > 0 && (
                <CardDescription className="mt-1">
                  {selectedTasks.size} tarea{selectedTasks.size > 1 ? 's' : ''} seleccionada{selectedTasks.size > 1 ? 's' : ''}
                </CardDescription>
              )}
            </div>
            {selectedTasks.size > 0 && (
              <Button
                onClick={() => setAssignDialogOpen(true)}
                disabled={committees.length === 0}
              >
                <Users className="h-4 w-4 mr-2" />
                Asignar Seleccionadas ({selectedTasks.size})
              </Button>
            )}
          </div>
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
                No hay tareas sin asignar a comités. Puedes crear nuevas tareas para asignarlas.
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Tarea
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Seleccionar todo */}
              <div className="flex items-center gap-2 pb-2 border-b">
                <Checkbox
                  checked={selectedTasks.size === filteredTasks.length && filteredTasks.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <Label className="text-sm font-medium cursor-pointer">
                  Seleccionar todas ({filteredTasks.length})
                </Label>
              </div>

              {/* Lista de tareas */}
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  committees={committees}
                  eventId={eventId}
                  showCheckbox={true}
                  isSelected={selectedTasks.has(task.id)}
                  onSelect={(selected) => {
                    const newSelected = new Set(selectedTasks)
                    if (selected) {
                      newSelected.add(task.id)
                    } else {
                      newSelected.delete(task.id)
                    }
                    setSelectedTasks(newSelected)
                  }}
                  showCommitteeActions={true}
                  onAssignToCommittee={handleAssignTaskToCommittee}
                  onViewProgress={handleViewProgress}
                  expandedTasks={expandedTasks}
                  onToggleExpand={toggleTaskExpansion}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo para crear tarea */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Nueva Tarea</DialogTitle>
            <DialogDescription>
              Crea una nueva tarea para el evento. Podrás asignarla a un comité más tarde.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                placeholder="Ej: Preparar presentación"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción *</Label>
              <Textarea
                id="description"
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                placeholder="Describe los detalles de la tarea..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Fecha Límite *</Label>
              <DatePicker
                selected={taskForm.due_date ? new Date(taskForm.due_date) : undefined}
                onSelect={(date) => {
                  setTaskForm({ 
                    ...taskForm, 
                    due_date: date ? format(date, 'yyyy-MM-dd') : '' 
                  })
                }}
                placeholder="Seleccionar fecha límite"
                minDate={event?.start_date ? new Date(event.start_date) : undefined}
                maxDate={event?.end_date ? new Date(event.end_date) : undefined}
                disabled={(date) => {
                  if (event?.start_date) {
                    const startDate = new Date(event.start_date)
                    startDate.setHours(0, 0, 0, 0)
                    if (date < startDate) return true
                  }
                  if (event?.end_date) {
                    const endDate = new Date(event.end_date)
                    endDate.setHours(23, 59, 59, 999)
                    if (date > endDate) return true
                  }
                  return false
                }}
              />
              {event && (
                <p className="text-xs text-muted-foreground">
                  Período válido: {format(new Date(event.start_date), 'd MMM yyyy')} - {format(new Date(event.end_date), 'd MMM yyyy')}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateTask}>Crear Tarea</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para asignar tareas seleccionadas */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Tareas a Comité</DialogTitle>
            <DialogDescription>
              Selecciona el comité al que deseas asignar {selectedTasks.size}{' '}
              {selectedTasks.size === 1 ? 'tarea' : 'tareas'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Seleccionar Comité</Label>
              {committees.length === 0 ? (
                <div className="text-sm text-muted-foreground p-3 border rounded-lg">
                  No hay comités disponibles. Crea un comité primero.
                </div>
              ) : (
                <Select
                  disabled={assigning}
                  onValueChange={(v) => {
                    if (!assigning) {
                      handleAssignSelectedTasks(Number(v))
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={assigning ? 'Asignando...' : 'Selecciona un comité'} />
                  </SelectTrigger>
                  <SelectContent>
                    {committees.map((committee) => (
                      <SelectItem key={committee.id} value={committee.id.toString()}>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{committee.name}</span>
                          <Badge variant="secondary" className="ml-2">
                            {committee.members_count} {committee.members_count === 1 ? 'miembro' : 'miembros'}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setAssignDialogOpen(false)
              }}
              disabled={assigning}
            >
              Cancelar
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
