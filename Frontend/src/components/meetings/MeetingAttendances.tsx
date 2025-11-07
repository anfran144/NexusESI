import { useState, useEffect } from 'react'
import { meetingService, type MeetingAttendance } from '@/services/meeting.service'
import { toast } from 'sonner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, Users, Clock, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface MeetingAttendancesProps {
  meetingId: number
}

export function MeetingAttendances({ meetingId }: MeetingAttendancesProps) {
  const [attendances, setAttendances] = useState<MeetingAttendance[]>([])
  const [meetingInfo, setMeetingInfo] = useState<{
    id: number
    title: string
    scheduled_at: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [totalInvited, setTotalInvited] = useState(0)

  useEffect(() => {
    loadAttendances()
  }, [meetingId])

  const loadAttendances = async () => {
    try {
      setLoading(true)
      const response = await meetingService.getAttendances(meetingId)
      if (response.success) {
        setAttendances(response.data.attendances)
        setMeetingInfo(response.data.meeting)
        setTotalInvited(response.data.total_invited)
      }
    } catch (error: any) {
      console.error('Error loading attendances:', error)
      toast.error('Error al cargar las asistencias')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    // Crear CSV
    const headers = ['Nombre', 'Email', 'Fecha de Check-in', 'Método']
    const rows = attendances.map(attendance => [
      attendance.user.name,
      attendance.user.email,
      format(new Date(attendance.checked_in_at), "dd/MM/yyyy HH:mm", { locale: es }),
      attendance.checked_in_via === 'qr' ? 'QR' : 'Manual',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `asistencias-reunion-${meetingId}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success('Asistencias exportadas exitosamente')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando asistencias...</p>
        </div>
      </div>
    )
  }

  const attendanceRate = totalInvited > 0
    ? Math.round((attendances.length / totalInvited) * 100)
    : 0

  return (
    <div className="space-y-4">
      {/* Estadísticas */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Invitados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{totalInvited}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Asistieron</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold">{attendances.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tasa de Asistencia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{attendanceRate}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de asistencias */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Lista de Asistencias</h3>
          <p className="text-sm text-muted-foreground">
            {attendances.length} de {totalInvited} participantes asistieron
          </p>
        </div>
        {attendances.length > 0 && (
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        )}
      </div>

      {attendances.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay asistencias registradas</h3>
            <p className="text-muted-foreground text-center">
              Aún no se han registrado asistencias para esta reunión.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Fecha de Check-in</TableHead>
                <TableHead>Método</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendances.map((attendance) => (
                <TableRow key={attendance.id}>
                  <TableCell className="font-medium">{attendance.user.name}</TableCell>
                  <TableCell>{attendance.user.email}</TableCell>
                  <TableCell>
                    {format(new Date(attendance.checked_in_at), "dd/MM/yyyy HH:mm", { locale: es })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={attendance.checked_in_via === 'qr' ? 'default' : 'secondary'}>
                      {attendance.checked_in_via === 'qr' ? 'QR' : 'Manual'}
                    </Badge>
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


