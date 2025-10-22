import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  Clock, 
  Activity, 
  BarChart3, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react'

// Widget de progreso
type ProgressWidgetProps = {
  title: string
  description?: string
  value: number
  max?: number
  label?: string
  variant?: 'default' | 'success' | 'warning' | 'destructive'
  className?: string
}

export function ProgressWidget({
  title,
  description,
  value,
  max = 100,
  label,
  className,
}: ProgressWidgetProps) {
  const percentage = Math.round((value / max) * 100)

  return (
    <Card className={className}>
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-sm font-medium'>{title}</CardTitle>
          <span className='text-sm text-muted-foreground'>{percentage}%</span>
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <Progress value={percentage} className='h-2' />
        {label && (
          <p className='text-xs text-muted-foreground mt-2'>{label}</p>
        )}
      </CardContent>
    </Card>
  )
}

// Widget de lista de actividad
type ActivityItem = {
  id: string
  title: string
  description?: string
  time: string
  user?: {
    name: string
    avatar?: string
  }
  type?: 'info' | 'success' | 'warning' | 'error'
}

type ActivityWidgetProps = {
  title: string
  activities: ActivityItem[]
  showAll?: boolean
  onShowAll?: () => void
  className?: string
}

export function ActivityWidget({
  title,
  activities,
  showAll = false,
  onShowAll,
  className,
}: ActivityWidgetProps) {
  const getActivityIcon = (type?: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className='h-4 w-4 text-green-600' />
      case 'warning':
        return <AlertCircle className='h-4 w-4 text-yellow-600' />
      case 'error':
        return <XCircle className='h-4 w-4 text-red-600' />
      default:
        return <Info className='h-4 w-4 text-blue-600' />
    }
  }

  const displayedActivities = showAll ? activities : activities.slice(0, 5)

  return (
    <Card className={className}>
      <CardHeader className='flex flex-row items-center justify-between space-y-0'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        <Activity className='h-4 w-4 text-muted-foreground' />
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {displayedActivities.map((activity) => (
            <div key={activity.id} className='flex items-start space-x-3'>
              <div className='flex-shrink-0 mt-0.5'>
                {getActivityIcon(activity.type)}
              </div>
              <div className='flex-1 min-w-0'>
                <p className='text-sm font-medium text-foreground'>
                  {activity.title}
                </p>
                {activity.description && (
                  <p className='text-xs text-muted-foreground'>
                    {activity.description}
                  </p>
                )}
                <div className='flex items-center space-x-2 mt-1'>
                  {activity.user && (
                    <div className='flex items-center space-x-1'>
                      <Avatar className='h-4 w-4'>
                        <AvatarImage src={activity.user.avatar} />
                        <AvatarFallback className='text-xs'>
                          {activity.user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className='text-xs text-muted-foreground'>
                        {activity.user.name}
                      </span>
                    </div>
                  )}
                  <div className='flex items-center space-x-1 text-xs text-muted-foreground'>
                    <Clock className='h-3 w-3' />
                    <span>{activity.time}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {!showAll && activities.length > 5 && onShowAll && (
          <Button
            variant='ghost'
            size='sm'
            onClick={onShowAll}
            className='w-full mt-4'
          >
            Ver todas las actividades ({activities.length})
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// Widget de estadísticas rápidas
type QuickStatsProps = {
  title: string
  stats: {
    label: string
    value: string | number
    change?: {
      value: number
      period: string
    }
  }[]
  className?: string
}

export function QuickStatsWidget({ title, stats, className }: QuickStatsProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='text-sm font-medium flex items-center space-x-2'>
          <BarChart3 className='h-4 w-4' />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-2 gap-4'>
          {stats.map((stat, index) => (
            <div key={index} className='text-center'>
              <div className='text-2xl font-bold'>{stat.value}</div>
              <div className='text-xs text-muted-foreground'>{stat.label}</div>
              {stat.change && (
                <div className={cn(
                  'text-xs flex items-center justify-center space-x-1 mt-1',
                  stat.change.value >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  <TrendingUp className='h-3 w-3' />
                  <span>
                    {stat.change.value >= 0 ? '+' : ''}{stat.change.value}% {stat.change.period}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Widget de próximos eventos
type Event = {
  id: string
  title: string
  date: string
  time: string
  type?: 'meeting' | 'deadline' | 'reminder' | 'event'
}

type UpcomingEventsProps = {
  title: string
  events: Event[]
  className?: string
}

export function UpcomingEventsWidget({
  title,
  events,
  className,
}: UpcomingEventsProps) {
  const getEventBadgeVariant = (type?: string) => {
    switch (type) {
      case 'meeting':
        return 'default'
      case 'deadline':
        return 'destructive'
      case 'reminder':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='text-sm font-medium flex items-center space-x-2'>
          <Calendar className='h-4 w-4' />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          {events.slice(0, 4).map((event) => (
            <div key={event.id} className='flex items-center justify-between'>
              <div className='flex-1'>
                <p className='text-sm font-medium'>{event.title}</p>
                <div className='flex items-center space-x-2 text-xs text-muted-foreground'>
                  <span>{event.date}</span>
                  <span>•</span>
                  <span>{event.time}</span>
                </div>
              </div>
              {event.type && (
                <Badge variant={getEventBadgeVariant(event.type)} className='text-xs'>
                  {event.type}
                </Badge>
              )}
            </div>
          ))}
          {events.length === 0 && (
            <p className='text-sm text-muted-foreground text-center py-4'>
              No hay eventos próximos
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Widget de resumen de tareas
type TaskSummaryProps = {
  title: string
  tasks: {
    total: number
    completed: number
    pending: number
    overdue: number
  }
  className?: string
}

export function TaskSummaryWidget({
  title,
  tasks,
  className,
}: TaskSummaryProps) {
  const completionRate = tasks.total > 0 
    ? Math.round((tasks.completed / tasks.total) * 100) 
    : 0

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          <div className='text-center'>
            <div className='text-3xl font-bold'>{tasks.total}</div>
            <p className='text-xs text-muted-foreground'>Total de tareas</p>
          </div>
          
          <Progress value={completionRate} className='h-2' />
          
          <div className='grid grid-cols-3 gap-2 text-center'>
            <div>
              <div className='text-lg font-semibold text-green-600'>
                {tasks.completed}
              </div>
              <p className='text-xs text-muted-foreground'>Completadas</p>
            </div>
            <div>
              <div className='text-lg font-semibold text-blue-600'>
                {tasks.pending}
              </div>
              <p className='text-xs text-muted-foreground'>Pendientes</p>
            </div>
            <div>
              <div className='text-lg font-semibold text-red-600'>
                {tasks.overdue}
              </div>
              <p className='text-xs text-muted-foreground'>Vencidas</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Widget personalizable
type CustomWidgetProps = {
  title: string
  description?: string
  icon?: ReactNode
  children: ReactNode
  actions?: ReactNode
  className?: string
}

export function CustomWidget({
  title,
  description,
  icon,
  children,
  actions,
  className,
}: CustomWidgetProps) {
  return (
    <Card className={className}>
      <CardHeader className='flex flex-row items-center justify-between space-y-0'>
        <div className='space-y-1'>
          <CardTitle className='text-sm font-medium flex items-center space-x-2'>
            {icon}
            <span>{title}</span>
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {actions}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}