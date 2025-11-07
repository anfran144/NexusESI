import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import { Label } from '@/components/ui/label'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  ChevronDown,
  ChevronRight,
  Calendar,
  User,
  MoreVertical,
  TrendingUp,
  Eye,
} from 'lucide-react'
import { Task } from '@/services/taskService'
import { Committee } from '@/services/committee.service'
import { format } from 'date-fns'

interface TaskCardProps {
  task: Task
  committees?: Committee[]
  eventId?: number
  showCheckbox?: boolean
  isSelected?: boolean
  onSelect?: (selected: boolean) => void
  showCommitteeActions?: boolean
  onAssignToCommittee?: (taskId: number, committeeId: number) => void
  onViewProgress?: (task: Task) => void
  expandedTasks?: Set<number>
  onToggleExpand?: (taskId: number) => void
}

export function TaskCard({
  task,
  committees = [],
  eventId,
  showCheckbox = false,
  isSelected = false,
  onSelect,
  showCommitteeActions = true,
  onAssignToCommittee,
  onViewProgress,
  expandedTasks = new Set(),
  onToggleExpand,
}: TaskCardProps) {
  const navigate = useNavigate()
  const isExpanded = expandedTasks.has(task.id)
  const hasProgress = task.progress && task.progress.length > 0
  const hasIncidents = task.incidents && task.incidents.length > 0
  const isOverdue = new Date(task.due_date) < new Date() && task.status !== 'Completed'
  const committee = committees.find(c => c.id === task.committee_id)

  const getStatusBadge = (status: Task['status']) => {
    const configs = {
      Pending: { label: 'Pendiente', color: 'bg-gray-100 text-gray-800', icon: Clock },
      InProgress: { label: 'En Progreso', color: 'bg-blue-100 text-blue-800', icon: Clock },
      Completed: { label: 'Completada', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      Delayed: { label: 'Retrasada', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
      Paused: { label: 'Pausada', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    }
    const config = configs[status]
    const Icon = config.icon
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const getRiskLevelBadge = (riskLevel: Task['risk_level']) => {
    const configs = {
      Low: { label: 'Bajo', color: 'bg-green-100 text-green-800' },
      Medium: { label: 'Medio', color: 'bg-yellow-100 text-yellow-800' },
      High: { label: 'Alto', color: 'bg-red-100 text-red-800' },
    }
    const config = configs[riskLevel]
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const handleToggleExpand = () => {
    if (onToggleExpand) {
      onToggleExpand(task.id)
    }
  }

  const handleViewProgress = () => {
    if (onViewProgress) {
      onViewProgress(task)
    }
  }

  return (
    <Card
      className={`hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-primary' : ''} ${isOverdue ? 'border-red-300' : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox (solo si está habilitado) */}
          {showCheckbox && onSelect && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelect(checked === true)}
              className="mt-1"
            />
          )}

          {/* Botón expandir (si hay detalles) */}
          {(hasProgress || hasIncidents || task.description.length > 100) && onToggleExpand && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 mt-0.5"
              onClick={handleToggleExpand}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* Contenido principal */}
          <div className="flex-1 space-y-2 min-w-0">
            {/* Nivel 1: Información básica siempre visible */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <h4 className="font-semibold text-base truncate">{task.title}</h4>
                  {getStatusBadge(task.status)}
                  {getRiskLevelBadge(task.risk_level)}
                  {isOverdue && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Vencida
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {task.description}
                </p>
              </div>

              {/* Acciones rápidas */}
              <div className="flex items-center gap-1">
                {hasProgress && onViewProgress && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={handleViewProgress}
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {task.progress?.length || 0}
                  </Button>
                )}
                {(showCommitteeActions || onAssignToCommittee) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {/* Solo mostrar opciones de comité si está habilitado y la tarea no tiene comité */}
                      {showCommitteeActions && !task.committee_id && committees.length > 0 && onAssignToCommittee && (
                        <>
                          <DropdownMenuLabel>Asignar a Comité</DropdownMenuLabel>
                          {committees.map((committee) => (
                            <DropdownMenuItem
                              key={committee.id}
                              onClick={() => onAssignToCommittee(task.id, committee.id)}
                            >
                              <Users className="h-4 w-4 mr-2" />
                              {committee.name}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                        </>
                      )}
                      {/* Si ya tiene comité y estamos en modo showCommitteeActions, mostrar opción de ver comité */}
                      {showCommitteeActions && task.committee_id && committee && eventId && (
                        <DropdownMenuItem
                          onClick={() => navigate({ to: `/coordinator/eventos/${eventId}/comites/${committee.id}` })}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Comité: {committee.name}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {/* Nivel 2: Información secundaria siempre visible */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Vence: {format(new Date(task.due_date), 'dd/MM/yyyy')}</span>
              </div>
              {task.committee_id && committee && (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>Comité: {committee.name}</span>
                </div>
              )}
              {!task.committee_id && showCommitteeActions && (
                <Badge variant="outline" className="text-xs">
                  Sin asignar
                </Badge>
              )}
              {task.assigned_to && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{task.assigned_to.name}</span>
                </div>
              )}
            </div>

            {/* Nivel 3: Detalles expandibles (divulgación progresiva) */}
            {isExpanded && onToggleExpand && (
              <Collapsible open={isExpanded}>
                <CollapsibleContent className="pt-4 border-t space-y-4">
                  {/* Descripción completa */}
                  {task.description.length > 100 && (
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground mb-2 block">
                        Descripción Completa
                      </Label>
                      <p className="text-sm text-foreground">{task.description}</p>
                    </div>
                  )}

                  {/* Información adicional */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Últimos avances */}
                    {hasProgress && (
                      <div>
                        <Label className="text-xs font-semibold text-muted-foreground mb-2 block">
                          Últimos Avances
                        </Label>
                        <div className="space-y-2">
                          {task.progress?.slice(0, 3).map((progress) => (
                            <div key={progress.id} className="text-xs text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-3 h-3" />
                                <span>{format(new Date(progress.created_at), 'dd/MM/yyyy')}</span>
                                <span>•</span>
                                <span>{progress.user?.name || 'Usuario'}</span>
                              </div>
                            </div>
                          ))}
                          {task.progress && task.progress.length > 3 && onViewProgress && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={handleViewProgress}
                            >
                              Ver todos los avances ({task.progress.length})
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Incidencias */}
                    {hasIncidents && (
                      <div>
                        <Label className="text-xs font-semibold text-muted-foreground mb-2 block">
                          Incidencias
                        </Label>
                        <div className="space-y-2">
                          {task.incidents?.slice(0, 3).map((incident) => (
                            <div key={incident.id} className="text-xs">
                              <Badge variant={incident.status === 'Resolved' ? 'default' : 'destructive'} className="text-xs">
                                {incident.status === 'Resolved' ? 'Resuelta' : 'Activa'}
                              </Badge>
                              <p className="text-muted-foreground mt-1 line-clamp-2">
                                {incident.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Acciones en detalles expandidos */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    {hasProgress && onViewProgress && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={handleViewProgress}
                      >
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Ver Historial Completo
                      </Button>
                    )}
                    {/* Solo mostrar opciones de asignar si está habilitado */}
                    {showCommitteeActions && !task.committee_id && committees.length > 0 && onAssignToCommittee && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-7 text-xs">
                            <Users className="w-3 h-3 mr-1" />
                            Asignar a Comité
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {committees.map((committee) => (
                            <DropdownMenuItem
                              key={committee.id}
                              onClick={() => onAssignToCommittee(task.id, committee.id)}
                            >
                              <Users className="h-4 w-4 mr-2" />
                              {committee.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
