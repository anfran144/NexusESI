import { createFileRoute } from '@tanstack/react-router'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardContent } from '@/components/layout/dashboard-content'
import { AdminUsuarios } from '@/features/dashboard/admin/components/admin-usuarios'

export const Route = createFileRoute('/_authenticated/admin/usuarios')({
  component: AdminUsuariosPage,
})

function AdminUsuariosPage() {
  return (
    <PermissionGuard permission="admin.users.view">
      <DashboardLayout showFooter={false}>
        <DashboardContent
          title="Gestión de Usuarios"
          description="Supervisa y administra todos los usuarios del sistema"
        >
          <AdminUsuarios />
        </DashboardContent>
      </DashboardLayout>
    </PermissionGuard>
  )
}
