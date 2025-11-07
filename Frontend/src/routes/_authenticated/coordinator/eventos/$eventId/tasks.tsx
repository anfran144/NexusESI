import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardContent } from '@/components/layout/dashboard-content'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { TaskManagementManager } from '@/features/events/coordinator/components/task-management-manager'
import { TaskBankManager } from '@/features/events/coordinator/components/task-bank-manager'
import { useEventContext } from '@/stores/event-context-store'
import { useState, useEffect } from 'react'
import { eventService, type Event } from '@/services/event.service'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, ListTodo, FolderKanban } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/coordinator/eventos/$eventId/tasks')({
  component: EventTasksPage,
})

function EventTasksPage() {
  const { eventId } = Route.useParams()
  const { setSelectedEvent, clearSelectedEvent } = useEventContext()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('management')
  const navigate = useNavigate()

  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoading(true)
        const response = await eventService.getEvent(Number(eventId))
        if (response.success) {
          setEvent(response.data)
          setSelectedEvent(response.data.id, response.data.name)
        }
      } catch {
        toast.error('Error al cargar el evento')
      } finally {
        setLoading(false)
      }
    }

    loadEvent()

    return () => {
      clearSelectedEvent()
    }
  }, [eventId]) // ✅ Solo eventId como dependencia

  if (loading) {
    return (
      <DashboardLayout showFooter={false}>
        <DashboardContent
          title="Cargando..."
          description="Tareas del evento"
        >
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
        <DashboardContent
          title="Evento no encontrado"
          description="Tareas del evento"
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
          title="Tareas"
          description={`Gestiona las tareas del evento "${event.name}"`}
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

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="management">
                  <ListTodo className="h-4 w-4 mr-2" />
                  Gestión de Tareas
                </TabsTrigger>
                <TabsTrigger value="bank">
                  <FolderKanban className="h-4 w-4 mr-2" />
                  Banco de Tareas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="management" className="mt-6">
                <TaskManagementManager eventId={Number(eventId)} />
              </TabsContent>

              <TabsContent value="bank" className="mt-6">
                <TaskBankManager 
                  eventId={Number(eventId)} 
                  filter={undefined}
                  onClearFilter={undefined}
                />
              </TabsContent>
            </Tabs>
          </div>
        </DashboardContent>
      </DashboardLayout>
    </PermissionGuard>
  )
}
