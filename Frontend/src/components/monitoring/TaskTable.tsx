import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Task, Member } from '@/services/taskService'
import { Committee } from '@/services/committee.service'
import { cn } from '@/lib/utils'
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Pause,
  Calendar,
  User,
  MoreHorizontal,
  Edit,
  Trash2,
  TrendingUp,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { TaskProgressHistory } from './TaskProgressHistory'

interface TaskTableProps {
  tasks: Task[]
  committees: Committee[]
  members: Member[]
}

export function TaskTable({ tasks, committees, members }: TaskTableProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [progressHistoryOpen, setProgressHistoryOpen] = useState(false)
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set())

  const handleViewProgress = (task: Task) => {
    setSelectedTask(task)
    setProgressHistoryOpen(true)
  }

  const toggleTaskExpansion = (taskId: number) => {
    const newExpanded = new Set(expandedTasks)
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId)
    } else {
      newExpanded.add(taskId)
    }
    setExpandedTasks(newExpanded)
  }

  const getStatusIcon = (status: string) => {
    const statusMap = {
      'Pending': Clock,
      'InProgress': Clock,
      'Completed': CheckCircle2,
      'Paused': Pause,
      'Delayed': AlertTriangle
    }
    return statusMap[status as keyof typeof statusMap] || Clock
  }

  const getStatusColor = (status: string) => {
    const colorMap = {
      'Pending': 'bg-gray-100 text-gray-700 border-gray-200',
      'InProgress': 'bg-blue-100 text-blue-700 border-blue-200',
      'Completed': 'bg-green-100 text-green-700 border-green-200',
      'Paused': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Delayed': 'bg-red-100 text-red-700 border-red-200'
    }
    return colorMap[status as keyof typeof colorMap] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  const getCommitteeColor = (committeeId?: number) => {
    if (!committeeId) return '#6b7280'
    const committee = committees.find(c => c.id === committeeId)
    return committee?.color || '#6b7280'
  }

  const getCommitteeName = (committeeId?: number) => {
    if (!committeeId) return 'Sin comité'
    const committee = committees.find(c => c.id === committeeId)
    return committee?.name || 'Sin comité'
  }

  const getMemberName = (memberId: number) => {
    const member = members.find(m => m.id === memberId)
    return member?.name || 'Sin asignar'
  }

  const getMemberInitials = (memberId: number) => {
    const member = members.find(m => m.id === memberId)
    return member?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'
  }

  const isOverdue = (task: Task) => {
    return new Date(task.due_date) < new Date() && task.status !== 'Completed'
  }

  const getRiskLevelColor = (riskLevel: string) => {
    const riskMap = {
      'Low': 'bg-green-100 text-green-700',
      'Medium': 'bg-yellow-100 text-yellow-700',
      'High': 'bg-red-100 text-red-700'
    }
    return riskMap[riskLevel as keyof typeof riskMap] || 'bg-gray-100 text-gray-700'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Lista Detallada de Tareas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-medium text-sm text-muted-foreground">Tarea</th>
                <th className="text-left p-3 font-medium text-sm text-muted-foreground">Comité</th>
                <th className="text-left p-3 font-medium text-sm text-muted-foreground">Asignado</th>
                <th className="text-left p-3 font-medium text-sm text-muted-foreground">Estado</th>
                <th className="text-left p-3 font-medium text-sm text-muted-foreground">Prioridad</th>
                <th className="text-left p-3 font-medium text-sm text-muted-foreground">Fecha Límite</th>
                <th className="text-left p-3 font-medium text-sm text-muted-foreground">Progreso</th>
                <th className="text-right p-3 font-medium text-sm text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const StatusIcon = getStatusIcon(task.status)
                const committeeColor = getCommitteeColor(task.committee_id)
                const committeeName = getCommitteeName(task.committee_id)
                const memberName = getMemberName(task.assigned_to_id || 0)
                const memberInitials = getMemberInitials(task.assigned_to_id || 0)
                const overdue = isOverdue(task)

                const isExpanded = expandedTasks.has(task.id)
                const hasProgress = task.progress && task.progress.length > 0
                const hasIncidents = task.incidents && task.incidents.length > 0
                const hasDetails = hasProgress || hasIncidents || task.description.length > 100

                return (
                  <React.Fragment key={task.id}>
                    <tr className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-start gap-2">
                          {hasDetails && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 mt-0.5"
                              onClick={() => toggleTaskExpansion(task.id)}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <div className="space-y-1 flex-1">
                            <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {task.description}
                            </p>
                          </div>
                        </div>
                      </td>
                    
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: committeeColor }}
                        />
                        <span className="text-sm">{committeeName}</span>
                      </div>
                    </td>
                    
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs">
                            {memberInitials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{memberName}</span>
                      </div>
                    </td>
                    
                    <td className="p-3">
                      <Badge 
                        variant="outline" 
                        className={cn('text-xs', getStatusColor(task.status))}
                      >
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {task.status}
                      </Badge>
                    </td>
                    
                    <td className="p-3">
                      <Badge 
                        variant="outline" 
                        className={cn('text-xs', getRiskLevelColor(task.risk_level || 'Low'))}
                      >
                        {task.risk_level || 'Low'}
                      </Badge>
                    </td>
                    
                    <td className="p-3">
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span className={cn(overdue && 'text-red-600 font-medium')}>
                          {new Date(task.due_date).toLocaleDateString()}
                        </span>
                        {overdue && (
                          <AlertTriangle className="w-3 h-3 text-red-500" />
                        )}
                      </div>
                    </td>
                    
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={task.status === 'Completed' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {task.status === 'Completed' ? 'Completada' : 
                           task.status === 'InProgress' ? 'En Progreso' :
                           task.status === 'Pending' ? 'Pendiente' : task.status}
                        </Badge>
                        {task.progress && task.progress.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => handleViewProgress(task)}
                          >
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {task.progress.length} avance(s)
                          </Button>
                        )}
                      </div>
                    </td>
                    
                    <td className="p-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                    {isExpanded && hasDetails && (
                      <tr>
                        <td colSpan={8} className="p-0">
                          <Collapsible open={isExpanded}>
                            <CollapsibleContent className="px-3 pb-3">
                              <Card className="bg-muted/30">
                                <CardContent className="pt-4 space-y-4">
                                  {/* Descripción completa */}
                                  {task.description.length > 100 && (
                                    <div>
                                      <h5 className="text-xs font-semibold text-muted-foreground mb-2">Descripción Completa</h5>
                                      <p className="text-sm text-foreground">{task.description}</p>
                                    </div>
                                  )}
                                  
                                  {/* Información adicional */}
                                  <div className="grid gap-4 md:grid-cols-2">
                                    {hasProgress && (
                                      <div>
                                        <h5 className="text-xs font-semibold text-muted-foreground mb-2">Últimos Avances</h5>
                                        <div className="space-y-2">
                                          {task.progress?.slice(0, 3).map((progress) => (
                                            <div key={progress.id} className="text-xs text-muted-foreground">
                                              <div className="flex items-center gap-2">
                                                <TrendingUp className="w-3 h-3" />
                                                <span>{new Date(progress.created_at).toLocaleDateString()}</span>
                                                <span>•</span>
                                                <span>{progress.user?.name || 'Usuario'}</span>
                                              </div>
                                            </div>
                                          ))}
                                          {task.progress && task.progress.length > 3 && (
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-6 text-xs"
                                              onClick={() => handleViewProgress(task)}
                                            >
                                              Ver todos los avances ({task.progress.length})
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {hasIncidents && (
                                      <div>
                                        <h5 className="text-xs font-semibold text-muted-foreground mb-2">Incidencias</h5>
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
                                  
                                  {/* Acciones rápidas */}
                                  <div className="flex items-center gap-2 pt-2 border-t">
                                    {hasProgress && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => handleViewProgress(task)}
                                      >
                                        <TrendingUp className="w-3 h-3 mr-1" />
                                        Ver Historial Completo
                                      </Button>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            </CollapsibleContent>
                          </Collapsible>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
        
        {tasks.length === 0 && (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No hay tareas disponibles</p>
          </div>
        )}
      </CardContent>
      
      {/* Dialog de historial de avances */}
      <TaskProgressHistory
        task={selectedTask}
        open={progressHistoryOpen}
        onOpenChange={setProgressHistoryOpen}
      />
    </Card>
  )
}
