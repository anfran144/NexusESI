import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { eventService } from '@/services/event.service'
import { toast } from 'sonner'
import type { Committee } from '@/services/committee.service'

interface CommitteeFormProps {
  committee?: Committee | null
  eventId: number
  onSubmit: (data: { name: string; memberIds?: number[] }) => Promise<void>
  onCancel: () => void
}

interface Participant {
  id: number
  user: {
    id: number
    name: string
    email: string
  }
}

export function CommitteeForm({ committee, eventId, onSubmit, onCancel }: CommitteeFormProps) {
  const [name, setName] = useState(committee?.name || '')
  const [selectedMembers, setSelectedMembers] = useState<number[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingParticipants, setLoadingParticipants] = useState(false)
  const [error, setError] = useState('')

  // Cargar participantes (líderes de semillero) del evento
  useEffect(() => {
    const loadParticipants = async () => {
      if (!eventId) return
      
      try {
        setLoadingParticipants(true)
        const response = await eventService.getEventParticipants(eventId)
        
        if (response.success) {
          setParticipants(response.data)
        }
      } catch {
        toast.error('Error al cargar participantes')
      } finally {
        setLoadingParticipants(false)
      }
    }

    loadParticipants()
  }, [eventId])

  const handleMemberToggle = (userId: number) => {
    setSelectedMembers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validación
    if (!name.trim()) {
      setError('El nombre del comité es requerido')
      return
    }

    if (name.trim().length < 3) {
      setError('El nombre debe tener al menos 3 caracteres')
      return
    }

    try {
      setLoading(true)
      setError('')
      await onSubmit({ 
        name: name.trim(),
        memberIds: selectedMembers.length > 0 ? selectedMembers : undefined
      })
    } catch (_error) {
      setError('Error al guardar el comité')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre del Comité *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Comité de Logística"
          disabled={loading}
          className={error ? 'border-destructive' : ''}
        />
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>

      {!committee && (
        <div className="space-y-3">
          <Label>Asignar Líderes de Semillero (Opcional)</Label>
          
          {loadingParticipants ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : participants.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              No hay participantes disponibles en este evento.
            </p>
          ) : (
            <div className="border rounded-lg p-4 space-y-3 max-h-[200px] overflow-y-auto">
              {participants.map((participant) => (
                <div key={participant.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={`member-${participant.user.id}`}
                    checked={selectedMembers.includes(participant.user.id)}
                    onCheckedChange={() => handleMemberToggle(participant.user.id)}
                    disabled={loading}
                  />
                  <label
                    htmlFor={`member-${participant.user.id}`}
                    className="flex-1 text-sm cursor-pointer"
                  >
                    <div className="font-medium">{participant.user.name}</div>
                    <div className="text-muted-foreground">{participant.user.email}</div>
                  </label>
                </div>
              ))}
            </div>
          )}
          
          {selectedMembers.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {selectedMembers.length} {selectedMembers.length === 1 ? 'líder seleccionado' : 'líderes seleccionados'}
            </p>
          )}
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading || loadingParticipants}>
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Guardando...
            </>
          ) : (
            committee ? 'Actualizar' : 'Crear Comité'
          )}
        </Button>
      </div>
    </form>
  )
}

