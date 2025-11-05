import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardContent } from '@/components/layout/dashboard-content'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { TaskList } from '@/components/tasks/TaskList'
import { useAuthStore } from '@/stores/auth-store'
import { useEventContext } from '@/stores/event-context-store'
import { useState, useEffect } from 'react'
import { eventService, type Event } from '@/services/event.service'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/coordinator/eventos/$eventId/my-tasks')({
  component: EventMyTasksPage,
})

function EventMyTasksPage() {
  const { eventId } = Route.useParams()
  const { user } = useAuthStore()
  const { setSelectedEvent, clearSelectedEvent } = useEventContext()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
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
      <DashboardLayout
        title="Cargando..."
        description="Mis tareas del evento"
        showFooter={false}
      >
        <DashboardContent>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando...</p>
            </div>
          </div>
        </DashboardContent>
      </DashboardLayout>
    )
  }

  if (!event) {
    return (
      <DashboardLayout
        title="Evento no encontrado"
        description="Mis tareas del evento"
        showFooter={false}
      >
        <DashboardContent>
          <div className="container mx-auto py-6">
            <p className="text-center text-muted-foreground">Evento no encontrado</p>
          </div>
        </DashboardContent>
      </DashboardLayout>
    )
  }

  return (
    <PermissionGuard permission="events.tasks.view_assigned">
      <DashboardLayout
        title="Mis Tareas"
        description={`Tareas asignadas en ${event.name}`}
        showFooter={true}
      >
        <DashboardContent>
          <div className="space-y-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: `/coordinator/eventos/${eventId}` })}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Evento
            </Button>

            <TaskList 
              eventId={Number(eventId)}
              assignedToId={user?.id}
              showFilters={true}
              showCreateButton={false}
            />
          </div>
        </DashboardContent>
      </DashboardLayout>
    </PermissionGuard>
  )
}

