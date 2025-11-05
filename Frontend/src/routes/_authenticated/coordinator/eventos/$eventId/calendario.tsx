import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardContent } from '@/components/layout/dashboard-content'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { useEventContext } from '@/stores/event-context-store'
import { useState, useEffect } from 'react'
import { eventService, type Event } from '@/services/event.service'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { EventCalendar } from '@/components/calendar/EventCalendar'

export const Route = createFileRoute('/_authenticated/coordinator/eventos/$eventId/calendario')({
  component: EventCalendarioPage,
})

function EventCalendarioPage() {
  const { eventId } = Route.useParams()
  const { setSelectedEvent, clearSelectedEvent } = useEventContext()
  const navigate = useNavigate()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadEvent = async () => {
      try {
        setLoading(true)
        const response = await eventService.getEvent(Number(eventId))
        if (response.success) {
          setEvent(response.data)
          setSelectedEvent(response.data.id, response.data.name)
        }
      } catch (_error) {
        toast.error('Error al cargar el evento')
      } finally {
        setLoading(false)
      }
    }

    loadEvent()

    return () => {
      clearSelectedEvent()
    }
  }, [eventId, setSelectedEvent, clearSelectedEvent])

  if (loading) {
    return (
      <DashboardLayout showFooter={false}>
        <DashboardContent>
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
        <DashboardContent>
          <div className="container mx-auto py-6">
            <p className="text-center text-muted-foreground">Evento no encontrado</p>
          </div>
        </DashboardContent>
      </DashboardLayout>
    )
  }

  return (
    <PermissionGuard permission="events.view">
      <DashboardLayout showFooter={true}>
        <DashboardContent
          title={`Calendario - ${event.name}`}
          description="Vista de calendario general del evento"
        >
          <div className="space-y-4">
            {/* Botón de regreso */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate({ to: `/coordinator/eventos/${eventId}` })}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al evento
            </Button>

            {/* Componente del calendario */}
            <EventCalendar eventId={Number(eventId)} />
          </div>
        </DashboardContent>
      </DashboardLayout>
    </PermissionGuard>
  )
}
