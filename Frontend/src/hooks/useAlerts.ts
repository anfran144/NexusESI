import { useState, useEffect, useCallback } from 'react';
import { taskService, Alert, AlertStatistics } from '../services/taskService';
import { useAuthStore } from '@/stores/auth-store';

interface UseAlertsParams {
  taskId?: number;
  type?: string;
  isRead?: boolean;
}

export const useAlerts = (params?: UseAlertsParams) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Obtener el usuario del store de Zustand
  const { user } = useAuthStore();

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await taskService.getAlerts(params);
      // Asegurar que data es un array
      const alertsArray = Array.isArray(data) ? data : (data?.data || []);
      setAlerts(alertsArray);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las alertas');
      setAlerts([]); // Asegurar que alerts siempre sea un array
    } finally {
      setLoading(false);
    }
  }, [params?.taskId, params?.type, params?.isRead]);

  useEffect(() => {
    if (user) {
      fetchAlerts();
    }
  }, [fetchAlerts, user]);

  const markAsRead = useCallback(async (id: number): Promise<void> => {
    try {
      await taskService.markAlertAsRead(id);
      setAlerts(prev => prev.map(alert => 
        alert.id === id ? { ...alert, is_read: true, read_at: new Date().toISOString() } : alert
      ));
    } catch (err) {
      throw err;
    }
  }, []);

  const markAllAsRead = useCallback(async (): Promise<void> => {
    try {
      await taskService.markAllAlertsAsRead();
      setAlerts(prev => prev.map(alert => ({ 
        ...alert, 
        is_read: true, 
        read_at: new Date().toISOString() 
      })));
    } catch (err) {
      throw err;
    }
  }, []);

  // Asegurar que alerts es un array antes de usar .filter()
  const alertsArray = Array.isArray(alerts) ? alerts : [];
  const unreadCount = alertsArray.filter(alert => !alert.is_read).length;
  const criticalCount = alertsArray.filter(alert => alert.type === 'Critical' && !alert.is_read).length;

  return {
    alerts,
    loading,
    error,
    unreadCount,
    criticalCount,
    fetchAlerts,
    markAsRead,
    markAllAsRead,
  };
};

export const useAlertStatistics = () => {
  const [statistics, setStatistics] = useState<AlertStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await taskService.getAlertStatistics();
      setStatistics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    statistics,
    loading,
    error,
    fetchStatistics,
  };
};
