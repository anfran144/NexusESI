import { DashboardSkeleton } from './components/dashboard-skeleton'
import { useAuthStore } from '@/stores/auth-store'

export function Dashboard() {
  const { user } = useAuthStore()

  return (
    <DashboardSkeleton
      pageTitle="Dashboard"
      welcomeMessage={`¡Bienvenido de vuelta, ${user?.name || 'Usuario'}! Aquí tienes un resumen completo de tu actividad.`}
    />
  )
}

// Exportar dashboards específicos por rol
export { AdminDashboard } from './admin'
export { CoordinatorDashboard } from './coordinator'
export { SeedbedLeaderDashboard } from './seedbed-leader'
