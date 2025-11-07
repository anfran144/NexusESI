import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const committeeSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  event_id: z.string().min(1, 'El evento es requerido'),
  description: z.string().optional(),
})

type CommitteeFormData = z.infer<typeof committeeSchema>

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

interface CommitteeFormProps {
  committee?: Committee | null | any
  onSubmit: (data: CommitteeFormData) => Promise<void>
  onCancel: () => void
}

export function CommitteeForm({ committee, onSubmit, onCancel }: CommitteeFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<CommitteeFormData>({
    resolver: zodResolver(committeeSchema),
    defaultValues: {
      name: committee?.name || '',
      event_id: committee?.event.id.toString() || '',
      description: '',
    }
  })

  // Mock events data
  const events = [
    { id: 1, name: 'Congreso Nacional de Ingeniería', status: 'planificación' },
    { id: 2, name: 'Seminario de Tecnología', status: 'activo' },
    { id: 3, name: 'Workshop de Innovación', status: 'planificación' },
  ]

  const handleFormSubmit = async (data: CommitteeFormData) => {
    await onSubmit(data)
    onCancel()
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información del Comité</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Comité</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Ej. Comité Organizador"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="event_id">Evento</Label>
            <Select
              value={watch('event_id')}
              onValueChange={(value) => setValue('event_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un evento" />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id.toString()}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.event_id && (
              <p className="text-sm text-red-500">{errors.event_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (Opcional)</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Describe las responsabilidades del comité..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : committee ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  )
}