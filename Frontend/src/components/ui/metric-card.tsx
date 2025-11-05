"use client"

import * as React from "react"
import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from "./card"
import { Badge } from "./badge"

interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  trend?: {
    value: number
    label: string
    isPositive?: boolean
  }
  icon?: LucideIcon
  className?: string
  variant?: "default" | "success" | "warning" | "danger"
}

export function MetricCard({
  title,
  value,
  description,
  trend,
  icon: Icon,
  className,
  variant = "default",
}: MetricCardProps) {
  const trendIcon = trend?.isPositive ? TrendingUp : TrendingDown
  const TrendIcon = trendIcon

  const variantStyles = {
    default: "bg-gradient-to-t from-primary/5 to-card",
    success: "bg-gradient-to-t from-green-500/5 to-card",
    warning: "bg-gradient-to-t from-yellow-500/5 to-card",
    danger: "bg-gradient-to-t from-red-500/5 to-card",
  }

  return (
    <Card className={cn(
      "shadow-xs",
      variantStyles[variant],
      className
    )}>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {value}
        </CardTitle>
        {trend && (
          <CardAction>
            <Badge variant="outline">
              <TrendIcon className="size-3" />
              {trend.isPositive ? "+" : ""}{trend.value}%
            </Badge>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex-col items-start gap-1.5 text-sm">
        {description && (
          <div className="line-clamp-1 flex gap-2 font-medium">
            {trend && (
              <TrendIcon className="size-4" />
            )}
            {description}
          </div>
        )}
        {trend && (
          <div className="text-muted-foreground">
            {trend.label}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
