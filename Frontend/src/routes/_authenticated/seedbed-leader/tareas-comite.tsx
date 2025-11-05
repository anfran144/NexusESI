import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardContent } from '@/components/layout/dashboard-content'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LayoutList, LayoutGrid, UserPlus, Calendar, Clock, User, AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { taskService, type Task as BackendTask } from '@/services/taskService'

export const Route = createFileRoute('/_authenticated/seedbed-leader/tareas-comite')({
  component: TareasComiteComponent,
})

// ============================================
// TIPOS DE DATOS - ADAPTADOS DEL BACKEND
// ============================================
// Nota: Esta vista muestra tareas SIN ASIGNAR del comité
// para que el líder pueda reclamarlas (asignárselas a sí mismo)

interface CommitteeTask {
  id: number
  title: string
  description: string
  
  // PLACEHOLDER: Backend no tiene estado 'available'
  // Backend tiene: 'Pending' | 'InProgress' | 'Completed' | 'Delayed' | 'Paused'
  // Estado 'available' = tarea sin assigned_to_id (null)
  status: 'available' | 'assigned' | 'in_progress' | 'completed'
  
  // Niveles de riesgo del backend (adaptados a minúsculas)
  risk_level: 'low' | 'medium' | 'high'
  
  due_date: string
  
  // CAMPO CLAVE: assigned_to puede ser null (tarea disponible)
  assigned_to?: {
    id: number
    name: string
    email: string
  }
  
  created_at: string
  updated_at: string
  
  // Campo REAL del backend
  committee: {
    id: number
    name: string
    description?: string
  }
}

type ViewMode = 'list' | 'grid'

function TareasComiteComponent() {
  const { user } = useAuthStore()
  const [committeeTasks, setCommitteeTasks] = useState<CommitteeTask[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedTask, setSelectedTask] = useState<CommitteeTask | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [claimingTask, setClaimingTask] = useState<number | null>(null)

  useEffect(() => {
    loadCommitteeTasks()
  }, [user?.id])

  // ============================================
  // FUNCIÓN PRINCIPAL DE CARGA DE TAREAS
  // ============================================
  // Cargar tareas SIN ASIGNAR del comité del usuario
  // Nota: El backend NO tiene un endpoint específico para esto.
  // Se deben obtener todas las tareas y filtrar por assigned_to_id = null
  const loadCommitteeTasks = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // ============================================
      // CARGAR TAREAS SIN ASIGNAR DESDE EL BACKEND
      // ============================================
      // Solicitar tareas sin asignar del comité del líder
      // El backend filtrará automáticamente solo las tareas de los comités del usuario
      const backendTasks = await taskService.getTasks({ assigned_to_id: null })

      // Adaptar al formato de la vista
      const adaptedTasks: CommitteeTask[] = backendTasks.map((backendTask) => {
        // Adaptar niveles de riesgo
        const riskLevelMap: Record<BackendTask['risk_level'], CommitteeTask['risk_level']> = {
          'Low': 'low',
          'Medium': 'medium',
          'High': 'high'
        }

        // Determinar estado basado en assigned_to y status del backend
        let status: CommitteeTask['status'] = 'available'
        if (backendTask.status === 'Completed') status = 'completed'
        else if (backendTask.status === 'Pending' && !backendTask.assigned_to_id) status = 'available'
        else if (backendTask.status === 'InProgress' && backendTask.assigned_to_id) status = 'in_progress'
        else if (backendTask.assigned_to_id) status = 'assigned'

        return {
          id: backendTask.id,
          title: backendTask.title,
          description: backendTask.description,
          status,
          risk_level: riskLevelMap[backendTask.risk_level] || 'low',
          due_date: backendTask.due_date,
          assigned_to: backendTask.assigned_to,
          created_at: backendTask.created_at,
          updated_at: backendTask.updated_at,
          committee: backendTask.committee || {
            id: 0,
            name: 'Sin comité',
            description: ''
          }
        }
      })
      
      setCommitteeTasks(adaptedTasks)

      if (adaptedTasks.length === 0) {
        toast.info('No hay tareas disponibles para reclamar en este momento')
      }

    } catch (error) {
      console.error('Error cargando tareas del comité:', error)
      toast.error('Error al cargar las tareas del comité')
      setCommitteeTasks([])
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // FUNCIÓN: RECLAMAR TAREA (INTEGRADO CON BACKEND)
  // ============================================
  // Endpoint: POST /api/tasks/{id}/assign
  // Esta función permite al líder asignarse a sí mismo una tarea disponible
  const handleClaimTask = async (taskId: number) => {
    if (!user?.id) {
      toast.error('Usuario no autenticado')
      return
    }

    try {
      setClaimingTask(taskId)
      
      // ============================================
      // LLAMADA AL BACKEND REAL
      // ============================================
      await taskService.assignTask(taskId, user.id)
      
      toast.success('Tarea reclamada exitosamente. Ahora puedes verla en "Mis Tareas".')
      
      // Recargar las tareas disponibles (la reclamada ya no estará en la lista)
      await loadCommitteeTasks()
      
    } catch (error) {
      console.error('Error reclamando tarea:', error)
      toast.error('Error al reclamar la tarea')
    } finally {
      setClaimingTask(null)
    }
  }

  const handleViewTask = (task: CommitteeTask) => {
    setSelectedTask(task)
    setIsModalOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="outline" className="text-blue-600">Disponible</Badge>
      case 'assigned':
        return <Badge variant="secondary">Asignada</Badge>
      case 'in_progress':
        return <Badge variant="default" className="bg-blue-500">En Progreso</Badge>
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completada</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getRiskLevelBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50 dark:bg-green-950">Riesgo Bajo</Badge>
      case 'medium':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600 bg-yellow-50 dark:bg-yellow-950">Riesgo Medio</Badge>
      case 'high':
        return <Badge variant="outline" className="text-red-600 border-red-600 bg-red-50 dark:bg-red-950">Riesgo Alto</Badge>
      default:
        return <Badge variant="outline">{riskLevel}</Badge>
    }
  }


  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const TaskListView = ({ tasks }: { tasks: CommitteeTask[] }) => (
    <div className="space-y-4">
      {tasks.map((task) => (
        <Card key={task.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleViewTask(task)}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">{task.title}</CardTitle>
                <CardDescription>{task.description}</CardDescription>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Comité: {task.committee.name}</span>
                </div>
              </div>
               <div className="flex items-center gap-2">
                 {getStatusBadge(task.status)}
                 {getRiskLevelBadge(task.risk_level)}
               </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Vence: {formatDate(task.due_date)}</span>
                </div>
                {task.assigned_to ? (
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{task.assigned_to.name}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-blue-600">
                    <UserPlus className="h-4 w-4" />
                    <span>Sin asignar</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Creada: {formatDate(task.created_at)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const TaskGridView = ({ tasks }: { tasks: CommitteeTask[] }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tasks.map((task) => (
        <Card key={task.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleViewTask(task)}>
          <CardHeader>
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base line-clamp-2">{task.title}</CardTitle>
                 <div className="flex flex-col gap-1">
                   {getStatusBadge(task.status)}
                   {getRiskLevelBadge(task.risk_level)}
                 </div>
              </div>
              <CardDescription className="line-clamp-3">{task.description}</CardDescription>
              <div className="text-sm text-muted-foreground">
                <span>Comité: {task.committee.name}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Vence: {formatDate(task.due_date)}</span>
              </div>
              {task.assigned_to ? (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{task.assigned_to.name}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-blue-600">
                  <UserPlus className="h-4 w-4" />
                  <span>Sin asignar</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )


  if (loading) {
    return (
      <DashboardLayout>
        <DashboardContent title="Tareas del Comité" description="Cargando las tareas disponibles del comité...">
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Cargando tareas del comité...</p>
            </div>
          </div>
        </DashboardContent>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <DashboardContent title="Tareas del Comité" description="Gestiona las tareas sin asignar del comité organizador.">
        <div className="container mx-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Tareas del Comité</h1>
              <p className="text-sm text-muted-foreground">
                {committeeTasks.length} {committeeTasks.length === 1 ? "tarea sin asignar" : "tareas sin asignar"}
              </p>
            </div>

            <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("list")}
                className={cn("gap-2", viewMode === "list" && "bg-accent text-accent-foreground")}
              >
                <LayoutList className="h-4 w-4" />
                Lista
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("grid")}
                className={cn("gap-2", viewMode === "grid" && "bg-accent text-accent-foreground")}
              >
                <LayoutGrid className="h-4 w-4" />
                Cuadrícula
              </Button>
            </div>
          </div>

          {committeeTasks.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay tareas sin asignar</h3>
                <p className="text-muted-foreground">
                  No hay tareas del comité sin asignar en este momento.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {viewMode === "list" && <TaskListView tasks={committeeTasks} />}
              {viewMode === "grid" && <TaskGridView tasks={committeeTasks} />}
            </>
          )}

          {/* Modal de detalles de la tarea */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Detalles de la Tarea</DialogTitle>
                <DialogDescription>
                  Información completa de la tarea seleccionada
                </DialogDescription>
              </DialogHeader>
              
              {selectedTask && (
                <div className="space-y-6">
                  {/* Tarjeta V0 para tareas disponibles */}
                  {selectedTask.status === 'available' && (
                    <Card className="border-blue-500/20 bg-blue-500/5 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
                            <UserPlus className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">Tarea disponible</p>
                            <p className="text-xs text-muted-foreground">Esta tarea no tiene responsable asignado</p>
                          </div>
                        </div>
                        <Button 
                          onClick={() => {
                            handleClaimTask(selectedTask.id)
                            setIsModalOpen(false)
                          }}
                          disabled={claimingTask === selectedTask.id}
                          className="gap-2"
                        >
                          <UserPlus className="h-4 w-4" />
                          {claimingTask === selectedTask.id ? 'Reclamando...' : 'Reclamar tarea'}
                        </Button>
                      </div>
                    </Card>
                  )}

                  {/* Información principal */}
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold">{selectedTask.title}</h3>
                        <p className="text-muted-foreground">{selectedTask.description}</p>
                      </div>
                       <div className="flex items-center gap-2">
                         {getStatusBadge(selectedTask.status)}
                         {getRiskLevelBadge(selectedTask.risk_level)}
                       </div>
                    </div>

                    {/* Información del comité */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Comité Responsable</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div>
                            <span className="font-medium">Nombre:</span> {selectedTask.committee.name}
                          </div>
                          <div>
                            <span className="font-medium">Descripción:</span> {selectedTask.committee.description}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Información de asignación */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Asignación</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {selectedTask.assigned_to ? (
                            <>
                              <div>
                                <span className="font-medium">Asignado a:</span> {selectedTask.assigned_to.name}
                              </div>
                              <div>
                                <span className="font-medium">Email:</span> {selectedTask.assigned_to.email}
                              </div>
                            </>
                          ) : (
                            <div className="text-muted-foreground">
                              Esta tarea no tiene responsable asignado
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Fechas */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Fechas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div>
                            <span className="font-medium">Fecha de vencimiento:</span> {formatDate(selectedTask.due_date)}
                          </div>
                          <div>
                            <span className="font-medium">Creada:</span> {formatDate(selectedTask.created_at)}
                          </div>
                          <div>
                            <span className="font-medium">Última actualización:</span> {formatDate(selectedTask.updated_at)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </DashboardContent>
    </DashboardLayout>
  )
}
