import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FolderKanban, Plus, Edit, Trash2, Users } from 'lucide-react'
import { committeeService, type Committee } from '@/services/committee.service'
import { CommitteeForm } from './committee-form'
import { CommitteeMembers } from './committee-members'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/usePermissions'

interface CommitteesManagerProps {
  eventId: number
}

export function CommitteesManager({ eventId }: CommitteesManagerProps) {
  const { hasPermission } = usePermissions()
  const [committees, setCommittees] = useState<Committee[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [membersOpen, setMembersOpen] = useState(false)
  const [selectedCommittee, setSelectedCommittee] = useState<Committee | null>(null)

  const loadCommittees = useCallback(async () => {
    try {
      setLoading(true)
      const response = await committeeService.getCommittees({ event_id: eventId })
      
      if (response.success) {
        setCommittees(response.data)
      }
    } catch (_error) {
      toast.error('Error al cargar los comités')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    loadCommittees()
  }, [loadCommittees])

  const handleCreateCommittee = async (data: { name: string; memberIds?: number[] }) => {
    try {
      const response = await committeeService.createCommittee({
        name: data.name,
        event_id: eventId,
      })

      if (response.success && data.memberIds && data.memberIds.length > 0) {
        // Asignar miembros al comité recién creado
        const committeeId = response.data.id
        
        for (const userId of data.memberIds) {
          try {
            await committeeService.assignMember(committeeId, {
              user_id: userId,
              role: 'Miembro', // Rol por defecto
            })
          } catch {
            // Continuar con los demás miembros si uno falla
          }
        }
        
        toast.success(`Comité creado con ${data.memberIds.length} ${data.memberIds.length === 1 ? 'miembro' : 'miembros'}`)
      } else if (response.success) {
        toast.success('Comité creado exitosamente')
      }
      
      setFormOpen(false)
      await loadCommittees()
    } catch (_error) {
      toast.error('Error al crear el comité')
    }
  }

  const handleUpdateCommittee = async (data: { name: string; memberIds?: number[] }) => {
    if (!selectedCommittee) return

    try {
      const response = await committeeService.updateCommittee(selectedCommittee.id, {
        name: data.name,
        event_id: eventId,
      })

      if (response.success) {
        toast.success('Comité actualizado exitosamente')
        setFormOpen(false)
        setSelectedCommittee(null)
        await loadCommittees()
      }
    } catch (_error) {
      toast.error('Error al actualizar el comité')
    }
  }

  const handleDeleteCommittee = async (committeeId: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este comité?')) return

    try {
      await committeeService.deleteCommittee(committeeId)
      toast.success('Comité eliminado exitosamente')
      await loadCommittees()
    } catch (_error) {
      toast.error('Error al eliminar el comité')
    }
  }

  const openEditForm = (committee: Committee) => {
    setSelectedCommittee(committee)
    setFormOpen(true)
  }

  const openMembersDialog = (committee: Committee) => {
    setSelectedCommittee(committee)
    setMembersOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setSelectedCommittee(null)
  }

  const closeMembers = () => {
    setMembersOpen(false)
    setSelectedCommittee(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando comités...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5" />
              Comités del Evento
            </CardTitle>
            {hasPermission('events.committees.manage') && (
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Comité
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {committees.length === 0 ? (
            <div className="text-center py-8">
              <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay comités</h3>
              <p className="text-muted-foreground mb-4">
                Aún no hay comités creados para este evento.
              </p>
              {hasPermission('events.committees.manage') && (
                <Button onClick={() => setFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Comité
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {committees.map((committee) => (
                <Card key={committee.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span className="line-clamp-1">{committee.name}</span>
                      <Badge variant="secondary">
                        <Users className="h-3 w-3 mr-1" />
                        {committee.members_count}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openMembersDialog(committee)}
                      >
                        <Users className="h-4 w-4 mr-1" />
                        Miembros
                      </Button>
                      {hasPermission('events.committees.manage') && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditForm(committee)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCommittee(committee.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de formulario */}
      <Dialog open={formOpen} onOpenChange={closeForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedCommittee ? 'Editar Comité' : 'Crear Nuevo Comité'}
            </DialogTitle>
          </DialogHeader>
          <CommitteeForm
            committee={selectedCommittee}
            eventId={eventId}
            onSubmit={selectedCommittee ? handleUpdateCommittee : handleCreateCommittee}
            onCancel={closeForm}
          />
        </DialogContent>
      </Dialog>

      {/* Diálogo de miembros */}
      <Dialog open={membersOpen} onOpenChange={closeMembers}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Miembros del Comité: {selectedCommittee?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedCommittee && (
            <CommitteeMembers committeeId={selectedCommittee.id} />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
