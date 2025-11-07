import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Users, Plus, UserX, UserPlus, FolderKanban } from 'lucide-react'
import { eventService } from '@/services/event.service'
import { committeeService, type Committee } from '@/services/committee.service'
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
  const [committees, setCommittees] = useState<Committee[]>([])
  const [loading, setLoading] = useState(true)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null)
  const [selectedCommitteeId, setSelectedCommitteeId] = useState<string>('')
  const [assigning, setAssigning] = useState(false)

  const loadParticipants = useCallback(async () => {
    try {
      setLoading(true)
      const response = await eventService.getEventParticipants(eventId)
      
      if (response.success) {
        setParticipants(response.data)
      }
    } catch (_error) {
      toast.error('Error al cargar los líderes')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  const loadCommittees = useCallback(async () => {
    try {
      const response = await committeeService.getCommittees({ event_id: eventId })
      
      if (response.success) {
        setCommittees(response.data)
      }
    } catch (_error) {
      toast.error('Error al cargar los comités')
    }
  }, [eventId])

  useEffect(() => {
    loadParticipants()
    loadCommittees()
  }, [loadParticipants, loadCommittees])

  const handleOpenAssignDialog = (participant: Participant) => {
    setSelectedParticipant(participant)
    setAssignDialogOpen(true)
    setSelectedCommitteeId('')
  }

  const handleAssignToCommittee = async () => {
    if (!selectedParticipant || !selectedCommitteeId) {
      toast.error('Selecciona un comité')
      return
    }

    try {
      setAssigning(true)
      
      await committeeService.assignMember(Number(selectedCommitteeId), {
        user_id: selectedParticipant.user.id
      })
      
      toast.success(`Líder asignado al comité exitosamente`)
      setAssignDialogOpen(false)
      setSelectedParticipant(null)
      setSelectedCommitteeId('')
      
      // Recargar datos
      await loadCommittees()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Error al asignar el líder al comité'
      toast.error(errorMessage)
    } finally {
      setAssigning(false)
    }
  }

  const getCommitteesForParticipant = (participantUserId: number): Committee[] => {
    // Filtrar comités donde el participante es miembro
    return committees.filter(committee => 
      committee.members?.some(member => member.id === participantUserId)
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando líderes...</p>
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
            Líderes de Semillero del Evento
          </CardTitle>
          <Badge variant="default" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {participants.length} {participants.length === 1 ? 'Líder' : 'Líderes'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {participants.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay líderes de semillero</h3>
            <p className="text-muted-foreground">
              Aún no hay líderes de semillero registrados para este evento.
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Líder</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Institución</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((participant) => {
                  const participantCommittees = getCommitteesForParticipant(participant.user.id)
                  const hasCommittees = participantCommittees.length > 0
                  
                  return (
                    <TableRow key={participant.id}>
                      <TableCell className="font-medium">
                        {participant.user.name}
                      </TableCell>
                      <TableCell>{participant.user.email}</TableCell>
                      <TableCell>
                        {participant.user.institution?.nombre || 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog open={assignDialogOpen && selectedParticipant?.id === participant.id} onOpenChange={setAssignDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenAssignDialog(participant)}
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Asignar a Comité
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Asignar a Comité</DialogTitle>
                              <DialogDescription>
                                Selecciona un comité para asignar al líder de semillero
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Líder de Semillero</label>
                                <p className="text-sm text-muted-foreground">
                                  {selectedParticipant?.user.name} ({selectedParticipant?.user.email})
                                </p>
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium">Seleccionar Comité</label>
                                <Select value={selectedCommitteeId} onValueChange={setSelectedCommitteeId}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un comité" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {committees.map((committee) => (
                                      <SelectItem key={committee.id} value={committee.id.toString()}>
                                        <div className="flex items-center gap-2">
                                          <FolderKanban className="h-4 w-4" />
                                          {committee.name}
                                          <Badge variant="secondary" className="ml-2">
                                            {committee.members_count} {committee.members_count === 1 ? 'miembro' : 'miembros'}
                                          </Badge>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => setAssignDialogOpen(false)}
                                  disabled={assigning}
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  onClick={handleAssignToCommittee}
                                  disabled={!selectedCommitteeId || assigning}
                                >
                                  {assigning ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                      Asignando...
                                    </>
                                  ) : (
                                    <>
                                      <UserPlus className="h-4 w-4 mr-2" />
                                      Asignar
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        {hasCommittees && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground">
                              Comités: {participantCommittees.map(c => c.name).join(', ')}
                            </p>
                          </div>
                        )}
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
