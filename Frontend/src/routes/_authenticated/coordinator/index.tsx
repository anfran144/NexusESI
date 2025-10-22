import { createFileRoute } from '@tanstack/react-router'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { CoordinatorDashboard } from '@/features/dashboard/coordinator'

export const Route = createFileRoute('/_authenticated/coordinator/')({
  component: () => (
    <PermissionGuard permission="coordinator.dashboard.view">
      <CoordinatorDashboard />
    </PermissionGuard>
  ),
})
