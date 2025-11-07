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
  TrendingUp
} from 'lucide-react'
import { TaskProgressHistory } from './TaskProgressHistory'

interface KanbanBoardProps {
  tasks: Task[]
  committees: Committee[]
  members: Member[]
}

const statusColumns = [
  { id: 'pending', title: 'Pendientes', color: 'bg-gray-100', icon: Clock },
  { id: 'in_progress', title: 'En Progreso', color: 'bg-blue-100', icon: Clock },
  { id: 'completed', title: 'Completadas', color: 'bg-green-100', icon: CheckCircle2 },
  { id: 'paused', title: 'Pausadas', color: 'bg-yellow-100', icon: Pause },
  { id: 'overdue', title: 'Atrasadas', color: 'bg-red-100', icon: AlertTriangle }
]

export function KanbanBoard({ tasks, committees, members }: KanbanBoardProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [progressHistoryOpen, setProgressHistoryOpen] = useState(false)

  const handleViewProgress = (task: Task) => {
    setSelectedTask(task)
    setProgressHistoryOpen(true)
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
      'Pending': 'bg-gray-100 text-gray-700',
      'InProgress': 'bg-blue-100 text-blue-700',
      'Completed': 'bg-green-100 text-green-700',
      'Paused': 'bg-yellow-100 text-yellow-700',
      'Delayed': 'bg-red-100 text-red-700'
    }
    return colorMap[status as keyof typeof colorMap] || 'bg-gray-100 text-gray-700'
  }

  const getCommitteeColor = (committeeId?: number) => {
    if (!committeeId) return '#6b7280'
    const committee = committees.find(c => c.id === committeeId)
    return committee?.color || '#6b7280'
  }

  const getMemberName = (memberId: number) => {
    const member = members.find(m => m.id === memberId)
    return member?.name || 'Sin asignar'
  }

  const getMemberInitials = (memberId: number) => {
    const member = members.find(m => m.id === memberId)
    return member?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'
  }

  const groupTasksByStatus = () => {
    const grouped: { [key: string]: Task[] } = {}
    
    statusColumns.forEach(column => {
      grouped[column.id] = []
    })

    tasks.forEach(task => {
      let statusKey = 'pending'
      
      if (task.status === 'InProgress') statusKey = 'in_progress'
      else if (task.status === 'Completed') statusKey = 'completed'
      else if (task.status === 'Paused') statusKey = 'paused'
      else if (task.status === 'Delayed') statusKey = 'overdue'
      
      grouped[statusKey].push(task)
    })

    return grouped
  }

  const groupedTasks = groupTasksByStatus()

  return (
    <div className="flex gap-4 overflow-x-auto p-4">
      {statusColumns.map(column => {
        const columnTasks = groupedTasks[column.id] || []
        const Icon = column.icon

        return (
          <div key={column.id} className="flex-shrink-0 w-80">
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn('w-3 h-3 rounded-full', column.color)} />
                <h3 className="font-semibold text-sm">{column.title}</h3>
                <Badge variant="secondary" className="text-xs">
                  {columnTasks.length}
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              {columnTasks.map(task => {
                const StatusIcon = getStatusIcon(task.status)
                const committeeColor = getCommitteeColor(task.committee_id)
                const memberName = getMemberName(task.assigned_to_id || 0)
                const memberInitials = getMemberInitials(task.assigned_to_id || 0)

                return (
                  <Card key={task.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm font-medium line-clamp-2">
                          {task.title}
                        </CardTitle>
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0 ml-2"
                          style={{ backgroundColor: committeeColor }}
                        />
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {task.description}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {new Date(task.due_date).toLocaleDateString()}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-muted-foreground" />
                            <span className="text-muted-foreground">{memberName}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <Badge 
                            variant="outline" 
                            className={cn('text-xs', getStatusColor(task.status))}
                          >
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {task.status}
                          </Badge>
                          
                          <div className="flex items-center gap-1">
                            {task.progress && task.progress.length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => handleViewProgress(task)}
                              >
                                <TrendingUp className="w-3 h-3 mr-1" />
                                {task.progress.length}
                              </Button>
                            )}
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs">
                                {memberInitials}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )
      })}
      
      {/* Dialog de historial de avances */}
      <TaskProgressHistory
        task={selectedTask}
        open={progressHistoryOpen}
        onOpenChange={setProgressHistoryOpen}
      />
    </div>
  )
}
