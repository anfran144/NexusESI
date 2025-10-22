import { createFileRoute } from '@tanstack/react-router'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardContent } from '@/components/layout/dashboard-content'
import { PermissionsAdministration } from '@/features/admin/permissions'

export const Route = createFileRoute('/_authenticated/admin/permisos')({
  component: AdminPermissionsPage,
})

function AdminPermissionsPage() {
  return (
    <PermissionGuard permission="admin.roles.manage">
      <DashboardLayout
        title="Gestión de Permisos"
        description="Administra roles, permisos y asignaciones del sistema"
        showFooter={false}
      >
        <DashboardContent>
          <PermissionsAdministration />
        </DashboardContent>
      </DashboardLayout>
    </PermissionGuard>
  )
}