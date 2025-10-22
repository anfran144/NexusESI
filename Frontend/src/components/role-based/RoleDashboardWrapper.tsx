import { useAuthStore } from '@/stores/auth-store'
import { AdminDashboard } from '@/features/dashboard/admin'
import { CoordinatorDashboard } from '@/features/dashboard/coordinator'
import { SeedbedLeaderDashboard } from '@/features/dashboard/seedbed-leader'
import { Dashboard } from '@/features/dashboard'
import { isValidRole, getDefaultRole, type UserRole } from '@/utils/role-utils'

/**
 * Componente wrapper que renderiza el dashboard correcto según el rol del usuario
 */
export function RoleDashboardWrapper() {
  const { user } = useAuthStore()
  
  // Obtener el primer rol del usuario desde el array de roles
  const userRole = user?.roles?.[0]?.name as string
  const validRole: UserRole = isValidRole(userRole) ? userRole : getDefaultRole()
  
  // Renderizar el dashboard correspondiente al rol
  switch (validRole) {
    case 'admin':
      return <AdminDashboard />
    case 'coordinator':
      return <CoordinatorDashboard />
    case 'seedbed_leader':
      return <SeedbedLeaderDashboard />
    default:
      return <Dashboard />
  }
}

/**
 * Componente de orden superior para proteger rutas por rol
 */
interface RoleProtectedProps {
  allowedRoles: UserRole[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RoleProtected({ allowedRoles, children, fallback }: RoleProtectedProps) {
  const { user } = useAuthStore()
  
  // Obtener el primer rol del usuario desde el array de roles
  const userRole = user?.roles?.[0]?.name as string
  const validRole: UserRole = isValidRole(userRole) ? userRole : getDefaultRole()
  
  const hasAccess = allowedRoles.includes(validRole)
  
  if (!hasAccess) {
    return fallback || <div>No tienes permisos para acceder a esta sección.</div>
  }
  
  return <>{children}</>
}