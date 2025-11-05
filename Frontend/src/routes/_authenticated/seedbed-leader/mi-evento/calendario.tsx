import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardContent } from '@/components/layout/dashboard-content'
import { EventCalendarLeader } from '@/components/calendar/EventCalendarLeader'
import { seedbedLeaderService } from '@/services/seedbed-leader-service'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/seedbed-leader/mi-evento/calendario')({
  component: EventCalendarioLeaderPage,
})

function EventCalendarioLeaderPage() {
  const navigate = useNavigate()
  const [eventId, setEventId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadActiveEvent = async () => {
      try {
        setLoading(true)
        const eventData = await seedbedLeaderService.getActiveEvent()
        if (eventData?.id) {
          setEventId(eventData.id)
        } else {
          toast.error('No tienes un evento activo')
          navigate({ to: '/seedbed-leader/mi-evento' })
        }
      } catch (error: any) {
        if (error?.response?.status === 404) {
          toast.error('No tienes un evento activo')
          navigate({ to: '/seedbed-leader/mi-evento' })
        } else {
          console.error('Error loading active event:', error)
          toast.error('Error al cargar el evento activo')
        }
      } finally {
        setLoading(false)
      }
    }

    loadActiveEvent()
  }, [navigate])

  if (loading) {
    return (
      <DashboardLayout showFooter={true}>
        <DashboardContent
          title="Calendario del Evento"
          description="Cargando información del evento..."
        >
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando calendario...</p>
            </div>
          </div>
        </DashboardContent>
      </DashboardLayout>
    )
  }

  if (!eventId) {
    return (
      <DashboardLayout showFooter={true}>
        <DashboardContent
          title="Calendario del Evento"
          description="No hay evento activo"
        >
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <p className="text-muted-foreground">No tienes un evento activo para ver el calendario.</p>
            </div>
          </div>
        </DashboardContent>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout showFooter={true}>
      <DashboardContent
        title="Calendario del Evento"
        description="Visualización de mis tareas, incidencias y el cronograma del evento."
      >
        <EventCalendarLeader eventId={eventId} />
      </DashboardContent>
    </DashboardLayout>
  )
}
