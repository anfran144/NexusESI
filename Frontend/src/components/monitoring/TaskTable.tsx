import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Task, Committee, Member } from '@/services/taskService'
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
  Trash2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TaskTableProps {
  tasks: Task[]
  committees: Committee[]
  members: Member[]
}

export function TaskTable({ tasks, committees, members }: TaskTableProps) {
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

  const getCommitteeColor = (committeeId: number) => {
    const committee = committees.find(c => c.id === committeeId)
    return committee?.color || '#6b7280'
  }

  const getCommitteeName = (committeeId: number) => {
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

                return (
                  <tr key={task.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="p-3">
                      <div className="space-y-1">
                        <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {task.description}
                        </p>
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
                          <span className="text-xs text-muted-foreground">
                            {task.progress.length} avance(s)
                          </span>
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
    </Card>
  )
}
