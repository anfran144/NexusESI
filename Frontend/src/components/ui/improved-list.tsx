"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { Badge } from "./badge"
import { Button } from "./button"
import { Avatar, AvatarFallback, AvatarImage } from "./avatar"
import { Separator } from "./separator"

interface ListItemProps {
  title: string
  description?: string
  subtitle?: string
  avatar?: string
  badge?: {
    text: string
    variant?: "default" | "secondary" | "destructive" | "outline"
  }
  actions?: React.ReactNode
  onClick?: () => void
  className?: string
  variant?: "default" | "compact" | "detailed"
}

export function ListItem({
  title,
  description,
  subtitle,
  avatar,
  badge,
  actions,
  onClick,
  className,
  variant = "default",
}: ListItemProps) {
  const isClickable = !!onClick

  const content = (
    <div className={cn(
      "flex items-center space-x-4 p-4",
      isClickable && "cursor-pointer hover:bg-muted/50 transition-colors",
      className
    )}>
      {avatar && (
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatar} alt={title} />
          <AvatarFallback>
            {title.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{title}</p>
          {badge && (
            <Badge variant={badge.variant || "secondary"} className="text-xs">
              {badge.text}
            </Badge>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        )}
        {description && variant === "detailed" && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {description}
          </p>
        )}
      </div>
      
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  )

  if (isClickable) {
    return (
      <div onClick={onClick} className="cursor-pointer">
        {content}
      </div>
    )
  }

  return content
}

interface ListProps {
  children: React.ReactNode
  className?: string
  variant?: "default" | "card" | "bordered"
  title?: string
  description?: string
  actions?: React.ReactNode
  emptyState?: React.ReactNode
}

export function List({
  children,
  className,
  variant = "default",
  title,
  description,
  actions,
  emptyState,
}: ListProps) {
  const isEmpty = React.Children.count(children) === 0

  if (isEmpty && emptyState) {
    return (
      <div className={cn("text-center py-8", className)}>
        {emptyState}
      </div>
    )
  }

  if (variant === "card") {
    return (
      <Card className={className}>
        {(title || description || actions) && (
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                {title && <CardTitle>{title}</CardTitle>}
                {description && <CardDescription>{description}</CardDescription>}
              </div>
              {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
          </CardHeader>
        )}
        <CardContent className="p-0">
          <div className="divide-y">
            {children}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (variant === "bordered") {
    return (
      <div className={cn("border rounded-lg", className)}>
        {(title || description || actions) && (
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                {title && <h3 className="font-semibold">{title}</h3>}
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
              </div>
              {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
          </div>
        )}
        <div className="divide-y">
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-1", className)}>
      {(title || description || actions) && (
        <div className="flex items-center justify-between p-4">
          <div>
            {title && <h3 className="font-semibold">{title}</h3>}
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  )
}

interface ListHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

export function ListHeader({
  title,
  description,
  actions,
  className,
}: ListHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between p-4", className)}>
      <div>
        <h3 className="font-semibold">{title}</h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

interface ListEmptyProps {
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  icon?: React.ReactNode
}

export function ListEmpty({
  title,
  description,
  action,
  icon,
}: ListEmptyProps) {
  return (
    <div className="text-center py-8">
      {icon && <div className="mx-auto mb-4 text-muted-foreground">{icon}</div>}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-4">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}
    </div>
  )
}
