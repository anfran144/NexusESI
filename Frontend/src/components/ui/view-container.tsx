"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { Badge } from "./badge"
import { Button } from "./button"
import { Separator } from "./separator"

interface ViewContainerProps {
  title: string
  description?: string
  children: React.ReactNode
  actions?: React.ReactNode
  className?: string
  variant?: "default" | "compact" | "full"
  showHeader?: boolean
  showSeparator?: boolean
}

export function ViewContainer({
  title,
  description,
  children,
  actions,
  className,
  variant = "default",
  showHeader = true,
  showSeparator = true,
}: ViewContainerProps) {
  const containerVariants = {
    default: "max-w-7xl mx-auto",
    compact: "max-w-4xl mx-auto",
    full: "w-full",
  }

  return (
    <div className={cn("space-y-6", containerVariants[variant], className)}>
      {showHeader && (
        <>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
              {description && (
                <p className="text-muted-foreground">{description}</p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2">
                {actions}
              </div>
            )}
          </div>
          {showSeparator && <Separator />}
        </>
      )}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  )
}

interface ViewSectionProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
  variant?: "card" | "plain"
}

export function ViewSection({
  title,
  description,
  children,
  className,
  variant = "card",
}: ViewSectionProps) {
  if (variant === "plain") {
    return (
      <div className={cn("space-y-4", className)}>
        {title && (
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">{title}</h2>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        )}
        {children}
      </div>
    )
  }

  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  )
}

interface ViewGridProps {
  children: React.ReactNode
  className?: string
  cols?: 1 | 2 | 3 | 4 | 6
  gap?: "sm" | "md" | "lg"
}

export function ViewGrid({
  children,
  className,
  cols = 3,
  gap = "md",
}: ViewGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    6: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
  }

  const gridGaps = {
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
  }

  return (
    <div
      className={cn(
        "grid",
        gridCols[cols],
        gridGaps[gap],
        className
      )}
    >
      {children}
    </div>
  )
}

interface ViewHeaderProps {
  title: string
  description?: string
  badge?: string
  actions?: React.ReactNode
  className?: string
}

export function ViewHeader({
  title,
  description,
  badge,
  actions,
  className,
}: ViewHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{title}</h1>
          {badge && <Badge variant="secondary">{badge}</Badge>}
        </div>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
