import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardContent } from '@/components/layout/dashboard-content'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Editor } from '@/components/ui/editor'
import { 
  LayoutList, 
  LayoutGrid, 
  Kanban, 
  Calendar, 
  Clock, 
  User, 
  AlertCircle,
  CheckCircle,
  FileText,
  History,
  TrendingUp,
  AlertTriangle,
  Eye,
  Save
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { taskService, type Task as BackendTask, type TaskProgress as BackendTaskProgress, type Incident as BackendIncident } from '@/services/taskService'

export const Route = createFileRoute('/_authenticated/seedbed-leader/mis-tareas')({
  component: MisTareasComponent,
})

// ============================================
// TIPOS DE DATOS - ADAPTADOS DEL BACKEND
// ============================================
// Nota: Los estados del backend usan mayúsculas (InProgress, Completed, etc.)
// pero esta vista usa minúsculas para compatibilidad con el diseño original.
// Se realiza una adaptación automática en las funciones de carga.

interface Task {
  id: number
  title: string
  description: string
  
  // Estados del backend: 'Pending' | 'InProgress' | 'Completed' | 'Delayed' | 'Paused'
  // Vista usa: 'pending' | 'in_progress' | 'delayed' | 'paused' | 'completed'
  status: 'pending' | 'in_progress' | 'delayed' | 'paused' | 'completed'
  
  // Niveles de riesgo del backend: 'Low' | 'Medium' | 'High'
  // Vista usa: 'low' | 'medium' | 'high'
  risk_level: 'low' | 'medium' | 'high'
  
  due_date: string
  assigned_to: {
    id: number
    name: string
    email: string
  }
  created_at: string
  updated_at: string
  
  // Campo REAL del backend: progress (array de progresos)
  progress_history?: TaskProgress[]
  
  // Campo REAL del backend: incidents (array de incidencias)
  incidents?: Incident[]
}

interface TaskProgress {
  id: number
  task_id: number
  user_id: number
  description: string
  file_name?: string
  file_path?: string
  created_at: string
  user: {
    name: string
  }
}

interface Incident {
  id: number
  task_id: number
  reported_by_id: number
  description: string
  file_name?: string
  file_path?: string
  
  // Backend solo tiene: 'Reported' | 'Resolved'
  // Vista usa: 'reported' | 'investigating' | 'resolved'
  // PLACEHOLDER: 'investigating' no existe en backend
  status: 'reported' | 'investigating' | 'resolved'
  
  created_at: string
  reported_by: {
    name: string
  }
}

type ViewMode = 'list' | 'grid' | 'kanban'

// Componente independiente para el modal de detalles de tarea
const TaskDetailModal = ({ 
  selectedTask, 
  isOpen, 
  onClose, 
  onReportProgress, 
  onReportIncident, 
  onCompleteTask,
  progressDescription,
  setProgressDescription,
  incidentDescription,
  setIncidentDescription,
  selectedFile,
  setSelectedFile
}: {
  selectedTask: Task | null
  isOpen: boolean
  onClose: () => void
  onReportProgress: () => void
  onReportIncident: () => void
  onCompleteTask: () => void
  progressDescription: string
  setProgressDescription: (value: string) => void
  incidentDescription: string
  setIncidentDescription: (value: string) => void
  selectedFile: File | null
  setSelectedFile: (file: File | null) => void
}) => {
  if (!selectedTask) return null

  const hasActiveIncidents = selectedTask.incidents?.some(incident => 
    incident.status === 'reported' || incident.status === 'investigating'
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendiente</Badge>
      case 'in_progress':
        return <Badge variant="default" className="bg-blue-500">En Progreso</Badge>
      case 'delayed':
        return <Badge variant="destructive">Retrasada</Badge>
      case 'paused':
        return <Badge variant="outline" className="text-orange-600 border-orange-600">Pausada</Badge>
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] w-[95vw] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="truncate">{selectedTask.title}</span>
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            {selectedTask.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          <Tabs defaultValue="details" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 flex-shrink-0 h-auto">
              <TabsTrigger value="details" className="text-xs sm:text-sm py-2">
                Detalles
              </TabsTrigger>
              <TabsTrigger value="progress" disabled={hasActiveIncidents} className="text-xs sm:text-sm py-2">
                Avance
              </TabsTrigger>
              <TabsTrigger value="incident" className="text-xs sm:text-sm py-2">
                Incidencia
              </TabsTrigger>
              <TabsTrigger value="complete" disabled={hasActiveIncidents} className="text-xs sm:text-sm py-2">
                Completar
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 mt-4">
              <TabsContent value="details" className="space-y-4 sm:space-y-6">
                {/* Información básica */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1 sm:space-y-2">
                    <Label className="text-xs sm:text-sm font-medium">Estado</Label>
                    <div>{getStatusBadge(selectedTask.status)}</div>
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <Label className="text-xs sm:text-sm font-medium">Prioridad</Label>
                    <div>{getRiskLevelBadge(selectedTask.risk_level)}</div>
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <Label className="text-xs sm:text-sm font-medium">Fecha de Vencimiento</Label>
                    <div className="text-xs sm:text-sm">{formatDate(selectedTask.due_date)}</div>
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <Label className="text-xs sm:text-sm font-medium">Asignado a</Label>
                    <div className="text-xs sm:text-sm">{selectedTask.assigned_to.name}</div>
                  </div>
                </div>

                <Separator />

                {/* Historial de avances */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 sm:w-5 sm:h-5" />
                    <h3 className="text-base sm:text-lg font-semibold">Historial de Avances</h3>
                  </div>
                  
                  {selectedTask.progress_history && selectedTask.progress_history.length > 0 ? (
                    <div className="space-y-3">
                      {selectedTask.progress_history.map((progress) => (
                        <Card key={progress.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-full bg-blue-100">
                                <TrendingUp className="w-4 h-4 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <div 
                                  className="prose prose-sm max-w-none"
                                  dangerouslySetInnerHTML={{ __html: progress.description }}
                                />
                                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                  <span>Por: {progress.user.name}</span>
                                  <span>•</span>
                                  <span>{formatDate(progress.created_at)}</span>
                                  {progress.file_name && (
                                    <>
                                      <span>•</span>
                                      <span className="text-blue-600">{progress.file_name}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <TrendingUp className="w-8 h-8 mx-auto mb-2" />
                      <p>No hay avances reportados aún</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Incidencias */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                    <h3 className="text-base sm:text-lg font-semibold">Incidencias</h3>
                  </div>
                  
                  {selectedTask.incidents && selectedTask.incidents.length > 0 ? (
                    <div className="space-y-3">
                      {selectedTask.incidents.map((incident) => (
                        <Card key={incident.id} className="border-orange-200 bg-orange-50">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-full bg-orange-100">
                                <AlertTriangle className="w-4 h-4 text-orange-600" />
                              </div>
                              <div className="flex-1">
                                <div 
                                  className="prose prose-sm max-w-none"
                                  dangerouslySetInnerHTML={{ __html: incident.description }}
                                />
                                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                  <span>Reportado por: {incident.reported_by.name}</span>
                                  <span>•</span>
                                  <span>{formatDate(incident.created_at)}</span>
                                  <span>•</span>
                                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                                    {incident.status === 'reported' ? 'Reportado' : 
                                     incident.status === 'investigating' ? 'En Investigación' : 'Resuelto'}
                                  </Badge>
                                  {incident.file_name && (
                                    <>
                                      <span>•</span>
                                      <span className="text-orange-600">{incident.file_name}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                      <p>No hay incidencias reportadas</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="progress" className="space-y-4 sm:space-y-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                    <h3 className="text-base sm:text-lg font-semibold">Reportar Avance</h3>
                  </div>
                  
                  {hasActiveIncidents && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                        <p className="text-sm text-orange-800">
                          Esta tarea tiene incidencias activas. No puedes reportar avances hasta que se resuelvan.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="progress-description">Descripción del Avance</Label>
                      <Editor
                        content={progressDescription}
                        onChange={setProgressDescription}
                        placeholder="Describe el progreso realizado en esta tarea..."
                        className="min-h-[200px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="progress-file">Archivo Adjunto (Opcional)</Label>
                      <Input
                        id="progress-file"
                        type="file"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={onClose}>
                        Cancelar
                      </Button>
                      <Button 
                        onClick={onReportProgress}
                        disabled={hasActiveIncidents}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Reportar Avance
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="incident" className="space-y-4 sm:space-y-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                    <h3 className="text-base sm:text-lg font-semibold">Reportar Incidencia</h3>
                  </div>
                  
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                      <p className="text-sm text-orange-800">
                        Al reportar una incidencia, la tarea se pausará automáticamente hasta que se resuelva.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="incident-description">Descripción de la Incidencia</Label>
                      <Editor
                        content={incidentDescription}
                        onChange={setIncidentDescription}
                        placeholder="Describe el problema que impide continuar con la tarea..."
                        className="min-h-[200px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="incident-file">Archivo de Evidencia (Opcional)</Label>
                      <Input
                        id="incident-file"
                        type="file"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={onClose}>
                        Cancelar
                      </Button>
                      <Button 
                        onClick={onReportIncident} 
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Reportar Incidencia
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="complete" className="space-y-4 sm:space-y-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    <h3 className="text-base sm:text-lg font-semibold">Marcar Tarea como Completada</h3>
                  </div>
                  
                  {hasActiveIncidents && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                        <p className="text-sm text-orange-800">
                          Esta tarea tiene incidencias activas. No puedes marcarla como completada hasta que se resuelvan.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <p className="text-sm text-green-800">
                        Al marcar esta tarea como completada, se notificará al coordinador y la tarea se moverá al estado "Completada".
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={onCompleteTask} 
                      className="bg-green-600 hover:bg-green-700"
                      disabled={hasActiveIncidents}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Marcar Completada
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function MisTareasComponent() {
  const { user } = useAuthStore()
  const [myTasks, setMyTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false)
  
  // Estados para los formularios
  const [progressDescription, setProgressDescription] = useState('')
  const [incidentDescription, setIncidentDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    loadTasks()
  }, [user?.id])

  // ============================================
  // FUNCIÓN PRINCIPAL DE CARGA DE TAREAS
  // ============================================
  // Integración con el backend real usando taskService
  const loadTasks = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // ============================================
      // CARGAR TAREAS DESDE EL BACKEND
      // ============================================
      // Endpoint: GET /api/tasks?assigned_to_id={userId}
      const backendTasks = await taskService.getTasks({
        assigned_to_id: user.id
      })

      // ============================================
      // ADAPTAR DATOS DEL BACKEND AL FORMATO DE LA VISTA
      // ============================================
      const adaptedTasks: Task[] = backendTasks.map((backendTask) => {
        // Adaptar estados del backend (mayúsculas) a la vista (minúsculas)
        const statusMap: Record<BackendTask['status'], Task['status']> = {
          'Pending': 'pending',
          'InProgress': 'in_progress',
          'Completed': 'completed',
          'Delayed': 'delayed',
          'Paused': 'paused'
        }

        // Adaptar niveles de riesgo
        const riskLevelMap: Record<BackendTask['risk_level'], Task['risk_level']> = {
          'Low': 'low',
          'Medium': 'medium',
          'High': 'high'
        }

        // Adaptar estados de incidencias
        const incidentStatusMap: Record<BackendIncident['status'], Incident['status']> = {
          'Reported': 'reported',
          'Resolved': 'resolved'
        }

        return {
          id: backendTask.id,
          title: backendTask.title,
          description: backendTask.description,
          status: statusMap[backendTask.status] || 'in_progress',
          risk_level: riskLevelMap[backendTask.risk_level] || 'low',
          due_date: backendTask.due_date,
          assigned_to: backendTask.assigned_to || {
            id: user.id,
            name: user.name || 'Usuario',
            email: user.email || ''
          },
          created_at: backendTask.created_at,
          updated_at: backendTask.updated_at,
          // progress del backend se mapea a progress_history
          progress_history: backendTask.progress?.map(p => ({
            id: p.id,
            task_id: p.task_id,
            user_id: p.user_id,
            description: p.description,
            file_name: p.file_name,
            file_path: p.file_path,
            created_at: p.created_at,
            user: p.user || { name: user.name || 'Usuario' }
          })),
          // incidents del backend se adaptan
          incidents: backendTask.incidents?.map(i => ({
            id: i.id,
            task_id: i.task_id,
            reported_by_id: i.reported_by_id,
            description: i.description,
            file_name: i.file_name,
            file_path: i.file_path,
            status: incidentStatusMap[i.status] || 'reported',
            created_at: i.created_at,
            reported_by: i.reported_by || { name: user.name || 'Usuario' }
          }))
        }
      })

      setMyTasks(adaptedTasks)

      // Si no hay tareas, mostrar mensaje informativo
      if (adaptedTasks.length === 0) {
        toast.info('No tienes tareas asignadas en este momento')
      }

    } catch (error) {
      console.error('Error cargando tareas:', error)
      toast.error('Error al cargar las tareas desde el backend')
      
      // ============================================
      // FALLBACK A MOCK DATA SOLO EN CASO DE ERROR
      // ============================================
      // Si hay error de conexión, usar datos de demostración
      const mockTasks: Task[] = [
        {
          id: 1,
          title: 'Preparar presentación del proyecto',
          description: 'Crear una presentación completa del proyecto de investigación para el evento',
          status: 'in_progress',
          risk_level: 'high',
          due_date: '2025-01-30',
          assigned_to: {
            id: user?.id || 0,
            name: user?.name || 'Usuario',
            email: user?.email || 'usuario@example.com'
          },
          created_at: '2025-01-20',
          updated_at: '2025-01-20',
          progress_history: [
            {
              id: 1,
              task_id: 1,
              user_id: user?.id || 0,
              description: 'Inicié la investigación de antecedentes para la presentación',
              created_at: '2025-01-21',
              user: { name: user?.name || 'Usuario' }
            },
            {
              id: 2,
              task_id: 1,
              user_id: user?.id || 0,
              description: 'Completé el primer borrador de la introducción',
              file_name: 'intro_draft.pdf',
              file_path: '/files/intro_draft.pdf',
              created_at: '2025-01-22',
              user: { name: user?.name || 'Usuario' }
            }
          ],
          incidents: []
        },
        {
          id: 2,
          title: 'Revisar documentación técnica',
          description: 'Revisar y actualizar la documentación técnica del proyecto',
          status: 'paused',
          risk_level: 'medium',
          due_date: '2025-02-05',
          assigned_to: {
            id: user?.id || 0,
            name: user?.name || 'Usuario',
            email: user?.email || 'usuario@example.com'
          },
          created_at: '2025-01-18',
          updated_at: '2025-01-22',
          progress_history: [
            {
              id: 3,
              task_id: 2,
              user_id: user?.id || 0,
              description: 'Empecé la revisión de la documentación existente',
              created_at: '2025-01-19',
              user: { name: user?.name || 'Usuario' }
            }
          ],
          incidents: [
            {
              id: 1,
              task_id: 2,
              reported_by_id: user?.id || 0,
              description: 'No tengo acceso a la documentación técnica actualizada. El enlace proporcionado no funciona.',
              file_name: 'error_screenshot.png',
              file_path: '/files/error_screenshot.png',
              status: 'reported',
              created_at: '2025-01-22',
              reported_by: { name: user?.name || 'Usuario' }
            }
          ]
        },
        {
          id: 3,
          title: 'Coordinar reunión de equipo',
          description: 'Organizar y coordinar la próxima reunión del equipo de investigación',
          status: 'completed',
          risk_level: 'low',
          due_date: '2025-01-25',
          assigned_to: {
            id: user?.id || 0,
            name: user?.name || 'Usuario',
            email: user?.email || 'usuario@example.com'
          },
          created_at: '2025-01-15',
          updated_at: '2025-01-25',
          progress_history: [
            {
              id: 4,
              task_id: 3,
              user_id: user?.id || 0,
              description: 'Envié invitaciones a todos los miembros del equipo',
              created_at: '2025-01-16',
              user: { name: user?.name || 'Usuario' }
            },
            {
              id: 5,
              task_id: 3,
              user_id: user?.id || 0,
              description: 'Confirmé la disponibilidad de todos los participantes',
              created_at: '2025-01-20',
              user: { name: user?.name || 'Usuario' }
            },
            {
              id: 6,
              task_id: 3,
              user_id: user?.id || 0,
              description: 'Reunión realizada exitosamente. Todos los puntos de la agenda fueron cubiertos.',
              created_at: '2025-01-25',
              user: { name: user?.name || 'Usuario' }
            }
          ],
          incidents: []
        },
        {
          id: 4,
          title: 'Análisis de datos experimentales',
          description: 'Procesar y analizar los datos obtenidos de los experimentos realizados',
          status: 'delayed',
          risk_level: 'high',
          due_date: '2025-01-28',
          assigned_to: {
            id: user?.id || 0,
            name: user?.name || 'Usuario',
            email: user?.email || 'usuario@example.com'
          },
          created_at: '2025-01-20',
          updated_at: '2025-01-23',
          progress_history: [
            {
              id: 7,
              task_id: 4,
              user_id: user?.id || 0,
              description: 'Comencé la recolección de datos experimentales',
              created_at: '2025-01-21',
              user: { name: user?.name || 'Usuario' }
            }
          ],
          incidents: []
        }
      ]
      setMyTasks(mockTasks)
      toast.warning('Mostrando datos de demostración (modo offline)')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendiente</Badge>
      case 'in_progress':
        return <Badge variant="default" className="bg-blue-500">En Progreso</Badge>
      case 'delayed':
        return <Badge variant="destructive">Retrasada</Badge>
      case 'paused':
        return <Badge variant="outline" className="text-orange-600 border-orange-600">Pausada</Badge>
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

  // Funciones para manejar las acciones del flujo
  const handleViewTaskDetails = (task: Task) => {
    setSelectedTask(task)
    setIsTaskDetailOpen(true)
  }

  // ============================================
  // FUNCIÓN: REPORTAR AVANCE (INTEGRADO CON BACKEND)
  // ============================================
  // Endpoint: POST /api/tasks/{id}/progress
  const handleReportProgress = async () => {
    // Extraer texto plano del HTML para validación
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = progressDescription
    const plainText = tempDiv.textContent || tempDiv.innerText || ''
    
    if (!selectedTask || !plainText.trim()) {
      toast.error('Por favor, describe el avance realizado')
      return
    }

    // Verificar si la tarea tiene incidencias activas
    const hasActiveIncidents = selectedTask.incidents?.some(incident => 
      incident.status === 'reported' || incident.status === 'investigating'
    )

    if (hasActiveIncidents) {
      toast.error('No puedes reportar avances mientras la tarea tenga incidencias activas')
      return
    }

    try {
      // ============================================
      // LLAMADA AL BACKEND REAL
      // ============================================
      await taskService.reportProgress(selectedTask.id, {
        description: progressDescription,
        file: selectedFile || undefined
      })
      
      toast.success('Avance reportado exitosamente')
      setIsTaskDetailOpen(false)
      setProgressDescription('')
      setSelectedFile(null)
      
      // Recargar tareas para obtener datos actualizados del backend
      await loadTasks()
      
    } catch (error) {
      console.error('Error reportando avance:', error)
      toast.error('Error al reportar el avance')
    }
  }

  // ============================================
  // FUNCIÓN: REPORTAR INCIDENCIA (INTEGRADO CON BACKEND)
  // ============================================
  // Endpoint: POST /api/incidents
  // Nota: Al reportar una incidencia, el backend automáticamente:
  // - Cambia el estado de la tarea a 'Paused'
  // - Envía un correo al coordinador
  const handleReportIncident = async () => {
    // Extraer texto plano del HTML para validación
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = incidentDescription
    const plainText = tempDiv.textContent || tempDiv.innerText || ''
    
    if (!selectedTask || !plainText.trim()) {
      toast.error('Por favor, describe la incidencia')
      return
    }

    try {
      // ============================================
      // LLAMADA AL BACKEND REAL
      // ============================================
      // Endpoint: POST /api/incidents
      // Campos requeridos: task_id, description
      // Campo opcional: file
      await taskService.createIncident({
        task_id: selectedTask.id,
        description: incidentDescription,
        file: selectedFile || undefined
      })
      
      toast.success('Incidencia reportada exitosamente. La tarea ha sido pausada.')
      setIsTaskDetailOpen(false)
      setIncidentDescription('')
      setSelectedFile(null)
      
      // Recargar tareas para obtener el nuevo estado desde el backend
      // (Backend cambia automáticamente el estado a 'Paused')
      await loadTasks()
      
    } catch (error) {
      console.error('Error reportando incidencia:', error)
      toast.error('Error al reportar la incidencia')
    }
  }

  // ============================================
  // FUNCIÓN: COMPLETAR TAREA (INTEGRADO CON BACKEND)
  // ============================================
  // Endpoint: PUT /api/tasks/{id}/complete
  // Restricción del backend: Solo el usuario asignado puede completar la tarea
  const handleCompleteTask = async () => {
    if (!selectedTask) return

    // Verificar si la tarea tiene incidencias activas
    const hasActiveIncidents = selectedTask.incidents?.some(incident => 
      incident.status === 'reported' || incident.status === 'investigating'
    )

    if (hasActiveIncidents) {
      toast.error('No puedes marcar como completada una tarea que tiene incidencias activas')
      return
    }

    try {
      // ============================================
      // LLAMADA AL BACKEND REAL
      // ============================================
      await taskService.completeTask(selectedTask.id)
      
      toast.success('Tarea marcada como completada. Se ha notificado al coordinador.')
      setIsTaskDetailOpen(false)
      
      // Recargar tareas para obtener el nuevo estado desde el backend
      await loadTasks()
      
    } catch (error) {
      console.error('Error completando tarea:', error)
      toast.error('Error al completar la tarea')
    }
  }

  const TaskListView = ({ tasks }: { tasks: Task[] }) => (
    <div className="space-y-4">
      {tasks.map((task) => (
        <Card key={task.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">{task.title}</CardTitle>
                <CardDescription>{task.description}</CardDescription>
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
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span>{task.assigned_to.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Creada: {formatDate(task.created_at)}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewTaskDetails(task)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver Detalles
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const TaskGridView = ({ tasks }: { tasks: Task[] }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tasks.map((task) => (
        <Card key={task.id} className="hover:shadow-md transition-shadow">
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
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Vence: {formatDate(task.due_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{task.assigned_to.name}</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleViewTaskDetails(task)}
              >
                <Eye className="h-4 w-4 mr-1" />
                Ver Detalles
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const TaskKanbanView = ({ tasks }: { tasks: Task[] }) => {
    const columns = [
      { 
        id: 'in_progress', 
        title: 'En Progreso', 
        tasks: tasks.filter(task => task.status === 'in_progress'),
        ariaLabel: 'Columna de tareas en progreso',
        description: 'Tareas que están siendo trabajadas activamente'
      },
      { 
        id: 'delayed', 
        title: 'Retrasadas', 
        tasks: tasks.filter(task => task.status === 'delayed'),
        ariaLabel: 'Columna de tareas retrasadas',
        description: 'Tareas que han pasado su fecha de vencimiento'
      },
      { 
        id: 'paused', 
        title: 'Pausadas', 
        tasks: tasks.filter(task => task.status === 'paused'),
        ariaLabel: 'Columna de tareas pausadas',
        description: 'Tareas temporalmente detenidas'
      },
      { 
        id: 'completed', 
        title: 'Completadas', 
        tasks: tasks.filter(task => task.status === 'completed'),
        ariaLabel: 'Columna de tareas completadas',
        description: 'Tareas finalizadas exitosamente'
      }
    ]

    return (
      <div className="space-y-6">
        {/* Información para lectores de pantalla */}
        <div className="sr-only">
          <h2>Vista Kanban de Tareas</h2>
          <p>Esta vista organiza las tareas en columnas según su estado. Total de tareas: {tasks.length}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {columns.map((column) => (
            <div 
              key={column.id} 
              className="space-y-4 bg-card border border-border rounded-lg p-4 shadow-sm"
              role="region"
              aria-label={column.ariaLabel}
              aria-describedby={`column-${column.id}-description`}
            >
              {/* Header de columna con información accesible */}
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h3 className="font-semibold text-sm text-foreground">{column.title}</h3>
                  <p id={`column-${column.id}-description`} className="sr-only">
                    {column.description}. Contiene {column.tasks.length} {column.tasks.length === 1 ? 'tarea' : 'tareas'}.
                  </p>
                </div>
                <Badge 
                  variant="secondary" 
                  className="text-xs font-medium"
                  aria-label={`${column.tasks.length} tareas en ${column.title.toLowerCase()}`}
                >
                  {column.tasks.length}
                </Badge>
              </div>

              {/* Lista de tareas con información accesible */}
              <div 
                className="space-y-3 min-h-[200px]"
                role="list"
                aria-label={`Lista de tareas ${column.title.toLowerCase()}`}
              >
                {column.tasks.length === 0 ? (
                  <div 
                    className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground"
                    role="status"
                    aria-live="polite"
                  >
                    <div className="text-4xl mb-2 opacity-50">
                      {column.id === 'in_progress' && '🔄'}
                      {column.id === 'delayed' && '⚠️'}
                      {column.id === 'paused' && '⏸️'}
                      {column.id === 'completed' && '✅'}
                    </div>
                    <p className="text-sm">
                      No hay tareas en esta columna
                    </p>
                  </div>
                ) : (
                  column.tasks.map((task) => (
                    <Card 
                      key={task.id} 
                      className="hover:shadow-md transition-all duration-200 cursor-pointer group border-l-4 border-l-primary/20 hover:border-l-primary hover:shadow-lg"
                      onClick={() => handleViewTaskDetails(task)}
                      role="listitem"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleViewTaskDetails(task)
                        }
                      }}
                      aria-label={`Tarea: ${task.title}. Estado: ${column.title}. Fecha de vencimiento: ${formatDate(task.due_date)}. Nivel de riesgo: ${task.risk_level}`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                            {task.title}
                          </CardTitle>
                          <div className="flex-shrink-0">
                            {getRiskLevelBadge(task.risk_level)}
                          </div>
                        </div>
                        <CardDescription className="text-xs line-clamp-2 text-muted-foreground">
                          {task.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {/* Información de fecha */}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" aria-hidden="true" />
                            <span>
                              <span className="sr-only">Fecha de vencimiento: </span>
                              {formatDate(task.due_date)}
                            </span>
                          </div>
                          
                          {/* Estado visual con información accesible */}
                          <div className="flex items-center gap-2">
                            <div 
                              className={`w-2 h-2 rounded-full ${
                                task.status === 'completed' ? 'bg-green-500' :
                                task.status === 'delayed' ? 'bg-red-500' :
                                task.status === 'paused' ? 'bg-yellow-500' :
                                'bg-blue-500'
                              }`}
                              aria-hidden="true"
                            />
                            <span className="text-xs font-medium capitalize">
                              {task.status === 'in_progress' ? 'En Progreso' :
                               task.status === 'delayed' ? 'Retrasada' :
                               task.status === 'paused' ? 'Pausada' :
                               'Completada'}
                            </span>
                          </div>

                          {/* Asignado a */}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3" aria-hidden="true" />
                            <span className="truncate">
                              <span className="sr-only">Asignado a: </span>
                              {task.assigned_to.name}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Resumen accesible */}
        <div 
          className="mt-8 p-4 bg-muted/50 rounded-lg border border-border"
          role="complementary"
          aria-label="Resumen de tareas"
        >
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">
                Total de tareas: <span className="font-semibold text-foreground">{tasks.length}</span>
              </span>
              <span className="text-muted-foreground">
                Completadas: <span className="font-semibold text-green-600">
                  {tasks.filter(t => t.status === 'completed').length}
                </span>
              </span>
              <span className="text-muted-foreground">
                En progreso: <span className="font-semibold text-blue-600">
                  {tasks.filter(t => t.status === 'in_progress').length}
                </span>
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              <span className="sr-only">Última actualización: </span>
              {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    )
  }


  if (loading) {
    return (
      <DashboardLayout>
        <DashboardContent title="Mis Tareas" description="Cargando tus tareas asignadas...">
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Cargando tareas...</p>
            </div>
          </div>
        </DashboardContent>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <DashboardContent title="Mis Tareas" description="Gestiona las tareas asignadas a tu evento activo.">
        <div className="container mx-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Mis Tareas</h1>
              <p className="text-sm text-muted-foreground">
                {myTasks.length} {myTasks.length === 1 ? "tarea asignada" : "tareas asignadas"}
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("kanban")}
                className={cn("gap-2", viewMode === "kanban" && "bg-accent text-accent-foreground")}
              >
                <Kanban className="h-4 w-4" />
                Kanban
              </Button>
            </div>
          </div>

          {myTasks.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay tareas asignadas</h3>
                <p className="text-muted-foreground">
                  No tienes tareas asignadas en este momento.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {viewMode === "list" && <TaskListView tasks={myTasks} />}
              {viewMode === "grid" && <TaskGridView tasks={myTasks} />}
              {viewMode === "kanban" && <TaskKanbanView tasks={myTasks} />}
            </>
          )}
        </div>
        
          {/* Modal de detalles de tarea */}
          <TaskDetailModal 
            selectedTask={selectedTask}
            isOpen={isTaskDetailOpen}
            onClose={() => setIsTaskDetailOpen(false)}
            onReportProgress={handleReportProgress}
            onReportIncident={handleReportIncident}
            onCompleteTask={handleCompleteTask}
            progressDescription={progressDescription}
            setProgressDescription={setProgressDescription}
            incidentDescription={incidentDescription}
            setIncidentDescription={setIncidentDescription}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
          />
      </DashboardContent>
    </DashboardLayout>
  )
}