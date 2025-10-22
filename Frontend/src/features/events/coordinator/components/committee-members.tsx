import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Plus, Trash2 } from 'lucide-react'
import { committeeService, type CommitteeMember } from '@/services/committee.service'
import { toast } from 'sonner'

interface CommitteeMembersProps {
  committeeId: number
}

export function CommitteeMembers({ committeeId }: CommitteeMembersProps) {
  const [members, setMembers] = useState<CommitteeMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [userId, setUserId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadMembers = useCallback(async () => {
    try {
      setLoading(true)
      const response = await committeeService.getMembers(committeeId)
      if (response.success) {
        setMembers(response.data)
      }
    } catch (_error) {
      toast.error('Error al cargar los miembros')
    } finally {
      setLoading(false)
    }
  }, [committeeId])

  useEffect(() => {
    loadMembers()
  }, [loadMembers])

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userId) {
      toast.error('Ingresa el ID del usuario')
      return
    }

    try {
      setSubmitting(true)
      const response = await committeeService.assignMember(committeeId, {
        user_id: Number(userId)
      })

      if (response.success) {
        toast.success('Miembro agregado exitosamente')
        setUserId('')
        setShowAddForm(false)
        await loadMembers()
      }
    } catch (_error) {
      toast.error('Error al agregar el miembro')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemoveMember = async (memberId: number) => {
    if (!confirm('¿Estás seguro de remover este miembro del comité?')) return

    try {
      await committeeService.removeMember(committeeId, memberId)
      toast.success('Miembro removido exitosamente')
      await loadMembers()
    } catch (_error) {
      toast.error('Error al remover el miembro')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando miembros...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Botón agregar miembro */}
      {!showAddForm && (
        <Button onClick={() => setShowAddForm(true)} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Miembro
        </Button>
      )}

      {/* Formulario agregar miembro */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nuevo Miembro</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userId">Usuario</Label>
                <Input
                  id="userId"
                  type="number"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="ID del usuario"
                  disabled={submitting}
                />
                <p className="text-xs text-muted-foreground">
                  Ingresa el ID del usuario que deseas agregar. El usuario será agregado como miembro del comité.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false)
                    setUserId('')
                  }}
                  disabled={submitting}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? 'Agregando...' : 'Agregar'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de miembros */}
      {members.length === 0 ? (
        <div className="text-center py-8">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No hay miembros</h3>
          <p className="text-muted-foreground">
            Agrega el primer miembro a este comité
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Institución</TableHead>
                <TableHead>Fecha de Asignación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    {member.user.name}
                  </TableCell>
                  <TableCell>{member.user.email}</TableCell>
                  <TableCell>
                    {member.user.institution?.nombre || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {new Date(member.assigned_at).toLocaleDateString('es-ES')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.user.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
