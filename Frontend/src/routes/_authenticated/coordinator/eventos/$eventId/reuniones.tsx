import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { PermissionGuard } from '@/components/auth/PermissionGuard'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardContent } from '@/components/layout/dashboard-content'
import { useEventContext } from '@/stores/event-context-store'
import { useState, useEffect, useCallback } from 'react'
import { eventService, type Event } from '@/services/event.service'
import { meetingService, type Meeting } from '@/services/meeting.service'
import { MeetingDialog } from '@/components/meetings/MeetingDialog'
import { MeetingQrView } from '@/components/meetings/MeetingQrView'
import { MeetingAttendances } from '@/components/meetings/MeetingAttendances'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Plus,
  Calendar,
  MapPin,
  Users,
  QrCode,
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/coordinator/eventos/$eventId/reuniones')({
  component: ReunionesPage,
})

const meetingTypeLabels = {
  planning: 'Planificación',
  coordination: 'Coordinación',
  committee: 'Comité',
  general: 'General',
}

const meetingTypeColors = {
  planning: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  coordination: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  committee: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  general: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
}

const statusLabels = {
  scheduled: 'Programada',
  in_progress: 'En Curso',
  completed: 'Completada',
  cancelled: 'Cancelada',
}

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

function ReunionesPage() {
  const params = Route.useParams()
  const eventId = params.eventId
  const { setSelectedEvent, clearSelectedEvent } = useEventContext()
  const [event, setEvent] = useState<Event | null>(null)
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [attendancesDialogOpen, setAttendancesDialogOpen] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const navigate = useNavigate()

  const loadEvent = useCallback(async () => {
    try {
      const response = await eventService.getEvent(Number(eventId))
      if (response.success) {
        setEvent(response.data)
        setSelectedEvent(response.data.id, response.data.name)
      }
    } catch {
      toast.error('Error al cargar el evento')
    }
  }, [eventId, setSelectedEvent])

  const loadMeetings = useCallback(async () => {
    try {
      setLoading(true)
      const response = await meetingService.getMeetings(Number(eventId))
      if (response.success) {
        setMeetings(response.data)
      }
    } catch (error: any) {
      console.error('Error loading meetings:', error)
      toast.error('Error al cargar las reuniones')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    loadEvent()
    loadMeetings()

    return () => {
      clearSelectedEvent()
    }
  }, [eventId, loadEvent, loadMeetings, clearSelectedEvent])

  const handleCreateMeeting = () => {
    setSelectedMeeting(null)
    setDialogOpen(true)
  }

  const handleEditMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting)
    setDialogOpen(true)
  }

  const handleViewQr = async (meeting: Meeting) => {
    try {
      // Cargar información completa del QR
      const response = await meetingService.getQrImage(meeting.id)
      if (response.success) {
        setSelectedMeeting({
          ...meeting,
          qr_code: response.data.qr_code,
          qr_url: response.data.qr_url,
          qr_expires_at: response.data.qr_expires_at,
        })
        setQrDialogOpen(true)
      }
    } catch (error: any) {
      toast.error('Error al cargar el código QR')
    }
  }

  const handleViewAttendances = async (meeting: Meeting) => {
    setSelectedMeeting(meeting)
    setAttendancesDialogOpen(true)
  }

  const handleDeleteMeeting = async (meeting: Meeting) => {
    if (!confirm(`¿Estás seguro de cancelar la reunión "${meeting.title}"?`)) {
      return
    }

    try {
      await meetingService.deleteMeeting(meeting.id)
      toast.success('Reunión cancelada exitosamente')
      loadMeetings()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cancelar la reunión')
    }
  }

  const handleSaved = () => {
    loadMeetings()
  }

  if (loading && !event) {
    return (
      <DashboardLayout showFooter={false}>
        <DashboardContent
          title="Cargando..."
          description="Gestión de reuniones del evento"
        >
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando...</p>
            </div>
          </div>
        </DashboardContent>
      </DashboardLayout>
    )
  }

  if (!event) {
    return (
      <DashboardLayout showFooter={false}>
        <DashboardContent
          title="Evento no encontrado"
          description="Gestión de reuniones del evento"
        >
          <div className="container mx-auto py-6">
            <p className="text-center text-muted-foreground">Evento no encontrado</p>
          </div>
        </DashboardContent>
      </DashboardLayout>
    )
  }

  return (
    <PermissionGuard permission="events.view">
      <DashboardLayout showFooter={true}>
        <DashboardContent
          title="Reuniones"
          description={`Gestiona las reuniones del evento "${event.name}"`}
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: `/coordinator/eventos/${eventId}` })}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Evento
              </Button>
              <Button onClick={handleCreateMeeting}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Reunión
              </Button>
            </div>

            {meetings.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay reuniones</h3>
                  <p className="text-muted-foreground mb-4 text-center">
                    Crea tu primera reunión para comenzar a gestionar las actividades del evento.
                  </p>
                  <Button onClick={handleCreateMeeting}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primera Reunión
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {meetings.map((meeting) => (
                  <Card key={meeting.id} className="relative">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">{meeting.title}</CardTitle>
                          <div className="flex flex-wrap gap-2 mb-2">
                            <Badge className={meetingTypeColors[meeting.meeting_type]}>
                              {meetingTypeLabels[meeting.meeting_type]}
                            </Badge>
                            <Badge className={statusColors[meeting.status]}>
                              {statusLabels[meeting.status]}
                            </Badge>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditMeeting(meeting)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewQr(meeting)}>
                              <QrCode className="h-4 w-4 mr-2" />
                              Ver QR
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewAttendances(meeting)}>
                              <Users className="h-4 w-4 mr-2" />
                              Ver Asistencias
                            </DropdownMenuItem>
                            {meeting.status === 'scheduled' && (
                              <DropdownMenuItem
                                onClick={() => handleDeleteMeeting(meeting)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Cancelar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {meeting.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {meeting.description}
                          </p>
                        )}
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {format(new Date(meeting.scheduled_at), "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                            </span>
                          </div>
                          {meeting.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span>{meeting.location}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {meeting.total_attended} de {meeting.total_invited} asistieron
                            </span>
                          </div>
                        </div>
                        {meeting.has_qr_code && (
                          <div className="mt-3 pt-3 border-t">
                            <Badge variant="outline" className="w-full justify-center">
                              <QrCode className="h-3 w-3 mr-1" />
                              QR Disponible
                            </Badge>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Dialog de crear/editar reunión */}
            <MeetingDialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              meeting={selectedMeeting}
              eventId={Number(eventId)}
              eventStartDate={event.start_date}
              eventEndDate={event.end_date}
              onSaved={handleSaved}
            />

            {/* Dialog de QR */}
            {selectedMeeting && (
              <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Código QR de la Reunión</DialogTitle>
                    <DialogDescription>
                      Escanea este código para registrar asistencia
                    </DialogDescription>
                  </DialogHeader>
                  <MeetingQrView meeting={selectedMeeting} />
                </DialogContent>
              </Dialog>
            )}

            {/* Dialog de asistencias */}
            {selectedMeeting && (
              <Dialog open={attendancesDialogOpen} onOpenChange={setAttendancesDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Asistencias - {selectedMeeting.title}</DialogTitle>
                    <DialogDescription>
                      Lista de participantes que asistieron a la reunión
                    </DialogDescription>
                  </DialogHeader>
                  <MeetingAttendances meetingId={selectedMeeting.id} />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </DashboardContent>
      </DashboardLayout>
    </PermissionGuard>
  )
}


