import { createFileRoute } from '@tanstack/react-router'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardContent } from '@/components/layout/dashboard-content'
import { EventosCoordinator } from '@/features/events/coordinator'

export const Route = createFileRoute('/_authenticated/coordinator/eventos/')({
  component: EventosPage,
})

function EventosPage() {
  return (
    <PermissionGuard permission="events.view">
      <DashboardLayout
        title="Gestión de Eventos"
        description="Administra y supervisa todos los eventos del sistema"
        showFooter={false}
      >
        <DashboardContent>
          <EventosCoordinator />
        </DashboardContent>
      </DashboardLayout>
    </PermissionGuard>
  )
}
