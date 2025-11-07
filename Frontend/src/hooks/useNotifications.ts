import { useState, useEffect, useCallback } from 'react';
import { taskService, Notification } from '../services/taskService';
import { useAuthStore } from '@/stores/auth-store';

interface UseNotificationsParams {
  type?: string;
  isRead?: boolean;
}

export const useNotifications = (params?: UseNotificationsParams) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Obtener el usuario del store de Zustand
  const { user } = useAuthStore();

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await taskService.getNotifications(params);
      // Asegurar que data es un array
      const notificationsArray = Array.isArray(data) ? data : ((data as any)?.data || []);
      setNotifications(notificationsArray);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las notificaciones');
      setNotifications([]); // Asegurar que notifications siempre sea un array
    } finally {
      setLoading(false);
    }
  }, [params?.type, params?.isRead]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [fetchNotifications, user]);

  const markAsRead = useCallback(async (id: number): Promise<void> => {
    try {
      await taskService.markNotificationAsRead(id);
      setNotifications(prev => prev.map(notification => 
        notification.id === id ? { ...notification, is_read: true } : notification
      ));
    } catch (err) {
      throw err;
    }
  }, []);

  const markAllAsRead = useCallback(async (): Promise<void> => {
    try {
      await taskService.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(notification => ({ 
        ...notification, 
        is_read: true
      })));
    } catch (err) {
      throw err;
    }
  }, []);

  // Asegurar que notifications es un array antes de usar .filter()
  const notificationsArray = Array.isArray(notifications) ? notifications : [];
  const unreadCount = notificationsArray.filter(notification => !notification.is_read).length;
  
  // Métricas por tipo (todas, no solo no leídas)
  const byType = {
    alert: notificationsArray.filter(n => n.type === 'alert').length,
    progress: notificationsArray.filter(n => n.type === 'progress').length,
    incident: notificationsArray.filter(n => n.type === 'incident').length,
    task_update: notificationsArray.filter(n => n.type === 'task_update').length,
    info: notificationsArray.filter(n => n.type === 'info').length,
  };
  
  // Métricas no leídas por tipo
  const byTypeUnread = {
    alert: notificationsArray.filter(n => n.type === 'alert' && !n.is_read).length,
    progress: notificationsArray.filter(n => n.type === 'progress' && !n.is_read).length,
    incident: notificationsArray.filter(n => n.type === 'incident' && !n.is_read).length,
    task_update: notificationsArray.filter(n => n.type === 'task_update' && !n.is_read).length,
    info: notificationsArray.filter(n => n.type === 'info' && !n.is_read).length,
  };

  return {
    notifications,
    loading,
    error,
    unreadCount,
    byType,        // Total por tipo
    byTypeUnread,  // Solo no leídas por tipo
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
};

