import { useState } from 'react'
import { Bell, Filter, Search, CheckCheck, AlertTriangle, Info, CheckCircle, Calendar, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useNotifications } from '@/hooks/useNotifications'
import { type Notification } from '@/services/taskService'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DashboardContent } from '@/components/layout/dashboard-content'
import { useEventContext } from '@/stores/event-context-store'
import { eventService } from '@/services/event.service'
import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useRealtimeNotifications } from '@/services/pusherService'

export function NotificationsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'alert' | 'progress' | 'incident' | 'task_update' | 'info'>('all')
  const [filterReadStatus, setFilterReadStatus] = useState<'all' | 'read' | 'unread'>('all')
  const [filterEvent, setFilterEvent] = useState<'all' | number>('all')
  const [userEvents, setUserEvents] = useState<{id: number, name: string}[]>([])
  
  const { selectedEventId } = useEventContext()
  const { user } = useAuthStore()
  
  // Determinar si el usuario es líder o coordinador
  const isLeader = user?.roles?.some(role => role.name === 'seedbed_leader') || false
  const isCoordinator = user?.roles?.some(role => role.name === 'coordinator') || false
  
  const { notifications, loading, markAsRead, markAllAsRead, unreadCount, byType, fetchNotifications } = useNotifications()
  
  // Usar notificaciones en tiempo real y refrescar cuando llegue una nueva
  useRealtimeNotifications()

  // Cargar eventos del usuario y establecer filtro inicial
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await eventService.getEvents()
        if (response.success) {
          setUserEvents(response.data.map((e: any) => ({ id: e.id, name: e.name })))
          
          // Si hay un evento seleccionado en el contexto, filtrar por ese evento
          if (selectedEventId) {
            setFilterEvent(selectedEventId)
          }
        }
      } catch (error) {
        console.error('Error loading events:', error)
      }
    }

    loadEvents()
  }, [selectedEventId])
  
  // Escuchar eventos de notificaciones en tiempo real y refrescar
  useEffect(() => {
    const handleNotificationReceived = () => {
      // Refrescar notificaciones cuando llega una nueva
      if (fetchNotifications) {
        fetchNotifications()
      }
    }
    
    window.addEventListener('notification-received', handleNotificationReceived)
    
    return () => {
      window.removeEventListener('notification-received', handleNotificationReceived)
    }
  }, [fetchNotifications])

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
        return <AlertTriangle className="h-5 w-5 text-orange-500" />
      case 'incident':
        return <X className="h-5 w-5 text-red-500" />
      case 'progress':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'task_update':
        return <Info className="h-5 w-5 text-blue-500" />
      case 'info':
        return <Bell className="h-5 w-5 text-blue-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
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
      case 'info':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20'
      default:
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-950/20'
    }
  }

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'alert':
        return isLeader ? 'Alerta de Riesgo' : 'Alerta'
      case 'incident':
        return isLeader ? 'Incidencia Resuelta' : 'Incidencia'
      case 'progress':
        return 'Progreso'
      case 'task_update':
        return isLeader ? 'Asignación' : 'Actualización'
      case 'info':
        return 'Información'
      default:
        return 'Notificación'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Hace un momento'
    if (minutes < 60) return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`
    if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`
    if (days < 7) return `Hace ${days} día${days > 1 ? 's' : ''}`
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })
  }

  // Filtrar notificaciones
  const filteredNotifications = notifications.filter(notification => {
    // Filtro por búsqueda
    const searchLower = searchQuery.toLowerCase()
    if (searchQuery && 
        !notification.title.toLowerCase().includes(searchLower) && 
        !notification.message.toLowerCase().includes(searchLower)) {
      return false
    }
    // Filtro por tipo
    if (filterType !== 'all' && notification.type !== filterType) {
      return false
    }
    // Filtro por estado de lectura
    if (filterReadStatus === 'read' && !notification.is_read) {
      return false
    }
    if (filterReadStatus === 'unread' && notification.is_read) {
      return false
    }
    // Filtro por evento
    if (filterEvent !== 'all' && notification.task) {
      const eventId = notification.task.event_id || notification.task.committee?.event?.id
      if (eventId !== filterEvent) {
        return false
      }
    }
    return true
  })

  return (
    <DashboardLayout>
      <DashboardContent
        title="Centro de Notificaciones"
        description="Gestiona todas tus notificaciones y alertas"
      >
        <div className="space-y-6">
          {/* Estadísticas */}
          <div className={`grid gap-4 ${isLeader ? 'md:grid-cols-4' : 'md:grid-cols-4'}`}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total
                </CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{notifications.length}</div>
                <p className="text-xs text-muted-foreground">
                  notificaciones en total
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Sin Leer
                </CardTitle>
                <Bell className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{unreadCount}</div>
                <p className="text-xs text-muted-foreground">
                  requieren atención
                </p>
              </CardContent>
            </Card>
            
            {/* Estadísticas diferentes según el rol */}
            {isLeader ? (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Alertas
                    </CardTitle>
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {byType.alert}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      alertas de riesgo
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Asignaciones
                    </CardTitle>
                    <Info className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {byType.task_update}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      tareas asignadas
                    </p>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Progresos
                    </CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {byType.progress}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      reportes de progreso
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Incidentes
                    </CardTitle>
                    <X className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {byType.incident}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      incidencias reportadas
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Barra de búsqueda y filtros */}
          <Card>
            <CardHeader>
              <CardTitle>Filtrar Notificaciones</CardTitle>
              <CardDescription>
                Encuentra rápidamente las notificaciones que buscas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Búsqueda */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar en notificaciones..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

                             {/* Filtros */}
               <div className="flex flex-wrap gap-2">
                 <Tabs value={filterType} onValueChange={(value) => setFilterType(value as any)}>
                   <TabsList>
                     <TabsTrigger value="all">Todas</TabsTrigger>
                     
                     {/* Filtros para Líderes */}
                     {isLeader ? (
                       <>
                         <TabsTrigger value="alert">
                           <AlertTriangle className="h-4 w-4 mr-2" />
                           Alertas de Riesgo
                         </TabsTrigger>
                         <TabsTrigger value="incident">
                           <X className="h-4 w-4 mr-2" />
                           Mis Incidentes
                         </TabsTrigger>
                         <TabsTrigger value="task_update">
                           <Info className="h-4 w-4 mr-2" />
                           Asignaciones
                         </TabsTrigger>
                         <TabsTrigger value="info">
                           <Bell className="h-4 w-4 mr-2" />
                           Información
                         </TabsTrigger>
                       </>
                     ) : (
                       /* Filtros para Coordinadores */
                       <>
                         <TabsTrigger value="alert">
                           <AlertTriangle className="h-4 w-4 mr-2" />
                           Alertas
                         </TabsTrigger>
                         <TabsTrigger value="progress">
                           <CheckCircle className="h-4 w-4 mr-2" />
                           Progresos
                         </TabsTrigger>
                         <TabsTrigger value="incident">
                           <X className="h-4 w-4 mr-2" />
                           Incidentes
                         </TabsTrigger>
                         <TabsTrigger value="task_update">
                           <Info className="h-4 w-4 mr-2" />
                           Actualizaciones
                         </TabsTrigger>
                       </>
                     )}
                   </TabsList>
                 </Tabs>

                 {/* Filtro por evento - Solo para coordinadores o si es líder con múltiples eventos */}
                 {(isCoordinator || (isLeader && userEvents.length > 1)) && userEvents.length > 0 && (
                   <Select value={filterEvent === 'all' ? 'all' : String(filterEvent)} onValueChange={(value) => setFilterEvent(value === 'all' ? 'all' : Number(value))}>
                     <SelectTrigger className="w-[200px]">
                       <Calendar className="h-4 w-4 mr-2" />
                       <SelectValue placeholder="Filtrar por evento" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="all">Todos los eventos</SelectItem>
                       {userEvents.map(event => (
                         <SelectItem key={event.id} value={String(event.id)}>
                           {event.name}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 )}

                 <div className="flex gap-2 ml-auto">
                   <Button
                     variant={filterReadStatus === 'unread' ? 'default' : 'outline'}
                     size="sm"
                     onClick={() => setFilterReadStatus('unread')}
                   >
                     Solo sin leer
                   </Button>
                   {unreadCount > 0 && (
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={handleMarkAllAsRead}
                     >
                       <CheckCheck className="h-4 w-4 mr-2" />
                       Marcar todas como leídas
                     </Button>
                   )}
                 </div>
               </div>
            </CardContent>
          </Card>

          {/* Lista de notificaciones */}
          <Card>
            <CardHeader>
              <CardTitle>
                Notificaciones ({filteredNotifications.length})
              </CardTitle>
              <CardDescription>
                {filteredNotifications.length === 0 
                  ? 'No hay notificaciones que coincidan con los filtros seleccionados'
                  : 'Click en una notificación para marcarla como leída'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                  <p className="text-sm text-muted-foreground">Cargando notificaciones...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="h-16 w-16 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay notificaciones</h3>
                  <p className="text-sm text-muted-foreground">
                    No se encontraron notificaciones con los filtros seleccionados
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2">
                    {filteredNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "flex items-start gap-4 p-4 rounded-lg border-l-4 cursor-pointer transition-all",
                          "hover:shadow-md hover:bg-accent/50",
                          getNotificationColor(notification.type),
                          !notification.is_read && "bg-accent/30"
                        )}
                        onClick={() => !notification.is_read && handleMarkAsRead(notification)}
                      >
                        <div className="mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className={cn(
                                "text-sm font-medium leading-snug mb-1",
                                !notification.is_read && "font-semibold"
                              )}>
                                {notification.title}
                              </p>
                              {notification.message && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {notification.message}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              {notification.is_read && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                              <Badge variant={
                                notification.type === 'incident' ? 'destructive' : 
                                notification.type === 'alert' ? 'destructive' :
                                notification.type === 'progress' ? 'default' :
                                'secondary'
                              }>
                                {getNotificationTypeLabel(notification.type)}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {notification.task_id && (
                              <>
                                <span>Tarea #{notification.task_id}</span>
                                <span>•</span>
                              </>
                            )}
                            <span>{formatDate(notification.created_at)}</span>
                            {!notification.is_read && (
                              <>
                                <span>•</span>
                                <span className="text-blue-600 font-medium">Sin leer</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardContent>
    </DashboardLayout>
  )
}
