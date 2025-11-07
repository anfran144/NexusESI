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
        <div className="p-4">
        {/* Contenido del dashboard */}
          <p className="text-muted-foreground">Dashboard en construcción</p>
        </div>
      </DashboardContent>
    </DashboardLayout>
  )
}