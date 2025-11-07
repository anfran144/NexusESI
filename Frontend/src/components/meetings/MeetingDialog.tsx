import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { meetingService, type Meeting, type MeetingFormData } from '@/services/meeting.service'
import { committeeService } from '@/services/committee.service'
import { toast } from 'sonner'
import { Calendar, Clock, MapPin, Users } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const meetingSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(255, 'El título no puede exceder 255 caracteres'),
  description: z.string().optional(),
  scheduled_at: z.string().min(1, 'La fecha y hora son requeridas'),
  location: z.string().optional(),
  meeting_type: z.enum(['planning', 'coordination', 'committee', 'general']),
  committee_ids: z.array(z.number()).optional(),
}).refine((data) => {
  // Si el tipo requiere comités, validar que se hayan seleccionado
  if (data.meeting_type === 'coordination' || data.meeting_type === 'committee') {
    return data.committee_ids && data.committee_ids.length > 0
  }
  return true
}, {
  message: 'Debe seleccionar al menos un comité para este tipo de reunión',
  path: ['committee_ids'],
})

type MeetingFormValues = z.infer<typeof meetingSchema>

interface MeetingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  meeting?: Meeting | null
  eventId: number
  eventStartDate?: string
  eventEndDate?: string
  onSaved: () => void
}

const meetingTypeLabels = {
  planning: 'Planificación',
  coordination: 'Coordinación',
  committee: 'Comité',
  general: 'General',
}

const meetingTypeDescriptions = {
  planning: 'Reunión de planificación con todos los líderes del evento',
  coordination: 'Reunión de coordinación entre comités específicos',
  committee: 'Reunión interna de un comité',
  general: 'Reunión general del evento',
}

export function MeetingDialog({
  open,
  onOpenChange,
  meeting,
  eventId,
  eventStartDate,
  eventEndDate,
  onSaved,
}: MeetingDialogProps) {
  const [committees, setCommittees] = useState<Array<{ id: number; name: string }>>([])
  const [loadingCommittees, setLoadingCommittees] = useState(false)
  const [previewInvitees, setPreviewInvitees] = useState<Array<{ id: number; name: string; email: string }>>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MeetingFormValues>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      title: '',
      description: '',
      scheduled_at: '',
      location: '',
      meeting_type: 'general',
      committee_ids: [],
    },
  })

  const meetingType = watch('meeting_type')
  const selectedCommitteeIds = watch('committee_ids') || []

  // Cargar comités del evento
  useEffect(() => {
    if (open && eventId) {
      loadCommittees()
    }
  }, [open, eventId])

  // Cargar datos de la reunión si está editando
  useEffect(() => {
    if (open && meeting) {
      reset({
        title: meeting.title,
        description: meeting.description || '',
        scheduled_at: meeting.scheduled_at ? format(new Date(meeting.scheduled_at), "yyyy-MM-dd'T'HH:mm") : '',
        location: meeting.location || '',
        meeting_type: meeting.meeting_type,
        committee_ids: [], // Se cargará desde las invitaciones si es necesario
      })
    } else if (open && !meeting) {
      reset({
        title: '',
        description: '',
        scheduled_at: '',
        location: '',
        meeting_type: 'general',
        committee_ids: [],
      })
    }
  }, [open, meeting, reset])

  const loadCommittees = async () => {
    try {
      setLoadingCommittees(true)
      const response = await committeeService.getCommittees({ event_id: eventId })
      if (response.success) {
        setCommittees(response.data)
      }
    } catch (error) {
      console.error('Error loading committees:', error)
      toast.error('Error al cargar los comités')
    } finally {
      setLoadingCommittees(false)
    }
  }

  const handleFormSubmit = async (data: MeetingFormValues) => {
    try {
      const formData: MeetingFormData = {
        title: data.title,
        description: data.description || undefined,
        scheduled_at: data.scheduled_at,
        location: data.location || undefined,
        meeting_type: data.meeting_type,
        committee_ids: (data.meeting_type === 'coordination' || data.meeting_type === 'committee')
          ? data.committee_ids
          : undefined,
      }

      if (meeting) {
        await meetingService.updateMeeting(meeting.id, formData)
        toast.success('Reunión actualizada exitosamente')
      } else {
        await meetingService.createMeeting(eventId, formData)
        toast.success('Reunión creada exitosamente')
      }

      onSaved()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error saving meeting:', error)
      toast.error(error.response?.data?.message || 'Error al guardar la reunión')
    }
  }

  // Calcular fecha mínima (ahora) y máxima (fin del evento)
  const minDateTime = new Date().toISOString().slice(0, 16)
  const maxDateTime = eventEndDate
    ? new Date(new Date(eventEndDate).setHours(23, 59, 59)).toISOString().slice(0, 16)
    : undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {meeting ? 'Editar Reunión' : 'Crear Nueva Reunión'}
          </DialogTitle>
          <DialogDescription>
            {meeting
              ? 'Modifica la información de la reunión.'
              : 'Completa la información para crear una nueva reunión. Los participantes serán invitados automáticamente según el tipo seleccionado.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="space-y-4">
            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="Ej: Reunión de Planificación Semanal"
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Describe el propósito de la reunión..."
                rows={3}
              />
            </div>

            {/* Tipo de Reunión */}
            <div className="space-y-2">
              <Label htmlFor="meeting_type">Tipo de Reunión *</Label>
              <Select
                value={meetingType}
                onValueChange={(value) => {
                  setValue('meeting_type', value as any)
                  setValue('committee_ids', []) // Limpiar comités al cambiar tipo
                }}
              >
                <SelectTrigger id="meeting_type">
                  <SelectValue placeholder="Selecciona el tipo de reunión" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">
                    <div className="flex flex-col">
                      <span className="font-medium">{meetingTypeLabels.planning}</span>
                      <span className="text-xs text-muted-foreground">{meetingTypeDescriptions.planning}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="coordination">
                    <div className="flex flex-col">
                      <span className="font-medium">{meetingTypeLabels.coordination}</span>
                      <span className="text-xs text-muted-foreground">{meetingTypeDescriptions.coordination}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="committee">
                    <div className="flex flex-col">
                      <span className="font-medium">{meetingTypeLabels.committee}</span>
                      <span className="text-xs text-muted-foreground">{meetingTypeDescriptions.committee}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="general">
                    <div className="flex flex-col">
                      <span className="font-medium">{meetingTypeLabels.general}</span>
                      <span className="text-xs text-muted-foreground">{meetingTypeDescriptions.general}</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.meeting_type && (
                <p className="text-sm text-red-500">{errors.meeting_type.message}</p>
              )}
            </div>

            {/* Comités (si aplica) */}
            {(meetingType === 'coordination' || meetingType === 'committee') && (
              <div className="space-y-2">
                <Label>Comités *</Label>
                {loadingCommittees ? (
                  <p className="text-sm text-muted-foreground">Cargando comités...</p>
                ) : committees.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay comités disponibles en este evento.</p>
                ) : (
                  <div className="space-y-2 border rounded-lg p-4">
                    {committees.map((committee) => (
                      <div key={committee.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`committee-${committee.id}`}
                          checked={selectedCommitteeIds.includes(committee.id)}
                          onCheckedChange={(checked) => {
                            const current = selectedCommitteeIds
                            if (checked) {
                              setValue('committee_ids', [...current, committee.id])
                            } else {
                              setValue('committee_ids', current.filter(id => id !== committee.id))
                            }
                          }}
                        />
                        <Label
                          htmlFor={`committee-${committee.id}`}
                          className="flex-1 cursor-pointer font-normal"
                        >
                          {committee.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
                {errors.committee_ids && (
                  <p className="text-sm text-red-500">{errors.committee_ids.message}</p>
                )}
              </div>
            )}

            {/* Fecha y Hora */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduled_at">Fecha y Hora *</Label>
                <div className="relative">
                  <Input
                    id="scheduled_at"
                    type="datetime-local"
                    {...register('scheduled_at')}
                    min={minDateTime}
                    max={maxDateTime}
                    className="pl-10"
                  />
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                {errors.scheduled_at && (
                  <p className="text-sm text-red-500">{errors.scheduled_at.message}</p>
                )}
              </div>

              {/* Ubicación */}
              <div className="space-y-2">
                <Label htmlFor="location">Ubicación</Label>
                <div className="relative">
                  <Input
                    id="location"
                    {...register('location')}
                    placeholder="Ej: Sala 101, Auditorio Principal"
                    className="pl-10"
                  />
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            {/* Vista previa de invitados */}
            {meetingType && (
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <Label className="font-semibold">Invitados Automáticos</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  {meetingType === 'planning' && 'Se invitarán todos los líderes del evento'}
                  {meetingType === 'coordination' && selectedCommitteeIds.length > 0 && `Se invitarán los líderes de ${selectedCommitteeIds.length} comité(s) seleccionado(s)`}
                  {meetingType === 'coordination' && selectedCommitteeIds.length === 0 && 'Selecciona comités para ver los invitados'}
                  {meetingType === 'committee' && selectedCommitteeIds.length > 0 && `Se invitarán los líderes de ${selectedCommitteeIds.length} comité(s) seleccionado(s)`}
                  {meetingType === 'committee' && selectedCommitteeIds.length === 0 && 'Selecciona comités para ver los invitados'}
                  {meetingType === 'general' && 'Se invitarán todos los participantes del evento'}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : meeting ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


