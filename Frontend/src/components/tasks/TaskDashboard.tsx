import React, { useState } from 'react';
import { TaskList } from './TaskList';
import { AlertList } from '../alerts/AlertList';
import { useAlertStatistics } from '@/hooks/useAlerts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BellIcon, 
  ClockIcon,
  TrendingUpIcon,
  UsersIcon,
  CheckSquare
} from 'lucide-react';

interface TaskDashboardProps {
  committeeId?: number;
  userId?: number;
}

export const TaskDashboard: React.FC<TaskDashboardProps> = ({
  committeeId,
  userId
}) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'alerts'>('tasks');
  
  const { statistics } = useAlertStatistics();

  const tabs = [
    {
      id: 'tasks',
      label: 'Tareas',
      icon: CheckSquare,
      count: null // Se mostrará desde TaskList
    },
    {
      id: 'alerts',
      label: 'Alertas',
      icon: BellIcon,
      count: statistics?.unread_alerts || 0
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header del Dashboard */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard de Tareas</h1>
          <p className="text-gray-600">
            Gestiona las tareas y alertas de tu comité
          </p>
        </div>
        
        {/* Estadísticas rápidas */}
        {statistics && (
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{statistics.total_alerts || 0}</p>
              <p className="text-sm text-gray-600">Total Alertas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{statistics.critical_alerts || 0}</p>
              <p className="text-sm text-gray-600">Críticas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{statistics.unread_alerts || 0}</p>
              <p className="text-sm text-gray-600">Sin leer</p>
            </div>
          </div>
        )}
      </div>

      {/* Pestañas de navegación */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'tasks' | 'alerts')}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {tab.count}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenido de las pestañas */}
      <div className="mt-6">
        {activeTab === 'tasks' && (
          <TaskList
            committeeId={committeeId}
            assignedToId={userId}
            showFilters={true}
            showCreateButton={true}
          />
        )}
        
        {activeTab === 'alerts' && (
          <AlertList
            taskId={undefined}
            showFilters={true}
          />
        )}
      </div>

      {/* Panel de estadísticas adicionales */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUpIcon className="w-5 h-5 text-blue-600" />
                Resumen de Alertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total de alertas</span>
                  <Badge variant="secondary">{statistics.total_alerts || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Sin leer</span>
                  <Badge className="text-yellow-600 bg-yellow-100">
                    {statistics.unread_alerts || 0}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Críticas</span>
                  <Badge className="text-red-600 bg-red-100">
                    {statistics.critical_alerts || 0}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Preventivas</span>
                  <Badge className="text-blue-600 bg-blue-100">
                    {statistics.preventive_alerts || 0}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-green-600" />
                Alertas Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {statistics.recent_alerts && Array.isArray(statistics.recent_alerts) && statistics.recent_alerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="flex items-center gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${
                      alert.type === 'Critical' ? 'bg-red-500' : 'bg-blue-500'
                    }`} />
                    <span className="flex-1 truncate">{alert.message}</span>
                  </div>
                ))}
                {(!statistics.recent_alerts || !Array.isArray(statistics.recent_alerts) || statistics.recent_alerts.length === 0) && (
                  <p className="text-sm text-gray-500">No hay alertas recientes</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UsersIcon className="w-5 h-5 text-purple-600" />
                Distribución por Tipo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Críticas</span>
                    <span>{statistics.alerts_by_type?.Critical || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(statistics.total_alerts || 0) > 0 ? ((statistics.alerts_by_type?.Critical || 0) / (statistics.total_alerts || 1)) * 100 : 0}%` 
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Preventivas</span>
                    <span>{statistics.alerts_by_type?.Preventive || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(statistics.total_alerts || 0) > 0 ? ((statistics.alerts_by_type?.Preventive || 0) / (statistics.total_alerts || 1)) * 100 : 0}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
