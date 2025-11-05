import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface KPICardProps {
  title: string
  value: number
  subtitle?: string
  icon?: React.ReactNode
  variant?: 'default' | 'success' | 'danger' | 'warning'
}

export function KPICard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  variant = 'default' 
}: KPICardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'border-green-200 bg-green-50/50 text-green-700'
      case 'danger':
        return 'border-red-200 bg-red-50/50 text-red-700'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50/50 text-yellow-700'
      default:
        return 'border-border bg-card/50 text-foreground'
    }
  }

  return (
    <Card className={cn('transition-all duration-200 hover:shadow-md', getVariantStyles())}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {icon && (
            <div className="text-muted-foreground">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
