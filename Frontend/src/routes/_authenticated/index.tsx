import { createFileRoute } from '@tanstack/react-router'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { UnifiedDashboard } from '@/components/dashboard/UnifiedDashboard'

export const Route = createFileRoute('/_authenticated/')({
  component: () => (
    <PermissionGuard permission="dashboard.view">
      <UnifiedDashboard />
    </PermissionGuard>
  ),
})
