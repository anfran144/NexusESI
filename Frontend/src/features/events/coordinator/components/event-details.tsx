import { Calendar, Users, Clock, User, Building2 } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface Event {
  id: number
  name: string
  description: string
  start_date: string
  end_date: string
  status: 'planificación' | 'en_progreso' | 'finalizado' | 'cancelado'
  coordinator: {
    id: number
    name: string
  }
  institution: {
    id: number
    nombre: string
    identificador?: string
  }
  participants_count: number
  committees_count: number
  created_at: string
}

interface EventDetailsProps {
  event: Event
}

const statusColors = {
  'planificación': 'secondary' as const,
  'en_progreso': 'default' as const,
  'finalizado': 'outline' as const,
  'cancelado': 'destructive' as const
}

const statusLabels = {
  'planificación': 'Planificación',
  'en_progreso': 'En Progreso',
  'finalizado': 'Finalizado',
  'cancelado': 'Cancelado'
}

export function EventDetails({ event }: EventDetailsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">{event.name}</h2>
          <p className="text-muted-foreground mt-1">{event.description}</p>
        </div>
        <Badge className={statusColors[event.status]}>
          {statusLabels[event.status]}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Información del Evento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Fecha de Inicio</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(event.start_date), 'PPP', { locale: es })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Fecha de Fin</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(event.end_date), 'PPP', { locale: es })}
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Coordinador</p>
                <p className="text-sm text-muted-foreground">{event.coordinator.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Institución</p>
                <p className="text-sm text-muted-foreground">{event.institution.nombre}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Estadísticas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Participantes</span>
              <Badge variant="secondary">{event.participants_count}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Comités</span>
              <Badge variant="secondary">{event.committees_count}</Badge>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Creado</span>
              <span className="text-sm text-muted-foreground">
                {format(new Date(event.created_at), 'PPP', { locale: es })}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}