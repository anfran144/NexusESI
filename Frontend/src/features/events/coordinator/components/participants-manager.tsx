import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Users } from 'lucide-react'
import { eventService } from '@/services/event.service'
import { toast } from 'sonner'

interface Participant {
  id: number
  user: {
    id: number
    name: string
    email: string
    institution?: {
      nombre: string
    }
  }
  created_at: string
}

interface ParticipantsManagerProps {
  eventId: number
  onUpdate?: () => void
}

export function ParticipantsManager({ eventId }: ParticipantsManagerProps) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)

  const loadParticipants = useCallback(async () => {
    try {
      setLoading(true)
      const response = await eventService.getEventParticipants(eventId)
      
      if (response.success) {
        setParticipants(response.data)
      }
    } catch (_error) {
      toast.error('Error al cargar los participantes')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    loadParticipants()
  }, [loadParticipants])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando participantes...</p>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Participantes del Evento
          </CardTitle>
          <Badge variant="default" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {participants.length} Participantes
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {participants.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay participantes</h3>
            <p className="text-muted-foreground">
              Aún no hay participantes registrados para este evento.
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participante</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Institución</TableHead>
                  <TableHead>Fecha de Registro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((participant) => {
                  return (
                    <TableRow key={participant.id}>
                      <TableCell className="font-medium">
                        {participant.user.name}
                      </TableCell>
                      <TableCell>{participant.user.email}</TableCell>
                      <TableCell>
                        {participant.user.institution?.nombre || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {new Date(participant.created_at).toLocaleDateString('es-ES')}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
