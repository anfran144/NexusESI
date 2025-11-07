import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { meetingService } from '@/services/meeting.service'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, AlertCircle, Loader2, Calendar, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export const Route = createFileRoute('/meetings/check-in/$qrToken')({
  component: CheckInPage,
})

function CheckInPage() {
  const params = Route.useParams()
  const qrToken = params.qrToken
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()
  
  const [validating, setValidating] = useState(true)
  const [qrValid, setQrValid] = useState(false)
  const [meetingInfo, setMeetingInfo] = useState<{
    id: number
    title: string
    scheduled_at: string
    location?: string
    event: {
      id: number
      name: string
    }
  } | null>(null)
  const [checkingIn, setCheckingIn] = useState(false)
  const [checkedIn, setCheckedIn] = useState(false)
  const [attendanceData, setAttendanceData] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  useEffect(() => {
    validateQrToken()
  }, [qrToken])

  const validateQrToken = async () => {
    try {
      setValidating(true)
      const response = await meetingService.validateQrToken(qrToken)
      if (response.success) {
        setQrValid(true)
        setMeetingInfo({
          id: response.data.meeting.id,
          title: response.data.meeting.title,
          scheduled_at: response.data.meeting.scheduled_at,
          location: response.data.meeting.location,
          event: response.data.event,
        })

        // Si el usuario ya está autenticado, intentar check-in automático
        if (isAuthenticated && user) {
          await handleCheckIn()
        }
      } else {
        setQrValid(false)
      }
    } catch (error: any) {
      console.error('Error validating QR token:', error)
      setQrValid(false)
      if (error.response?.status === 404) {
        toast.error('Código QR inválido')
      } else if (error.response?.status === 400) {
        toast.error('El código QR ha expirado')
      } else {
        toast.error('Error al validar el código QR')
      }
    } finally {
      setValidating(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')

    try {
      const { login } = useAuthStore.getState()
      const result = await login({ email, password })

      if (result.success) {
        toast.success('Inicio de sesión exitoso')
        // Hacer check-in directamente con las credenciales
        try {
          setCheckingIn(true)
          const response = await meetingService.checkIn(qrToken, { email, password })
          
          if (response.success) {
            setCheckedIn(true)
            setAttendanceData(response.data.attendance)
            toast.success('Asistencia registrada exitosamente')
          }
        } catch (checkInError: any) {
          if (checkInError.response?.status === 400 && checkInError.response?.data?.message?.includes('ya registrada')) {
            setCheckedIn(true)
            toast.info('Tu asistencia ya estaba registrada')
          } else {
            toast.error(checkInError.response?.data?.message || 'Error al registrar asistencia')
          }
        } finally {
          setCheckingIn(false)
        }
      } else {
        setLoginError(result.message || 'Credenciales incorrectas')
      }
    } catch (error: any) {
      setLoginError(error.response?.data?.message || 'Error al iniciar sesión')
    }
  }

  const handleCheckIn = async () => {
    if (!isAuthenticated || !user) {
      return
    }

    try {
      setCheckingIn(true)
      // Si está autenticado, no enviar credenciales, solo el token
      const response = await meetingService.checkIn(qrToken)

      if (response.success) {
        setCheckedIn(true)
        setAttendanceData(response.data.attendance)
        toast.success('Asistencia registrada exitosamente')
      }
    } catch (error: any) {
      // Si falla porque requiere autenticación, mostrar formulario de login
      if (error.response?.status === 401) {
        // Ya manejado por el formulario de login
      } else if (error.response?.status === 400 && error.response?.data?.message?.includes('ya registrada')) {
        setCheckedIn(true)
        toast.info('Tu asistencia ya estaba registrada')
      } else {
        toast.error(error.response?.data?.message || 'Error al registrar asistencia')
      }
    } finally {
      setCheckingIn(false)
    }
  }

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Validando código QR...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!qrValid || !meetingInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Código QR Inválido
            </CardTitle>
            <CardDescription>
              El código QR no es válido o ha expirado.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (checkedIn && attendanceData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle>¡Asistencia Registrada!</CardTitle>
            <CardDescription>
              Tu asistencia ha sido registrada exitosamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-center">
              <p className="font-semibold">{meetingInfo.title}</p>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(meetingInfo.scheduled_at), "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                  </span>
                </div>
                {meetingInfo.location && (
                  <div className="flex items-center justify-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{meetingInfo.location}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground text-center">
                Registrado el {format(new Date(attendanceData.checked_in_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Registro de Asistencia</CardTitle>
          <CardDescription>
            Ingresa tus credenciales para registrar tu asistencia
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Información de la reunión */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <p className="font-semibold">{meetingInfo.title}</p>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(new Date(meetingInfo.scheduled_at), "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                </span>
              </div>
              {meetingInfo.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{meetingInfo.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Formulario de login */}
          {!isAuthenticated && (
            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={checkingIn}>
                {checkingIn ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  'Registrar Asistencia'
                )}
              </Button>
            </form>
          )}

          {/* Si está autenticado pero aún no se registró asistencia */}
          {isAuthenticated && !checkedIn && (
            <Button
              onClick={handleCheckIn}
              className="w-full"
              disabled={checkingIn}
            >
              {checkingIn ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Registrar Mi Asistencia'
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


