import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { taskService, type Task, type TaskProgress } from '@/services/taskService'
import { TrendingUp, Calendar, User, X, Download } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface TaskProgressHistoryProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskProgressHistory({ task, open, onOpenChange }: TaskProgressHistoryProps) {
  const [progressHistory, setProgressHistory] = useState<TaskProgress[]>([])
  const [loading, setLoading] = useState(false)
  const [fullTask, setFullTask] = useState<Task | null>(null)

  useEffect(() => {
    if (open && task) {
      loadTaskProgress()
    }
  }, [open, task])

  const loadTaskProgress = async () => {
    if (!task) return

    try {
      setLoading(true)
      // Cargar la tarea completa con su progreso
      const response = await taskService.getTask(task.id)
      if (response) {
        setFullTask(response)
        setProgressHistory(response.progress || [])
      } else {
        // Si no hay endpoint específico, usar el progreso de la tarea actual
        setFullTask(task)
        setProgressHistory(task.progress || [])
      }
    } catch (error) {
      console.error('Error loading task progress:', error)
      toast.error('Error al cargar el historial de avances')
      // Fallback: usar el progreso de la tarea actual
      setFullTask(task)
      setProgressHistory(task.progress || [])
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadFile = async (filePath: string, fileName: string) => {
    try {
      // Construir URL del archivo
      const fileUrl = `/storage/${filePath}`
      const link = document.createElement('a')
      link.href = fileUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading file:', error)
      toast.error('Error al descargar el archivo')
    }
  }

  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Historial de Avances</DialogTitle>
          <DialogDescription>
            {task.title}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando historial...</p>
              </div>
            </div>
          ) : progressHistory.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay avances reportados</h3>
              <p className="text-muted-foreground">
                Esta tarea aún no tiene reportes de avance.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {progressHistory
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((progress) => (
                  <Card key={progress.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20 shrink-0">
                          <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div 
                            className="prose prose-sm max-w-none text-sm"
                            dangerouslySetInnerHTML={{ __html: progress.description }}
                          />
                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {progress.user?.name || 'Usuario desconocido'}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(progress.created_at), 'dd/MM/yyyy HH:mm')}
                            </span>
                          </div>
                          {progress.file_name && progress.file_path && (
                            <div className="flex items-center gap-2 pt-2 border-t">
                              <span className="text-xs text-muted-foreground">Archivo adjunto:</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => handleDownloadFile(progress.file_path!, progress.file_name!)}
                              >
                                <Download className="w-3 h-3 mr-1" />
                                {progress.file_name}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

