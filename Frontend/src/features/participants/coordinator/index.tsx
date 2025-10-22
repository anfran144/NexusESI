import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Search, Plus, Filter, Users, Calendar, MapPin } from 'lucide-react'
import { ParticipantDialog } from './components/participant-dialog'

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

export function ParticipantesCoordinator() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [eventFilter, setEventFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null)

  // Mock data
  useEffect(() => {
    const mockParticipants: Participant[] = [
      {
        id: 1,
        event: { id: 1, name: 'Congreso Nacional de Ingeniería', status: 'activo' },
        user: { 
          id: 1, 
          name: 'Ana García', 
          email: 'ana.garcia@universidad.edu',
          institution: 'Universidad Nacional'
        },
        registration_date: '2024-01-15',
        status: 'confirmado',
        attendance_confirmed: true,
        notes: 'Ponente principal'
      },
      {
        id: 2,
        event: { id: 1, name: 'Congreso Nacional de Ingeniería', status: 'activo' },
        user: { 
          id: 2, 
          name: 'Carlos López', 
          email: 'carlos.lopez@empresa.com',
          institution: 'TechCorp'
        },
        registration_date: '2024-01-20',
        status: 'registrado',
        attendance_confirmed: false
      },
      {
        id: 3,
        event: { id: 2, name: 'Seminario de Tecnología', status: 'planificación' },
        user: { 
          id: 3, 
          name: 'María Rodríguez', 
          email: 'maria.rodriguez@instituto.org',
          institution: 'Instituto Tecnológico'
        },
        registration_date: '2024-02-01',
        status: 'registrado',
        attendance_confirmed: false
      }
    ]

    setTimeout(() => {
      setParticipants(mockParticipants)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = participant.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         participant.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         participant.event.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || participant.status === statusFilter
    const matchesEvent = eventFilter === 'all' || participant.event.id.toString() === eventFilter

    return matchesSearch && matchesStatus && matchesEvent
  })

  const handleCreateParticipant = () => {
    setSelectedParticipant(null)
    setDialogOpen(true)
  }

  const handleEditParticipant = (participant: Participant) => {
    setSelectedParticipant(participant)
    setDialogOpen(true)
  }

  const handleParticipantSaved = () => {
    setDialogOpen(false)
    // Aquí recargarías los datos
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      'registrado': 'secondary',
      'confirmado': 'default',
      'cancelado': 'destructive'
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getEventStatusBadge = (status: string) => {
    const variants = {
      'planificación': 'outline',
      'activo': 'default',
      'finalizado': 'secondary',
      'cancelado': 'destructive'
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando participantes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Participantes</h1>
          <p className="text-muted-foreground">
            Administra los participantes registrados en los eventos
          </p>
        </div>
        <Button onClick={handleCreateParticipant}>
          <Plus className="mr-2 h-4 w-4" />
          Registrar Participante
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Participantes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{participants.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {participants.filter(p => p.status === 'confirmado').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registrados</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {participants.filter(p => p.status === 'registrado').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asistencia Confirmada</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {participants.filter(p => p.attendance_confirmed).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, email o evento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="registrado">Registrado</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los eventos</SelectItem>
                <SelectItem value="1">Congreso Nacional de Ingeniería</SelectItem>
                <SelectItem value="2">Seminario de Tecnología</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Participants List */}
      <div className="grid gap-4">
        {filteredParticipants.map((participant) => (
          <Card key={participant.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{participant.user.name}</h3>
                    {getStatusBadge(participant.status)}
                    {participant.attendance_confirmed && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Asistencia Confirmada
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{participant.user.email}</span>
                    {participant.user.institution && (
                      <>
                        <Separator orientation="vertical" className="h-4" />
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {participant.user.institution}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{participant.event.name}</span>
                    {getEventStatusBadge(participant.event.status)}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Registrado: {new Date(participant.registration_date).toLocaleDateString('es-ES')}
                  </div>

                  {participant.notes && (
                    <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                      <strong>Notas:</strong> {participant.notes}
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditParticipant(participant)}
                >
                  Editar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredParticipants.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No se encontraron participantes</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' || eventFilter !== 'all'
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Aún no hay participantes registrados'}
              </p>
              <Button onClick={handleCreateParticipant}>
                <Plus className="mr-2 h-4 w-4" />
                Registrar Primer Participante
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <ParticipantDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        participant={selectedParticipant}
        onSaved={handleParticipantSaved}
      />
    </div>
  )
}