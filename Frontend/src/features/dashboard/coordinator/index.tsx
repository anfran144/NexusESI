import { DashboardSkeleton } from '../components/dashboard-skeleton'
import { useAuthStore } from '@/stores/auth-store'

export function CoordinatorDashboard() {
  const { user } = useAuthStore()

  return (
    <DashboardSkeleton
      pageTitle="Panel de Coordinación"
      welcomeMessage={`¡Bienvenido, ${user?.name || 'Coordinador'}! Aquí puedes supervisar y coordinar las actividades de los semilleros bajo tu responsabilidad.`}
    />
  )
}