import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  FolderKanban,
  Plus,
  ListTodo,
  AlertTriangle,
  CheckCircle2,
  Clock,
  GripVertical,
  List,
  LayoutGrid,
  Users,
} from 'lucide-react'
import { committeeService, type Committee } from '@/services/committee.service'
import { taskService, type Task, type CreateTaskData } from '@/services/taskService'
import { eventService, type Event } from '@/services/event.service'
import { DatePicker } from '@/components/ui/date-picker'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'

interface TaskBankManagerProps {
  eventId: number
  filter?: 'overdue'
  onClearFilter?: () => void
}

type ViewMode = 'drag-drop' | 'list'

// Componente de tarjeta de tarea arrastrable
function DraggableTaskCard({ task, onViewDetails }: { task: Task; onViewDetails?: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useDraggable({ id: task.id.toString() })

  const getStatusConfig = (status: Task['status']) => {
    const configs = {
      Pending: { label: 'Pendiente', color: 'bg-gray-100 text-gray-800', icon: Clock },
      InProgress: { label: 'En Progreso', color: 'bg-blue-100 text-blue-800', icon: Clock },
      Completed: { label: 'Completada', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      Delayed: { label: 'Retrasada', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
      Paused: { label: 'Pausada', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    }
    return configs[status]
  }

  const getRiskLevelConfig = (riskLevel: Task['risk_level']) => {
    const configs = {
      Low: { label: 'Bajo', color: 'bg-green-100 text-green-800' },
      Medium: { label: 'Medio', color: 'bg-yellow-100 text-yellow-800' },
      High: { label: 'Alto', color: 'bg-red-100 text-red-800' },
    }
    return configs[riskLevel]
  }

  const statusConfig = getStatusConfig(task.status)
  const riskConfig = getRiskLevelConfig(task.risk_level)
  const StatusIcon = statusConfig.icon

  return (
    <Card
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className={`hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing ${isDragging ? 'ring-2 ring-primary' : ''} touch-none`}
    >
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <div className="text-muted-foreground hover:text-foreground mt-1">
            <GripVertical className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-lg truncate">{task.title}</h4>
              <Badge className={statusConfig.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
              <Badge className={riskConfig.color}>
                {riskConfig.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {task.description}
            </p>
            <p className="text-xs text-muted-foreground">
              Fecha límite: {new Date(task.due_date).toLocaleDateString('es-ES')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Componente de tarjeta de tarea para vista lista
function ListTaskCard({
  task,
  isSelected,
  onSelect,
}: {
  task: Task
  isSelected: boolean
  onSelect: (selected: boolean) => void
}) {
  const getStatusConfig = (status: Task['status']) => {
    const configs = {
      Pending: { label: 'Pendiente', color: 'bg-gray-100 text-gray-800', icon: Clock },
      InProgress: { label: 'En Progreso', color: 'bg-blue-100 text-blue-800', icon: Clock },
      Completed: { label: 'Completada', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      Delayed: { label: 'Retrasada', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
      Paused: { label: 'Pausada', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    }
    return configs[status]
  }

  const getRiskLevelConfig = (riskLevel: Task['risk_level']) => {
    const configs = {
      Low: { label: 'Bajo', color: 'bg-green-100 text-green-800' },
      Medium: { label: 'Medio', color: 'bg-yellow-100 text-yellow-800' },
      High: { label: 'Alto', color: 'bg-red-100 text-red-800' },
    }
    return configs[riskLevel]
  }

  const statusConfig = getStatusConfig(task.status)
  const riskConfig = getRiskLevelConfig(task.risk_level)
  const StatusIcon = statusConfig.icon

  return (
    <Card className={`hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(checked === true)}
            className="mt-1"
          />
          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-lg">{task.title}</h4>
              <Badge className={statusConfig.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
              <Badge className={riskConfig.color}>
                {riskConfig.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {task.description}
            </p>
            <p className="text-xs text-muted-foreground">
              Fecha límite: {new Date(task.due_date).toLocaleDateString('es-ES')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Componente de columna de comité (drop zone)
function CommitteeColumn({
  committee,
  tasks,
}: {
  committee: Committee
  tasks: Task[]
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: committee.id.toString(),
  })

  return (
    <Card
      ref={setNodeRef}
      className={`h-full min-h-[400px] transition-colors ${
        isOver ? 'border-primary border-2 bg-primary/5' : ''
      }`}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" />
          {committee.name}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {committee.members_count} {committee.members_count === 1 ? 'miembro' : 'miembros'}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {tasks.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
              <p className="text-sm">Arrastra tareas aquí</p>
            </div>
          ) : (
            tasks.map((task) => (
              <Card key={task.id} className="p-3">
                <div className="space-y-1">
                  <h5 className="font-medium text-sm">{task.title}</h5>
                  <Badge variant="outline" className="text-xs">
                    {task.status}
                  </Badge>
                </div>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function TaskBankManager({ eventId, filter, onClearFilter }: TaskBankManagerProps) {
  const [committees, setCommittees] = useState<Committee[]>([])
  const [eventTasks, setEventTasks] = useState<Task[]>([]) // Tareas sin comité (banco de tareas)
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingCommittees, setLoadingCommittees] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set())
  const [assigning, setAssigning] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('drag-drop')
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)

  // Form state para crear tarea
  const [taskForm, setTaskForm] = useState<CreateTaskData>({
    title: '',
    description: '',
    due_date: '',
    event_id: eventId,
  })

  // Sensors para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

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
      // Cargar solo tareas del evento sin comité asignado (banco de tareas)
        const allTasks = await taskService.getTasks({ event_id: eventId })
      const tasksWithoutCommittee = allTasks.filter((t) => !t.committee_id)
        setEventTasks(tasksWithoutCommittee)
    } catch (_error) {
      toast.error('Error al cargar las tareas')
      setEventTasks([])
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

  const handleCreateTask = async () => {
    try {
      if (!taskForm.title || !taskForm.description || !taskForm.due_date) {
        toast.error('Por favor completa todos los campos requeridos')
        return
      }

      // Crear tarea SIN comité (banco de tareas)
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
      loadTasks()
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
      await loadTasks() // Recargar para remover la tarea del banco
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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTaskId(null)
    const { active, over } = event

    if (!over) return

    const taskId = Number(active.id)
    const committeeId = Number(over.id)

    // Verificar que el over es un comité (no otra tarea)
    if (committees.some((c) => c.id === committeeId)) {
      handleAssignTaskToCommittee(taskId, committeeId)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTasks(new Set(eventTasks.map((t) => t.id)))
    } else {
      setSelectedTasks(new Set())
    }
  }

  const filteredTasks =
    filter === 'overdue'
      ? eventTasks.filter((t) => new Date(t.due_date) < new Date() && t.status !== 'Completed')
      : eventTasks

  const activeTask = activeTaskId ? eventTasks.find((t) => t.id.toString() === activeTaskId) : null

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
      {/* Header con crear tarea y selector de vista */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5" />
              Banco de Tareas
            </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Repositorio de tareas del evento. Crea tareas y asígnalas a comités.
              </p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Tarea
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList>
              <TabsTrigger value="drag-drop" className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                Arrastrar y Soltar
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Vista Lista
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Vista Drag & Drop (Kanban) */}
      {viewMode === 'drag-drop' && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Columna: Banco de Tareas */}
            <Card className="h-full">
          <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListTodo className="h-5 w-5" />
                  Banco de Tareas
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {filteredTasks.length} {filteredTasks.length === 1 ? 'tarea' : 'tareas'} disponible{filteredTasks.length > 1 ? 's' : ''}
                </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-muted-foreground text-sm">Cargando tareas...</p>
                </div>
              </div>
                ) : filteredTasks.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <ListTodo className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No hay tareas en el banco</h3>
                <p className="text-muted-foreground mb-4">
                  Crea tareas del evento para luego asignarlas a comités
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primera Tarea
                </Button>
              </div>
                        ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <DraggableTaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

            {/* Columnas de Comités */}
            {committees.length === 0 ? (
              <Card className="h-full">
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No hay comités creados</h3>
                    <p className="text-muted-foreground">
                      Crea un comité primero para poder asignar tareas
                          </p>
                      </div>
                    </CardContent>
                  </Card>
            ) : (
              <div className="space-y-4">
            <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Comités</h3>
                  <p className="text-sm text-muted-foreground">
                    Arrastra tareas desde el banco a los comités
                </p>
              </div>
                <div className="grid grid-cols-1 gap-4 max-h-[600px] overflow-y-auto">
                  {committees.map((committee) => (
                    <CommitteeColumn
                      key={committee.id}
                      committee={committee}
                      tasks={[]} // Las tareas asignadas se muestran en otra vista
                    />
                  ))}
                </div>
              </div>
            )}
              </div>

          <DragOverlay>
            {activeTask ? (
              <Card className="opacity-90 rotate-3 shadow-lg">
                      <CardContent className="pt-6">
                            <div className="flex items-center gap-2">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                    <h4 className="font-semibold">{activeTask.title}</h4>
                        </div>
                      </CardContent>
                    </Card>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Vista Lista con Selección Múltiple */}
      {viewMode === 'list' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ListTodo className="h-5 w-5" />
                  Banco de Tareas
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {filteredTasks.length} {filteredTasks.length === 1 ? 'tarea' : 'tareas'} disponible{filteredTasks.length > 1 ? 's' : ''}
                  {selectedTasks.size > 0 && (
                    <span className="ml-2 text-primary font-medium">
                      • {selectedTasks.size} seleccionada{selectedTasks.size > 1 ? 's' : ''}
                    </span>
                  )}
                </p>
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
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-muted-foreground text-sm">Cargando tareas...</p>
                </div>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <ListTodo className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No hay tareas en el banco</h3>
                <p className="text-muted-foreground mb-4">
                  Crea tareas del evento para luego asignarlas a comités
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primera Tarea
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
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
              <div className="space-y-3">
                  {filteredTasks.map((task) => (
                    <ListTaskCard
                      key={task.id}
                      task={task}
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
                    />
                  ))}
                        </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Diálogo para crear tarea */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Nueva Tarea en el Banco</DialogTitle>
            <DialogDescription>
              Crea una nueva tarea para el evento. Podrás asignarla a un comité más tarde desde el banco de tareas.
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
                  // Solo permitir fechas dentro del rango del evento
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
    </div>
  )
}
