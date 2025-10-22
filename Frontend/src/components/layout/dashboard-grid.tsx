import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Grid principal del dashboard
type DashboardGridProps = {
  children: ReactNode
  className?: string
  cols?: 1 | 2 | 3 | 4 | 6 | 12
  gap?: 'sm' | 'md' | 'lg'
}

export function DashboardGrid({
  children,
  className,
  cols = 3,
  gap = 'md',
}: DashboardGridProps) {
  const getGridClasses = () => {
    const colsMap = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
      6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
      12: 'grid-cols-12',
    }

    const gapMap = {
      sm: 'gap-3',
      md: 'gap-4',
      lg: 'gap-6',
    }

    return `grid ${colsMap[cols]} ${gapMap[gap]}`
  }

  return (
    <div className={cn(getGridClasses(), className)}>
      {children}
    </div>
  )
}

// Item del grid con diferentes tamaños
type GridItemProps = {
  children: ReactNode
  className?: string
  span?: 1 | 2 | 3 | 4 | 6 | 12
  spanMd?: 1 | 2 | 3 | 4 | 6 | 12
  spanLg?: 1 | 2 | 3 | 4 | 6 | 12
}

export function GridItem({
  children,
  className,
  span = 1,
  spanMd,
  spanLg,
}: GridItemProps) {
  const getSpanClasses = () => {
    const spanMap = {
      1: 'col-span-1',
      2: 'col-span-2',
      3: 'col-span-3',
      4: 'col-span-4',
      6: 'col-span-6',
      12: 'col-span-12',
    }

    let classes = spanMap[span]
    
    if (spanMd) {
      classes += ` md:${spanMap[spanMd]}`
    }
    
    if (spanLg) {
      classes += ` lg:${spanMap[spanLg]}`
    }

    return classes
  }

  return (
    <div className={cn(getSpanClasses(), className)}>
      {children}
    </div>
  )
}

// Grid para métricas/estadísticas
type MetricsGridProps = {
  children: ReactNode
  className?: string
}

export function MetricsGrid({ children, className }: MetricsGridProps) {
  return (
    <div className={cn(
      'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',
      className
    )}>
      {children}
    </div>
  )
}

// Grid para cards de contenido
type CardsGridProps = {
  children: ReactNode
  className?: string
  variant?: 'default' | 'compact' | 'wide'
}

export function CardsGrid({ 
  children, 
  className, 
  variant = 'default' 
}: CardsGridProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'compact':
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'
      case 'wide':
        return 'grid-cols-1 lg:grid-cols-2 gap-6'
      default:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
    }
  }

  return (
    <div className={cn('grid', getVariantClasses(), className)}>
      {children}
    </div>
  )
}

// Layout responsivo para dashboard
type ResponsiveLayoutProps = {
  sidebar?: ReactNode
  main: ReactNode
  aside?: ReactNode
  className?: string
}

export function ResponsiveLayout({
  sidebar,
  main,
  aside,
  className,
}: ResponsiveLayoutProps) {
  if (sidebar && aside) {
    // Layout de 3 columnas
    return (
      <div className={cn(
        'grid grid-cols-1 lg:grid-cols-12 gap-6',
        className
      )}>
        <aside className='lg:col-span-2'>
          {sidebar}
        </aside>
        <main className='lg:col-span-7'>
          {main}
        </main>
        <aside className='lg:col-span-3'>
          {aside}
        </aside>
      </div>
    )
  }

  if (sidebar || aside) {
    // Layout de 2 columnas
    return (
      <div className={cn(
        'grid grid-cols-1 lg:grid-cols-12 gap-6',
        className
      )}>
        {sidebar && (
          <aside className='lg:col-span-3'>
            {sidebar}
          </aside>
        )}
        <main className={sidebar ? 'lg:col-span-9' : aside ? 'lg:col-span-9' : 'lg:col-span-12'}>
          {main}
        </main>
        {aside && (
          <aside className='lg:col-span-3'>
            {aside}
          </aside>
        )}
      </div>
    )
  }

  // Layout de 1 columna
  return (
    <div className={className}>
      {main}
    </div>
  )
}