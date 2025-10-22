import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardContent } from '@/components/layout/dashboard-content'
import { DashboardStats } from './components/dashboard-stats'

export function AdminDashboard() {
  return (
    <DashboardLayout>
      <DashboardContent>
        <DashboardStats />
      </DashboardContent>
    </DashboardLayout>
  )
}