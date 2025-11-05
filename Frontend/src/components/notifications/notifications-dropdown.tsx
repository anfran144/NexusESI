/**
 * Componente de dropdown de notificaciones para el header
 * Integrado con los endpoints existentes del backend
 */

import { useState, useEffect, useCallback } from 'react'
import { Bell, Check, CheckCheck, X, AlertTriangle, Info, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { api } from '@/services/api'

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

interface NotificationsDropdownProps {
  className?: string
}

export function NotificationsDropdown({ className }: NotificationsDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [markAllDialogOpen, setMarkAllDialogOpen] = useState(false)

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
  const markAsRead = useCallback(async (notificationId: number) => {
    try {
      await api.put(`/notifications/${notificationId}/read`)
      setNotifications(prev => prev.map(notification => 
        notification.id === notificationId ? { ...notification, is_read: true } : notification
      ))
      toast.success('Notificación marcada como leída')
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
      setMarkAllDialogOpen(false)
      toast.success('Todas las notificaciones marcadas como leídas')
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

  // Configuración de iconos por tipo
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

  // Configuración de colores por tipo
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'alert':
        return 'border-orange-200 bg-orange-50'
      case 'incident':
        return 'border-red-200 bg-red-50'
      case 'progress':
        return 'border-green-200 bg-green-50'
      case 'task_update':
        return 'border-blue-200 bg-blue-50'
      default:
        return 'border-blue-200 bg-blue-50'
    }
  }

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Hace unos minutos'
    if (diffInHours < 24) return `Hace ${diffInHours}h`
    if (diffInHours < 48) return 'Ayer'
    return date.toLocaleDateString('es-ES')
  }

  const unreadCount = notifications.filter(notification => !notification.is_read).length

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className={`relative ${className}`}>
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-80">
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <h4 className="font-semibold">Notificaciones</h4>
              <p className="text-sm text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} no leídas` : 'Todas leídas'}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMarkAllDialogOpen(true)}
                className="h-8 px-2"
              >
                <CheckCheck className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <DropdownMenuSeparator />
          
          <ScrollArea className="h-80">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No hay notificaciones</p>
              </div>
            ) : (
              <div className="space-y-1 p-1">
                {notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={`p-3 rounded-lg border ${getNotificationColor(notification.type)} ${
                      notification.is_read ? 'opacity-60' : ''
                    }`}
                    onSelect={() => !notification.is_read && markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(notification.created_at)}
                          </span>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                          )}
                        </div>
                      </div>
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsRead(notification.id)
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            )}
          </ScrollArea>
          
          {notifications.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <div className="p-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadNotifications}
                  className="w-full"
                  disabled={loading}
                >
                  Actualizar
                </Button>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Diálogo de confirmación para marcar todas como leídas */}
      <AlertDialog open={markAllDialogOpen} onOpenChange={setMarkAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marcar todas como leídas</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres marcar todas las notificaciones como leídas?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={markAllAsRead}>
              Marcar todas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
