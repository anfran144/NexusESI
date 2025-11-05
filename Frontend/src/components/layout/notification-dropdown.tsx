import { useState, useEffect, useCallback } from 'react'
import { Bell, Check, CheckCheck, AlertTriangle, Info, CheckCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useNavigate } from '@tanstack/react-router'
import { api } from '@/services/api'

// Interfaz para notificaciones del backend
interface Notification {
  id: number
  title: string
  message: string
  type: 'alert' | 'progress' | 'incident' | 'task_update' | 'info'
  is_read: boolean
  task_id?: number
  incident_id?: number
  progress_id?: number
  created_at: string
  updated_at: string
}

export function NotificationDropdown() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  
  const unreadCount = notifications.filter(notification => !notification.is_read).length
  
  // Cargar notificaciones no leídas
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/notifications?is_read=false')
      if (response.data.success) {
        setNotifications(response.data.data || [])
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
      toast.error('Error al cargar notificaciones')
    } finally {
      setLoading(false)
    }
  }, [])
  
  // Marcar notificación como leída
  const markAsRead = useCallback(async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`)
      setNotifications(prev => prev.map(notification => 
        notification.id === id ? { ...notification, is_read: true } : notification
      ))
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast.error('Error al marcar notificación')
    }
  }, [])
  
  // Marcar todas las notificaciones como leídas
  const markAllAsRead = useCallback(async () => {
    try {
      await api.put('/notifications/read-all')
      setNotifications(prev => prev.map(notification => ({ ...notification, is_read: true })))
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      toast.error('Error al marcar todas las notificaciones')
    }
  }, [])
  
  // Cargar contador de notificaciones al montar el componente
  useEffect(() => {
    // Cargar notificaciones al montar para mostrar el contador
    loadNotifications()
  }, [loadNotifications])
  
  // Cargar notificaciones al abrir el dropdown (refrescar si ya están cargadas)
  useEffect(() => {
    if (open) {
      loadNotifications()
    }
  }, [open, loadNotifications])
  
  // Escuchar eventos de notificaciones en tiempo real y refrescar
  useEffect(() => {
    const handleNotificationReceived = () => {
      // Refrescar notificaciones cuando llega una nueva
      loadNotifications()
    }
    
    window.addEventListener('notification-received', handleNotificationReceived)
    
    return () => {
      window.removeEventListener('notification-received', handleNotificationReceived)
    }
  }, [loadNotifications])

  const handleMarkAsRead = async (notification: Notification) => {
    try {
      await markAsRead(notification.id)
      toast.success('Notificación marcada como leída')
    } catch (error) {
      toast.error('Error al marcar la notificación')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      toast.success('Todas las notificaciones marcadas como leídas')
    } catch (error) {
      toast.error('Error al marcar las notificaciones')
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case 'incident':
        return <X className="h-4 w-4 text-red-500" />
      case 'progress':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'task_update':
        return <Info className="h-4 w-4 text-blue-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'alert':
        return 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/20'
      case 'incident':
        return 'border-l-red-500 bg-red-50 dark:bg-red-950/20'
      case 'progress':
        return 'border-l-green-500 bg-green-50 dark:bg-green-950/20'
      case 'task_update':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20'
      default:
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Ahora'
    if (minutes < 60) return `Hace ${minutes} min`
    if (hours < 24) return `Hace ${hours} h`
    if (days < 7) return `Hace ${days} día${days > 1 ? 's' : ''}`
    return date.toLocaleDateString('es-ES')
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notificaciones</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px] p-0">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <DropdownMenuLabel className="text-base font-semibold p-0">
              Notificaciones
            </DropdownMenuLabel>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs h-7"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Marcar todas
              </Button>
            )}
          </div>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {unreadCount} {unreadCount === 1 ? 'sin leer' : 'sin leer'}
            </p>
          )}
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-12 px-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-sm font-medium text-muted-foreground">
                No hay notificaciones
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Te notificaremos cuando haya algo importante
              </p>
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border-l-4 mb-2 cursor-pointer",
                    "hover:bg-accent transition-colors",
                    !notification.is_read && "font-medium",
                    getNotificationColor(notification.type)
                  )}
                  onClick={() => !notification.is_read && handleMarkAsRead(notification)}
                >
                  <div className="mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between">
                      <p className="text-sm leading-none">
                        {notification.title}
                      </p>
                      {!notification.is_read && (
                        <span className="h-2 w-2 rounded-full bg-blue-500 ml-2 flex-shrink-0 mt-1" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{notification.task_id ? `Tarea #${notification.task_id}` : 'Sistema'}</span>
                      <span>•</span>
                      <span>{formatDate(notification.created_at)}</span>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2 border-t">
              <Button 
                variant="ghost" 
                className="w-full justify-center" 
                size="sm"
                onClick={() => {
                  setOpen(false)
                  navigate({ to: '/notificaciones' })
                }}
              >
                Ver todas las notificaciones
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
