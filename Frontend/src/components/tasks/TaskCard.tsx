import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Task } from '@/services/taskService';
import { taskService } from '@/services/taskService';
import { 
  CalendarIcon, 
  UserIcon, 
  AlertTriangleIcon, 
  CheckCircleIcon,
  ClockIcon,
  PauseIcon,
  PlayIcon
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onUpdate?: (task: Task) => void;
  onDelete?: (taskId: number) => void;
  onAssign?: (task: Task) => void;
  onComplete?: (task: Task) => void;
  onReportProgress?: (task: Task) => void;
  showActions?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onUpdate,
  onDelete,
  onAssign,
  onComplete,
  onReportProgress,
  showActions = true
}) => {
  const isOverdue = taskService.isTaskOverdue(task);
  const daysUntilDue = taskService.getDaysUntilDue(task.due_date);
  
  const getStatusIcon = () => {
    switch (task.status) {
      case 'Completed':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'InProgress':
        return <PlayIcon className="w-4 h-4" />;
      case 'Delayed':
        return <AlertTriangleIcon className="w-4 h-4" />;
      case 'Paused':
        return <PauseIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  const getRiskIcon = () => {
    switch (task.risk_level) {
      case 'High':
        return <AlertTriangleIcon className="w-4 h-4 text-red-600" />;
      case 'Medium':
        return <AlertTriangleIcon className="w-4 h-4 text-yellow-600" />;
      case 'Low':
        return <CheckCircleIcon className="w-4 h-4 text-green-600" />;
      default:
        return null;
    }
  };

  return (
    <Card className={`hover:shadow-md transition-shadow ${isOverdue ? 'border-red-200 bg-red-50' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
              {task.title}
            </CardTitle>
            <p className="text-sm text-gray-600 line-clamp-2">
              {task.description}
            </p>
          </div>
          {showActions && (
            <CardAction>
              <div className="flex gap-2">
                {task.status !== 'Completed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onComplete?.(task)}
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onReportProgress?.(task)}
                >
                  Reportar Progreso
                </Button>
              </div>
            </CardAction>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Estado y Nivel de Riesgo */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <Badge className={taskService.getStatusColor(task.status)}>
                {task.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {getRiskIcon()}
              <Badge className={taskService.getRiskLevelColor(task.risk_level)}>
                Riesgo {task.risk_level}
              </Badge>
            </div>
          </div>

          {/* Fecha de Vencimiento */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CalendarIcon className="w-4 h-4" />
            <span>
              Vence: {taskService.formatDate(task.due_date)}
              {isOverdue && (
                <span className="text-red-600 font-medium ml-2">
                  (Vencida hace {Math.abs(daysUntilDue)} días)
                </span>
              )}
              {!isOverdue && daysUntilDue <= 3 && (
                <span className="text-yellow-600 font-medium ml-2">
                  (Vence en {daysUntilDue} días)
                </span>
              )}
            </span>
          </div>

          {/* Asignado a */}
          {task.assigned_to && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <UserIcon className="w-4 h-4" />
              <span>Asignado a: {task.assigned_to.name}</span>
            </div>
          )}

          {/* Comité */}
          {task.committee && (
            <div className="text-sm text-gray-500">
              <span className="font-medium">Comité:</span> {task.committee.name}
              {task.committee.event && (
                <span> - {task.committee.event.name}</span>
              )}
            </div>
          )}

          {/* Estadísticas */}
          <div className="flex gap-4 text-xs text-gray-500">
            {task.progress && task.progress.length > 0 && (
              <span>{task.progress.length} reporte(s) de progreso</span>
            )}
            {task.incidents && task.incidents.length > 0 && (
              <span className="text-red-600">
                {task.incidents.filter(i => i.status === 'Reported').length} incidencia(s) activa(s)
              </span>
            )}
            {task.alerts && task.alerts.length > 0 && (
              <span className="text-yellow-600">
                {task.alerts.filter(a => !a.is_read).length} alerta(s) sin leer
              </span>
            )}
          </div>

          {/* Acciones adicionales */}
          {showActions && (
            <div className="flex gap-2 pt-2 border-t">
              {task.status !== 'Completed' && !task.assigned_to && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAssign?.(task)}
                >
                  Asignar Tarea
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUpdate?.(task)}
              >
                Editar
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete?.(task.id)}
              >
                Eliminar
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
