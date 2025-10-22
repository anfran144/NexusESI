import { usePermissions } from '@/hooks/usePermissions';
import { AdminDashboard } from '@/features/dashboard/admin';
import { CoordinatorDashboard } from '@/features/dashboard/coordinator';
import { SeedbedLeaderDashboard } from '@/features/dashboard/seedbed-leader';
import { Dashboard } from '@/features/dashboard';

/**
 * Dashboard unificado que se adapta dinámicamente a los permisos del usuario
 * Reemplaza el RoleDashboardWrapper con un enfoque basado en permisos
 */
export function UnifiedDashboard() {
  const { hasPermission } = usePermissions();

  // Determinar qué dashboard mostrar basado en permisos
  if (hasPermission('admin.dashboard.view')) {
    return <AdminDashboard />;
  }
  
  if (hasPermission('coordinator.dashboard.view')) {
    return <CoordinatorDashboard />;
  }
  
  if (hasPermission('seedbed_leader.dashboard.view')) {
    return <SeedbedLeaderDashboard />;
  }

  // Dashboard por defecto para usuarios con permisos básicos
  return <Dashboard />;
}