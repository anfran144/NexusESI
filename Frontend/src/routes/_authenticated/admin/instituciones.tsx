import { createFileRoute } from '@tanstack/react-router'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardContent } from '@/components/layout/dashboard-content'
import { AdminInstituciones } from '@/features/dashboard/admin/components/admin-instituciones'

export const Route = createFileRoute('/_authenticated/admin/instituciones')({
  component: AdminInstitucionesPage,
})

function AdminInstitucionesPage() {
  return (
    <PermissionGuard permission="admin.institutions.view">
      <DashboardLayout showFooter={false}>
        <DashboardContent
          title="Gestión de Instituciones"
          description="Administra y supervisa todas las instituciones del sistema"
        >
          <AdminInstituciones />
        </DashboardContent>
      </DashboardLayout>
    </PermissionGuard>
  )
}
