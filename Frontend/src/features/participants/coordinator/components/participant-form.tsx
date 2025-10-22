import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const participantSchema = z.object({
  user_name: z.string().min(1, 'El nombre es requerido'),
  user_email: z.string().email('Email inválido'),
  user_institution: z.string().optional(),
  event_id: z.string().min(1, 'El evento es requerido'),
  status: z.enum(['registrado', 'confirmado', 'cancelado']),
  attendance_confirmed: z.boolean().optional(),
  notes: z.string().optional(),
})

type ParticipantFormData = z.infer<typeof participantSchema>

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

interface ParticipantFormProps {
  participant?: Participant | null
  onSubmit: (data: ParticipantFormData) => Promise<void>
  onCancel: () => void
}

export function ParticipantForm({ participant, onSubmit, onCancel }: ParticipantFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<ParticipantFormData>({
    resolver: zodResolver(participantSchema),
    defaultValues: {
      user_name: participant?.user.name || '',
      user_email: participant?.user.email || '',
      user_institution: participant?.user.institution || '',
      event_id: participant?.event.id.toString() || '',
      status: participant?.status || 'registrado',
      attendance_confirmed: participant?.attendance_confirmed || false,
      notes: participant?.notes || '',
    }
  })

  // Mock events data
  const events = [
    { id: 1, name: 'Congreso Nacional de Ingeniería', status: 'activo' },
    { id: 2, name: 'Seminario de Tecnología', status: 'planificación' },
    { id: 3, name: 'Workshop de Innovación', status: 'planificación' },
  ]

  const handleFormSubmit = async (data: ParticipantFormData) => {
    await onSubmit(data)
    onCancel()
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información del Usuario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="user_name">Nombre Completo</Label>
              <Input
                id="user_name"
                {...register('user_name')}
                placeholder="Ej. Juan Pérez"
              />
              {errors.user_name && (
                <p className="text-sm text-red-500">{errors.user_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="user_email">Email</Label>
              <Input
                id="user_email"
                type="email"
                {...register('user_email')}
                placeholder="juan.perez@email.com"
              />
              {errors.user_email && (
                <p className="text-sm text-red-500">{errors.user_email.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user_institution">Institución (Opcional)</Label>
            <Input
              id="user_institution"
              {...register('user_institution')}
              placeholder="Ej. Universidad Nacional"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información del Registro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <Label htmlFor="status">Estado del Registro</Label>
            <Select
              value={watch('status')}
              onValueChange={(value) => setValue('status', value as 'registrado' | 'confirmado' | 'cancelado')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="registrado">Registrado</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-red-500">{errors.status.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="attendance_confirmed"
              checked={watch('attendance_confirmed')}
              onCheckedChange={(checked) => setValue('attendance_confirmed', !!checked)}
            />
            <Label htmlFor="attendance_confirmed">Asistencia confirmada</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (Opcional)</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Información adicional sobre el participante..."
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
          {isSubmitting ? 'Guardando...' : participant ? 'Actualizar' : 'Registrar'}
        </Button>
      </div>
    </form>
  )
}