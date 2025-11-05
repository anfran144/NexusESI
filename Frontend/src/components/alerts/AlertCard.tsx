import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert } from '@/services/taskService';
import { taskService } from '@/services/taskService';
import { 
  BellIcon, 
  AlertTriangleIcon, 
  InfoIcon,
  CheckIcon,
  CalendarIcon,
  UserIcon
} from 'lucide-react';

interface AlertCardProps {
  alert: Alert;
  onMarkAsRead?: (alertId: number) => void;
  showActions?: boolean;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onMarkAsRead,
  showActions = true
}) => {
  const getAlertIcon = () => {
    switch (alert.type) {
      case 'Critical':
        return <AlertTriangleIcon className="w-5 h-5 text-red-600" />;
      case 'Preventive':
        return <InfoIcon className="w-5 h-5 text-blue-600" />;
      default:
        return <BellIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getAlertTypeColor = () => {
    switch (alert.type) {
      case 'Critical':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'Preventive':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const handleMarkAsRead = () => {
    onMarkAsRead?.(alert.id);
  };

  return (
    <Card className={`${!alert.is_read ? 'border-l-4 border-l-blue-500 bg-blue-50' : 'bg-white'} transition-colors`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {getAlertIcon()}
            <div>
              <CardTitle className={`text-lg font-semibold ${!alert.is_read ? 'text-blue-900' : 'text-gray-900'}`}>
                {alert.message}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getAlertTypeColor()}>
                  {alert.type === 'Critical' ? 'Crítica' : 'Preventiva'}
                </Badge>
                {!alert.is_read && (
                  <Badge variant="secondary" className="text-blue-600 bg-blue-100">
                    Sin leer
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {showActions && !alert.is_read && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleMarkAsRead}
              className="text-blue-600 border-blue-200 hover:bg-blue-100"
            >
              <CheckIcon className="w-4 h-4 mr-1" />
              Marcar como leída
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {/* Información de la tarea asociada */}
          {alert.task && (
            <div className="bg-white p-3 rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-2">Tarea Asociada</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Título:</span> {alert.task.title}
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-gray-500" />
                  <span>Vence: {taskService.formatDate(alert.task.due_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Estado:</span>
                  <Badge className={taskService.getStatusColor(alert.task.status)}>
                    {alert.task.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Riesgo:</span>
                  <Badge className={taskService.getRiskLevelColor(alert.task.risk_level)}>
                    {alert.task.risk_level}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Información del usuario */}
          {alert.user && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <UserIcon className="w-4 h-4" />
              <span>Usuario: {alert.user.name}</span>
            </div>
          )}

          {/* Fechas */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div>
              <span className="font-medium">Creada:</span> {taskService.formatDateTime(alert.created_at)}
            </div>
            {alert.read_at && (
              <div>
                <span className="font-medium">Leída:</span> {taskService.formatDateTime(alert.read_at)}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
