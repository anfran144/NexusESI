import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CommitteeForm } from './committee-form'

interface Committee {
  id: number
  name: string
  event: {
    id: number
    name: string
    status: string
  }
  members: Array<{
    id: number
    user: {
      id: number
      name: string
      email: string
    }
    role: string
    assigned_at: string
  }>
  members_count: number
  created_at: string
}

interface CommitteeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  committee?: Committee | null | { 
    id: number
    name: string
    event_id: number
    event?: {
      id: number
      name: string
      status: string
    }
    members_count: number
    members?: any[]
    color?: string
    created_at: string
    updated_at: string
  }
  onSaved: () => void
}

export function CommitteeDialog({ open, onOpenChange, committee, onSaved }: CommitteeDialogProps) {
  const handleSubmit = async (data: any) => {
    // Simular llamada a la API
    await new Promise(resolve => setTimeout(resolve, 1000))
    console.log('Committee data:', data)
    onSaved()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {committee ? 'Editar Comité' : 'Crear Nuevo Comité'}
          </DialogTitle>
          <DialogDescription>
            {committee 
              ? 'Modifica la información del comité existente.'
              : 'Completa la información para crear un nuevo comité.'
            }
          </DialogDescription>
        </DialogHeader>
        <CommitteeForm
          committee={committee}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}