import { createFileRoute } from '@tanstack/react-router'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { SeedbedLeaderDashboard } from '@/features/dashboard/seedbed-leader'

export const Route = createFileRoute('/_authenticated/seedbed-leader/')({
  component: () => (
    <PermissionGuard permission="seedbed_leader.dashboard.view">
      <SeedbedLeaderDashboard />
    </PermissionGuard>
  ),
})
