import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ParticipantForm } from './participant-form'

interface Participant {
  id: number
  event: {
    id: number
    name: string
    status: string
  }
  user: {
    id: number
    name: string
    email: string
    institution?: string
  }
  registration_date: string
  status: 'registrado' | 'confirmado' | 'cancelado'
  attendance_confirmed: boolean
  notes?: string
}

interface ParticipantDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  participant?: Participant | null
  onSaved: () => void
}

export function ParticipantDialog({ open, onOpenChange, participant, onSaved }: ParticipantDialogProps) {
  const handleSubmit = async (data: any) => {
    // Simular llamada a la API
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('Participant data:', data)
    onSaved()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {participant ? 'Editar Participante' : 'Registrar Nuevo Participante'}
          </DialogTitle>
          <DialogDescription>
            {participant 
              ? 'Modifica la información del participante existente.'
              : 'Completa la información para registrar un nuevo participante.'
            }
          </DialogDescription>
        </DialogHeader>
        <ParticipantForm
          participant={participant}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}