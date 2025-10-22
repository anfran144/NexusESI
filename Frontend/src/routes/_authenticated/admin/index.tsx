import { createFileRoute } from '@tanstack/react-router'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { AdminDashboard } from '@/features/dashboard/admin'

export const Route = createFileRoute('/_authenticated/admin/')({
  component: () => (
    <PermissionGuard permission="admin.dashboard.view">
      <AdminDashboard />
    </PermissionGuard>
  ),
})
