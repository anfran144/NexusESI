"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { Button } from "./button"
import { Badge } from "./badge"
import { Calendar, MapPin, Clock, Users, ArrowRight, CheckCircle } from "lucide-react"

interface EventCardProps {
  event: {
    id: number
    name: string
    description: string
    date: string
    time: string
    location: string
    institution: string
    status: 'open' | 'upcoming' | 'closed'
    participants: number
    maxParticipants: number
  }
  onJoin?: (eventId: number) => void
  onView?: (eventId: number) => void
  className?: string
  variant?: "default" | "compact" | "detailed"
}

export function EventCard({
  event,
  onJoin,
  onView,
  className,
  variant = "default",
}: EventCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="default" className="bg-green-500">Abierto</Badge>
      case 'upcoming':
        return <Badge variant="secondary">Próximo</Badge>
      case 'closed':
        return <Badge variant="outline">Cerrado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getParticipantPercentage = () => {
    return Math.round((event.participants / event.maxParticipants) * 100)
  }

  const isFullyBooked = event.participants >= event.maxParticipants

  if (variant === "compact") {
    return (
      <Card className={cn("hover:shadow-md transition-shadow", className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{event.name}</h3>
              <p className="text-sm text-muted-foreground truncate">{event.description}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>{formatDate(event.date)}</span>
                <span>{event.location}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              {getStatusBadge(event.status)}
              {event.status === 'open' && !isFullyBooked && (
                <Button size="sm" onClick={() => onJoin?.(event.id)}>
                  Unirse
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (variant === "detailed") {
    return (
      <Card className={cn("hover:shadow-md transition-shadow", className)}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl">{event.name}</CardTitle>
              <CardDescription className="text-base">{event.description}</CardDescription>
            </div>
            {getStatusBadge(event.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Información del evento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{formatDate(event.date)} a las {event.time}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{event.location}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{event.institution}</span>
              </div>
            </div>
            
            {/* Progreso de participantes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Participantes</span>
                <span className="font-medium">{event.participants}/{event.maxParticipants}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${getParticipantPercentage()}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {getParticipantPercentage()}% de capacidad
              </p>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{event.participants} participantes</span>
              </div>
              {isFullyBooked && (
                <div className="flex items-center gap-1 text-orange-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Lleno</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {onView && (
                <Button variant="outline" onClick={() => onView(event.id)}>
                  Ver Detalles
                </Button>
              )}
              {event.status === 'open' && !isFullyBooked && onJoin && (
                <Button onClick={() => onJoin(event.id)} className="flex items-center gap-2">
                  Unirse al Evento
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Variant default
  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{event.name}</CardTitle>
            <CardDescription className="text-base">{event.description}</CardDescription>
          </div>
          {getStatusBadge(event.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(event.date)} a las {event.time}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{event.location}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>{event.participants}/{event.maxParticipants} participantes</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>{event.institution}</span>
            </div>
          </div>
          
          {event.status === 'open' && !isFullyBooked && onJoin && (
            <Button onClick={() => onJoin(event.id)} className="flex items-center gap-2">
              Unirse al Evento
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
