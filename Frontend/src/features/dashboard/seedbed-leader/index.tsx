import { DashboardSkeleton } from '../components/dashboard-skeleton'
import { useAuthStore } from '@/stores/auth-store'

export function SeedbedLeaderDashboard() {
  const { user } = useAuthStore()

  return (
    <DashboardSkeleton
      pageTitle="Panel de Liderazgo"
      welcomeMessage={`¡Bienvenido, ${user?.name || 'Líder'}! Gestiona tu semillero de investigación y coordina las actividades de tu equipo.`}
    />
  )
}