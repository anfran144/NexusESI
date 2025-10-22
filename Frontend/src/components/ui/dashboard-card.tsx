import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Card básico del dashboard
type DashboardCardProps = {
  title?: string
  description?: string
  children: ReactNode
  className?: string
  actions?: ReactNode
  variant?: 'default' | 'outline' | 'ghost'
}

export function DashboardCard({
  title,
  description,
  children,
  className,
  actions,
  variant = 'default',
}: DashboardCardProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'outline':
        return 'border-2 border-dashed'
      case 'ghost':
        return 'border-0 shadow-none bg-transparent'
      default:
        return ''
    }
  }

  return (
    <Card className={cn(getVariantClasses(), className)}>
      {(title || description || actions) && (
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <div className='space-y-1'>
            {title && <CardTitle className='text-sm font-medium'>{title}</CardTitle>}
            {description && (
              <CardDescription className='text-xs'>{description}</CardDescription>
            )}
          </div>
          {actions && <div className='flex items-center space-x-2'>{actions}</div>}
        </CardHeader>
      )}
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}

// Card para métricas/estadísticas
type MetricCardProps = {
  title: string
  value: string | number
  description?: string
  trend?: {
    value: number
    label?: string
  }
  icon?: ReactNode
  className?: string
}

export function MetricCard({
  title,
  value,
  description,
  trend,
  icon,
  className,
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null
    
    if (trend.value > 0) {
      return <TrendingUp className='h-4 w-4 text-green-600' />
    } else if (trend.value < 0) {
      return <TrendingDown className='h-4 w-4 text-red-600' />
    } else {
      return <Minus className='h-4 w-4 text-muted-foreground' />
    }
  }

  const getTrendColor = () => {
    if (!trend) return ''
    
    if (trend.value > 0) {
      return 'text-green-600'
    } else if (trend.value < 0) {
      return 'text-red-600'
    } else {
      return 'text-muted-foreground'
    }
  }

  return (
    <Card className={className}>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        {icon && <div className='text-muted-foreground'>{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{value}</div>
        {(description || trend) && (
          <div className='flex items-center space-x-2 text-xs text-muted-foreground'>
            {trend && (
              <div className={cn('flex items-center space-x-1', getTrendColor())}>
                {getTrendIcon()}
                <span>
                  {trend.value > 0 ? '+' : ''}{trend.value}%
                  {trend.label && ` ${trend.label}`}
                </span>
              </div>
            )}
            {description && <span>{description}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Card con acciones
type ActionCardProps = {
  title: string
  description?: string
  children?: ReactNode
  actions?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  }[]
  menuActions?: {
    label: string
    onClick: () => void
    destructive?: boolean
  }[]
  className?: string
}

export function ActionCard({
  title,
  description,
  children,
  actions,
  menuActions,
  className,
}: ActionCardProps) {
  return (
    <Card className={className}>
      <CardHeader className='flex flex-row items-center justify-between space-y-0'>
        <div className='space-y-1'>
          <CardTitle className='text-base'>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {menuActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='sm'>
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              {menuActions.map((action, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={action.onClick}
                  className={action.destructive ? 'text-destructive' : ''}
                >
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
      {actions && (
        <CardContent className='pt-0'>
          <div className='flex flex-wrap gap-2'>
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'default'}
                size='sm'
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// Card para estado/status
type StatusCardProps = {
  title: string
  status: 'success' | 'warning' | 'error' | 'info'
  message: string
  details?: string
  actions?: ReactNode
  className?: string
}

export function StatusCard({
  title,
  status,
  message,
  details,
  actions,
  className,
}: StatusCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950'
      case 'error':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
      case 'info':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'
      default:
        return ''
    }
  }

  const getStatusBadgeVariant = () => {
    switch (status) {
      case 'success':
        return 'default'
      case 'warning':
        return 'secondary'
      case 'error':
        return 'destructive'
      case 'info':
        return 'outline'
      default:
        return 'default'
    }
  }

  return (
    <Card className={cn(getStatusColor(), className)}>
      <CardHeader className='flex flex-row items-center justify-between space-y-0'>
        <div className='space-y-1'>
          <div className='flex items-center space-x-2'>
            <CardTitle className='text-sm font-medium'>{title}</CardTitle>
            <Badge variant={getStatusBadgeVariant()} className='text-xs'>
              {status.toUpperCase()}
            </Badge>
          </div>
          <CardDescription className='text-sm'>{message}</CardDescription>
        </div>
        {actions}
      </CardHeader>
      {details && (
        <CardContent>
          <p className='text-xs text-muted-foreground'>{details}</p>
        </CardContent>
      )}
    </Card>
  )
}