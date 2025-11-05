import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardContent } from '@/components/layout/dashboard-content'
import { useAuthStore } from '@/stores/auth-store'

export function CoordinatorDashboard() {
  const { user } = useAuthStore()

  return (
    <DashboardLayout>
      <DashboardContent
        title="Panel de Coordinación"
        description={`¡Bienvenido, ${user?.name || 'Coordinador'}! Supervisa y coordina las actividades de los semilleros.`}
      >
        {/* Contenido del dashboard */}
      </DashboardContent>
    </DashboardLayout>
  )
}