import React, { useState } from 'react';
import { AlertCard } from './AlertCard';
import { useAlerts } from '@/hooks/useAlerts';
import { Button } from '@/components/ui/button';
import { 
  BellIcon, 
  RefreshCwIcon,
  CheckIcon,
  AlertTriangleIcon,
  InfoIcon,
  FilterIcon
} from 'lucide-react';

interface AlertListProps {
  taskId?: number;
  showFilters?: boolean;
}

export const AlertList: React.FC<AlertListProps> = ({
  taskId,
  showFilters = true
}) => {
  const [filters, setFilters] = useState({
    type: '',
    isRead: ''
  });

  const { 
    alerts, 
    loading, 
    error, 
    fetchAlerts, 
    markAsRead, 
    markAllAsRead 
  } = useAlerts({
    taskId,
    type: filters.type || undefined,
    isRead: filters.isRead !== '' ? filters.isRead === 'true' : undefined
  });

  const handleMarkAsRead = async (alertId: number) => {
    try {
      await markAsRead(alertId);
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (window.confirm('¿Estás seguro de que quieres marcar todas las alertas como leídas?')) {
      try {
        await markAllAsRead();
      } catch (error) {
        console.error('Error marking all alerts as read:', error);
      }
    }
  };

  const getTypeStats = () => {
    const stats = {
      total: alerts.length,
      unread: alerts.filter(a => !a.is_read).length,
      critical: alerts.filter(a => a.type === 'Critical').length,
      preventive: alerts.filter(a => a.type === 'Preventive').length,
    };
    return stats;
  };

  const typeStats = getTypeStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCwIcon className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Cargando alertas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchAlerts} variant="outline">
          <RefreshCwIcon className="w-4 h-4 mr-2" />
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Alertas</h2>
          <p className="text-gray-600">
            {typeStats.total} alerta(s) en total
          </p>
        </div>
        {typeStats.unread > 0 && (
          <Button onClick={handleMarkAllAsRead} variant="outline">
            <CheckIcon className="w-4 h-4 mr-2" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <BellIcon className="w-5 h-5 text-blue-600" />
            <span className="font-medium">Total</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{typeStats.total}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <AlertTriangleIcon className="w-5 h-5 text-red-600" />
            <span className="font-medium">Críticas</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{typeStats.critical}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <InfoIcon className="w-5 h-5 text-yellow-600" />
            <span className="font-medium">Preventivas</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{typeStats.preventive}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-2">
            <CheckIcon className="w-5 h-5 text-green-600" />
            <span className="font-medium">Sin leer</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{typeStats.unread}</p>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-4">
            <FilterIcon className="w-5 h-5 text-gray-600" />
            <span className="font-medium">Filtros:</span>
            
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="border rounded-md px-3 py-1 text-sm"
            >
              <option value="">Todos los tipos</option>
              <option value="Critical">Críticas</option>
              <option value="Preventive">Preventivas</option>
            </select>
            
            <select
              value={filters.isRead}
              onChange={(e) => setFilters(prev => ({ ...prev, isRead: e.target.value }))}
              className="border rounded-md px-3 py-1 text-sm"
            >
              <option value="">Todas</option>
              <option value="false">Sin leer</option>
              <option value="true">Leídas</option>
            </select>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => setFilters({ type: '', isRead: '' })}
            >
              Limpiar
            </Button>
          </div>
        </div>
      )}

      {/* Lista de alertas */}
      {alerts.length === 0 ? (
        <div className="text-center py-8">
          <BellIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No hay alertas disponibles</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onMarkAsRead={handleMarkAsRead}
            />
          ))}
        </div>
      )}
    </div>
  );
};
