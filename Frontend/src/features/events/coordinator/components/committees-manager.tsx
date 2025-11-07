import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FolderKanban, Plus, Edit, Trash2, Users, Grid3x3, List, Eye } from 'lucide-react'
import { committeeService, type Committee } from '@/services/committee.service'
import { CommitteeForm } from './committee-form'
import { CommitteeMembers } from './committee-members'
import { toast } from 'sonner'
import { usePermissions } from '@/hooks/usePermissions'
import { getCommitteeColor } from '@/utils/committee-colors'
import { calculateCommitteeMetrics } from '@/services/event-metrics.service'
import { api } from '@/services/api'

interface CommitteesManagerProps {
  eventId: number
}

interface CommitteeMetrics {
  committee_id: number
  total_tasks: number
  completed_tasks: number
  progress_percentage: number
}

export function CommitteesManager({ eventId }: CommitteesManagerProps) {
  const { hasPermission } = usePermissions()
  const navigate = useNavigate()
  const [committees, setCommittees] = useState<Committee[]>([])
  const [committeesMetrics, setCommitteesMetrics] = useState<Map<number, CommitteeMetrics>>(new Map())
  const [loading, setLoading] = useState(true)
  const [loadingMetrics, setLoadingMetrics] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [membersOpen, setMembersOpen] = useState(false)
  const [selectedCommittee, setSelectedCommittee] = useState<Committee | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const loadCommitteesMetrics = useCallback(async (committeesList: Committee[]) => {
    try {
      setLoadingMetrics(true)
      // Intentar obtener métricas desde el endpoint del backend
      try {
        const response = await api.get(`/events/${eventId}/metrics/committees`)
        if (response.data.success && response.data.data) {
          const metricsMap = new Map<number, CommitteeMetrics>()
          response.data.data.forEach((metric: CommitteeMetrics) => {
            metricsMap.set(metric.committee_id, metric)
          })
          setCommitteesMetrics(metricsMap)
          return
        }
      } catch (apiError) {
        console.warn('Error al obtener métricas desde API, usando cálculo local:', apiError)
      }

      // Fallback: calcular métricas localmente usando el servicio
      const metricsMap = new Map<number, CommitteeMetrics>()
      for (const committee of committeesList) {
        try {
          const metrics = await calculateCommitteeMetrics(committee.id)
          metricsMap.set(committee.id, {
            committee_id: committee.id,
            total_tasks: metrics.total_tasks,
            completed_tasks: metrics.completed_tasks,
            progress_percentage: metrics.progress
          })
        } catch (error) {
          console.error(`Error calculando métricas para comité ${committee.id}:`, error)
          // Métricas por defecto en caso de error
          metricsMap.set(committee.id, {
            committee_id: committee.id,
            total_tasks: 0,
            completed_tasks: 0,
            progress_percentage: 0
          })
        }
      }
      setCommitteesMetrics(metricsMap)
    } catch (error) {
      console.error('Error al cargar métricas de comités:', error)
    } finally {
      setLoadingMetrics(false)
    }
  }, [eventId])

  const loadCommittees = useCallback(async () => {
    try {
      setLoading(true)
      const response = await committeeService.getCommittees({ event_id: eventId })
      
      if (response.success) {
        setCommittees(response.data)
        // Cargar métricas después de cargar los comités
        loadCommitteesMetrics(response.data)
      }
    } catch (_error) {
      toast.error('Error al cargar los comités')
    } finally {
      setLoading(false)
    }
  }, [eventId, loadCommitteesMetrics])

  useEffect(() => {
    loadCommittees()
  }, [loadCommittees])

  const handleCreateCommittee = async (data: { name: string; memberIds?: number[] }) => {
    try {
      const response = await committeeService.createCommittee({
        name: data.name,
        event_id: eventId,
      })

      if (response.success && data.memberIds && data.memberIds.length > 0) {
        // Asignar miembros al comité recién creado
        const committeeId = response.data.id
        let assignedCount = 0
        const errors: string[] = []
        
        for (const userId of data.memberIds) {
          try {
            await committeeService.assignMember(committeeId, {
              user_id: userId,
              // role: 'Miembro', // Rol por defecto
            })
            assignedCount++
          } catch (error: any) {
            const errorMsg = error?.response?.data?.message || 'Error al asignar miembro'
            errors.push(errorMsg)
          }
        }
        
        if (errors.length > 0) {
          toast.warning(`Comité creado. ${assignedCount} miembros asignados exitosamente. ${errors.length} con errores.`)
        } else {
          toast.success(`Comité creado con ${assignedCount} ${assignedCount === 1 ? 'miembro' : 'miembros'}`)
        }
      } else if (response.success) {
        toast.success('Comité creado exitosamente')
      }
      
      setFormOpen(false)
      await loadCommittees()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Error al crear el comité'
      toast.error(errorMessage)
    }
  }

  const handleUpdateCommittee = async (data: { name: string; memberIds?: number[] }) => {
    if (!selectedCommittee) return

    try {
      const response = await committeeService.updateCommittee(selectedCommittee.id, {
        name: data.name,
        event_id: eventId,
      })

      if (response.success) {
        toast.success('Comité actualizado exitosamente')
        setFormOpen(false)
        setSelectedCommittee(null)
        await loadCommittees()
      }
    } catch (_error) {
      toast.error('Error al actualizar el comité')
    }
  }

  const handleDeleteCommittee = async (committeeId: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este comité?')) return

    try {
      await committeeService.deleteCommittee(committeeId)
      toast.success('Comité eliminado exitosamente')
      await loadCommittees()
    } catch (_error) {
      toast.error('Error al eliminar el comité')
    }
  }

  const openEditForm = (committee: Committee) => {
    setSelectedCommittee(committee)
    setFormOpen(true)
  }

  const openMembersDialog = (committee: Committee) => {
    setSelectedCommittee(committee)
    setMembersOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setSelectedCommittee(null)
  }

  const closeMembers = () => {
    setMembersOpen(false)
    setSelectedCommittee(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando comités...</p>
        </div>
      </div>
    )
  }

  // Obtener estadísticas reales de tareas por comité
  const getCommitteeStats = (committeeId: number) => {
    const metrics = committeesMetrics.get(committeeId)
    if (metrics) {
      return {
        totalTasks: metrics.total_tasks,
        completedTasks: metrics.completed_tasks,
        progress: metrics.progress_percentage
      }
    }
    // Valores por defecto mientras se cargan las métricas
    return {
      totalTasks: 0,
      completedTasks: 0,
      progress: 0
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5" />
              Comités del Evento
            </CardTitle>
            <div className="flex items-center gap-2">
              {committees.length > 0 && (
                <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'grid' | 'list')}>
                  <TabsList>
                    <TabsTrigger value="grid">
                      <Grid3x3 className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="list">
                      <List className="h-4 w-4" />
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
              {hasPermission('events.committees.manage') && (
                <Button onClick={() => setFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Comité
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {committees.length === 0 ? (
            <div className="text-center py-8">
              <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay comités</h3>
              <p className="text-muted-foreground mb-4">
                Aún no hay comités creados para este evento.
              </p>
              {hasPermission('events.committees.manage') && (
                <Button onClick={() => setFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Comité
                </Button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {committees.map((committee) => {
                const stats = getCommitteeStats(committee.id)
                const colors = getCommitteeColor(committee.name, committee.id)
                return (
                  <Card key={committee.id} className={`hover:shadow-md transition-shadow ${colors.card} border-2`}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span className="line-clamp-1">{committee.name}</span>
                        <Badge className={colors.badge}>
                          <Users className="h-3 w-3 mr-1" />
                          {committee.members_count}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Estadísticas de Tareas */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Tareas completadas</span>
                          <span className="font-medium text-foreground">
                            {stats.completedTasks}/{stats.totalTasks}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {stats.completedTasks}/{stats.totalTasks} tareas
                          </Badge>
                          {stats.completedTasks > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {stats.completedTasks} completada(s)
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Botones de Acción */}
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1"
                          onClick={() => navigate({ to: `/coordinator/eventos/${eventId}/comites/${committee.id}` })}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Detalles
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openMembersDialog(committee)}
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        {hasPermission('events.committees.manage') && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={colors.button}
                              onClick={() => openEditForm(committee)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={colors.button}
                              onClick={() => handleDeleteCommittee(committee.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Comité</TableHead>
                    <TableHead>Miembros</TableHead>
                    <TableHead>Tareas</TableHead>
                    <TableHead>Progreso</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {committees.map((committee) => {
                    const stats = getCommitteeStats(committee.id)
                    const colors = getCommitteeColor(committee.name, committee.id)
                    return (
                      <TableRow key={committee.id}>
                        <TableCell className="font-medium">{committee.name}</TableCell>
                        <TableCell>
                          <Badge className={colors.badge}>
                            <Users className="h-3 w-3 mr-1" />
                            {committee.members_count}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {stats.completedTasks}/{stats.totalTasks}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {stats.completedTasks}/{stats.totalTasks}
                            </Badge>
                            {stats.completedTasks > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {stats.completedTasks} completada(s)
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => navigate({ to: `/coordinator/eventos/${eventId}/comites/${committee.id}` })}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openMembersDialog(committee)}
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                            {hasPermission('events.committees.manage') && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={colors.button}
                                  onClick={() => openEditForm(committee)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={colors.button}
                                  onClick={() => handleDeleteCommittee(committee.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de formulario */}
      <Dialog open={formOpen} onOpenChange={closeForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedCommittee ? 'Editar Comité' : 'Crear Nuevo Comité'}
            </DialogTitle>
            <DialogDescription>
              {selectedCommittee ? 'Modifica los datos del comité' : 'Completa los datos para crear un nuevo comité de trabajo'}
            </DialogDescription>
          </DialogHeader>
          <CommitteeForm
            committee={selectedCommittee}
            eventId={eventId}
            onSubmit={selectedCommittee ? handleUpdateCommittee : handleCreateCommittee}
            onCancel={closeForm}
          />
        </DialogContent>
      </Dialog>

      {/* Diálogo de miembros */}
      <Dialog open={membersOpen} onOpenChange={closeMembers}>
        <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>
              Miembros del Comité: {selectedCommittee?.name}
            </DialogTitle>
            <DialogDescription>
              Gestiona los miembros asignados a este comité
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden min-h-0 py-4">
            {selectedCommittee && (
              <CommitteeMembers committeeId={selectedCommittee.id} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
