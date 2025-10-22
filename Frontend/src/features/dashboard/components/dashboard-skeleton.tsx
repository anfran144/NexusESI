import { ReactNode } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardContent } from '@/components/layout/dashboard-content'

type DashboardSkeletonProps = {
  pageTitle?: string
  welcomeMessage?: string
  children?: ReactNode
}

export function DashboardSkeleton({
  pageTitle = 'Dashboard',
  welcomeMessage,
  children,
}: DashboardSkeletonProps) {
  return (
    <DashboardLayout>
      <DashboardContent>
        <div className='space-y-6'>
          {/* Encabezado del panel con título correspondiente al sidebar */}
          <section>
            <div className='mb-6'>
              <h1 className='text-2xl font-bold tracking-tight'>{pageTitle}</h1>
              {welcomeMessage && (
                <p className='text-muted-foreground mt-2'>{welcomeMessage}</p>
              )}
            </div>
          </section>

          {/* Contenido adicional del usuario */}
          {children && (
            <section>
              {children}
            </section>
          )}
        </div>
      </DashboardContent>
    </DashboardLayout>
  )
}

// Exportar también los componentes individuales para uso personalizado
export {
  DashboardLayout,
  DashboardContent,
}