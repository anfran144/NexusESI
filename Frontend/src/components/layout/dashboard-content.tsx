import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

type DashboardContentProps = {
  children: ReactNode
  title?: string
  description?: string
  actions?: ReactNode
  className?: string
  variant?: 'default' | 'centered' | 'full-width' | 'split'
  showSeparator?: boolean
}

export function DashboardContent({
  children,
  title,
  description,
  actions,
  className,
  variant = 'default',
  showSeparator = true,
}: DashboardContentProps) {
  const renderHeader = () => {
    if (!title && !description && !actions) return null

    return (
      <>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          {(title || description) && (
            <div className='space-y-1'>
              {title && (
                <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
                  {title}
                </h1>
              )}
              {description && (
                <p className='text-muted-foreground text-base'>
                  {description}
                </p>
              )}
            </div>
          )}
          
          {actions && (
            <div className='flex items-center space-x-2'>
              {actions}
            </div>
          )}
        </div>
        
        {showSeparator && <Separator className='my-6' />}
      </>
    )
  }

  const getContentClasses = () => {
    switch (variant) {
      case 'centered':
        return 'max-w-4xl mx-auto'
      case 'full-width':
        return 'w-full'
      case 'split':
        return 'grid grid-cols-1 lg:grid-cols-12 gap-6'
      default:
        return 'space-y-6'
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {renderHeader()}
      
      <div className={cn(getContentClasses())}>
        {children}
      </div>
    </div>
  )
}

// Componente auxiliar para contenido dividido
type DashboardSplitContentProps = {
  sidebar: ReactNode
  main: ReactNode
  sidebarClassName?: string
  mainClassName?: string
}

export function DashboardSplitContent({
  sidebar,
  main,
  sidebarClassName,
  mainClassName,
}: DashboardSplitContentProps) {
  return (
    <>
      <aside className={cn('lg:col-span-3', sidebarClassName)}>
        {sidebar}
      </aside>
      <main className={cn('lg:col-span-9', mainClassName)}>
        {main}
      </main>
    </>
  )
}

// Componente para secciones de contenido
type ContentSectionProps = {
  title?: string
  description?: string
  children: ReactNode
  className?: string
  headerClassName?: string
}

export function ContentSection({
  title,
  description,
  children,
  className,
  headerClassName,
}: ContentSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {(title || description) && (
        <div className={cn('space-y-1', headerClassName)}>
          {title && (
            <h2 className='text-lg font-semibold tracking-tight'>
              {title}
            </h2>
          )}
          {description && (
            <p className='text-sm text-muted-foreground'>
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}