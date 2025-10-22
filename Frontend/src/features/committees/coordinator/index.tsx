import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Users, Calendar, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CommitteeDialog } from './components/committee-dialog'

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

export function ComitesCoordinator() {
  const [committees, setCommittees] = useState<Committee[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCommittee, setSelectedCommittee] = useState<Committee | null>(null)
  const [filters, setFilters] = useState({
    search: '',
    event: 'todos'
  })

  useEffect(() => {
    fetchCommittees()
  }, [])

  const fetchCommittees = async () => {
    try {
      setLoading(true)
      // Simular llamada a la API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Datos de ejemplo
      const mockCommittees: Committee[] = [
        {
          id: 1,
          name: 'Comité Organizador',
          event: {
            id: 1,
            name: 'Encuentro Nacional de Semilleros 2024',
            status: 'planificación'
          },
          members: [
            {
              id: 1,
              user: { id: 1, name: 'Ana García', email: 'ana@example.com' },
              role: 'presidente',
              assigned_at: '2024-10-01'
            },
            {
              id: 2,
              user: { id: 2, name: 'Carlos López', email: 'carlos@example.com' },
              role: 'secretario',
              assigned_at: '2024-10-02'
            }
          ],
          members_count: 2,
          created_at: '2024-10-01'
        },
        {
          id: 2,
          name: 'Comité Académico',
          event: {
            id: 1,
            name: 'Encuentro Nacional de Semilleros 2024',
            status: 'planificación'
          },
          members: [
            {
              id: 3,
              user: { id: 3, name: 'María Rodríguez', email: 'maria@example.com' },
              role: 'coordinador',
              assigned_at: '2024-10-03'
            }
          ],
          members_count: 1,
          created_at: '2024-10-01'
        }
      ]
      
      setCommittees(mockCommittees)
    } catch (error) {
      console.error('Error fetching committees:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCommittee = () => {
    setSelectedCommittee(null)
    setDialogOpen(true)
  }

  const handleEditCommittee = (committee: Committee) => {
    setSelectedCommittee(committee)
    setDialogOpen(true)
  }

  const handleCommitteeSaved = () => {
    fetchCommittees()
    setDialogOpen(false)
  }

  const filteredCommittees = committees.filter(committee => {
    const matchesSearch = committee.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                         committee.event.name.toLowerCase().includes(filters.search.toLowerCase())
    const matchesEvent = filters.event === 'todos' || committee.event.id.toString() === filters.event
    
    return matchesSearch && matchesEvent
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestión de Comités</h2>
          <p className="text-muted-foreground">
            Administra y supervisa todos los comités de eventos
          </p>
        </div>
        <Button onClick={handleCreateCommittee}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Comité
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Filtra los comités por diferentes criterios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar comités..."
                  className="pl-8"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
            </div>
            <div className="min-w-[200px]">
              <Label htmlFor="event">Evento</Label>
              <Select value={filters.event} onValueChange={(value) => setFilters(prev => ({ ...prev, event: value }))}>
                <SelectTrigger id="event">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los eventos</SelectItem>
                  <SelectItem value="1">Encuentro Nacional de Semilleros 2024</SelectItem>
                  <SelectItem value="2">Simposio de Investigación Regional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => setFilters({ search: '', event: 'todos' })}>
                <Filter className="w-4 h-4 mr-2" />
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Comités ({filteredCommittees.length})
          </CardTitle>
          <CardDescription>
            Lista de todos los comités registrados en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCommittees.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay comités</h3>
              <p className="text-muted-foreground mb-4">
                No se encontraron comités que coincidan con los filtros aplicados.
              </p>
              <Button onClick={handleCreateCommittee}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Comité
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCommittees.map((committee) => (
                <Card key={committee.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{committee.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          {committee.event.name}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {committee.members_count} miembros
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Miembros:</span>
                        <div className="flex -space-x-2">
                          {committee.members.slice(0, 3).map((member) => (
                            <Avatar key={member.id} className="w-6 h-6 border-2 border-background">
                              <AvatarImage src={`https://avatar.vercel.sh/${member.user.email}`} />
                              <AvatarFallback className="text-xs">
                                {member.user.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {committee.members_count > 3 && (
                            <div className="w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                              +{committee.members_count - 3}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleEditCommittee(committee)}
                        >
                          Ver Detalles
                        </Button>
                        <Button size="sm" variant="outline">
                          <UserPlus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CommitteeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        committee={selectedCommittee}
        onSaved={handleCommitteeSaved}
      />
    </div>
  )
}