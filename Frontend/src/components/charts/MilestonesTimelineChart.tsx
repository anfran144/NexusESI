import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Play,
  Plus,
  Users,
  CheckCircle,
  AlertTriangle,
  Bell,
  Flag,
  Calendar,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export interface MilestoneData {
  id: string
  type: string
  title: string
  description: string
  date: string
  timestamp: string
  icon: string
  color: string
  metadata?: Record<string, any>
}

interface MilestonesTimelineChartProps {
  data: MilestoneData[]
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  play: Play,
  plus: Plus,
  users: Users,
  'check-circle': CheckCircle,
  'alert-triangle': AlertTriangle,
  bell: Bell,
  flag: Flag,
  calendar: Calendar,
}

const colorMap: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-950/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-700 dark:text-green-300',
    icon: 'text-green-600 dark:text-green-400',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-950/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-700 dark:text-red-300',
    icon: 'text-red-600 dark:text-red-400',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-950/20',
    border: 'border-orange-200 dark:border-orange-800',
    text: 'text-orange-700 dark:text-orange-300',
    icon: 'text-orange-600 dark:text-orange-400',
  },
  gray: {
    bg: 'bg-gray-50 dark:bg-gray-950/20',
    border: 'border-gray-200 dark:border-gray-800',
    text: 'text-gray-700 dark:text-gray-300',
    icon: 'text-gray-600 dark:text-gray-400',
  },
}

export function MilestonesTimelineChart({ data }: MilestonesTimelineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>No hay hitos disponibles para este evento</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Línea vertical */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

      {/* Hitos */}
      <div className="space-y-6">
        {data.map((milestone, index) => {
          const IconComponent = iconMap[milestone.icon] || Calendar
          const colors = colorMap[milestone.color] || colorMap.gray
          const date = new Date(milestone.date)
          const isPast = date < new Date()

          return (
            <div key={milestone.id} className="relative flex items-start gap-4">
              {/* Ícono */}
              <div
                className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 ${colors.border} ${colors.bg} ${colors.icon}`}
              >
                <IconComponent className="h-5 w-5" />
              </div>

              {/* Contenido */}
              <div className="flex-1 space-y-1 pb-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">{milestone.title}</h4>
                  <Badge
                    variant={isPast ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {format(date, 'dd MMM yyyy', { locale: es })}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{milestone.description}</p>
                {milestone.metadata && Object.keys(milestone.metadata).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {milestone.metadata.committee_name && (
                      <Badge variant="outline" className="text-xs">
                        {milestone.metadata.committee_name}
                      </Badge>
                    )}
                    {milestone.metadata.task_title && (
                      <Badge variant="outline" className="text-xs">
                        {milestone.metadata.task_title}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
