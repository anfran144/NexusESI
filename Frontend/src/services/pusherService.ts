import Pusher, { Channel } from 'pusher-js'
import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'
import api from './api'

// Configuración de la API base
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// Tipo para el estado de conexión
type ConnectionState = 'initializing' | 'connected' | 'disconnected' | 'failed' | 'unavailable'

/**
 * Clase singleton para manejar la conexión Pusher y notificaciones en tiempo real
 * 
 * Basado en:
 * - Backend/app/Console/Commands/TestPushNotification.php
 * - Backend/app/Services/NotificationService.php
 * - Backend/app/Http/Controllers/PusherController.php
 */
class PusherService {
  private pusher: Pusher | null = null
  private channel: Channel | null = null
  private userId: number | null = null
  private isInitializing: boolean = false
  private connectionState: ConnectionState = 'disconnected'
  private publicChannels: Map<string, Channel> = new Map()

  /**
   * Inicializar Pusher con credenciales del backend
   */
  async initialize(key: string, cluster: string): Promise<void> {
    if (this.pusher || this.isInitializing) {
      return
    }

    this.isInitializing = true

    try {
      // Crear instancia de Pusher
      this.pusher = new Pusher(key, {
        cluster,
        forceTLS: true,
        authEndpoint: `${API_BASE_URL}/pusher/auth`,
        auth: {
          headers: {
            Authorization: `Bearer ${useAuthStore.getState().accessToken}`,
          },
        },
      })

      // Manejar cambios de estado de conexión
      this.pusher.connection.bind('state_change', (states: { previous: string; current: string }) => {
        this.connectionState = states.current as ConnectionState
        
        if (import.meta.env.DEV) {
          console.log(`[Pusher] Estado de conexión: ${states.previous} -> ${states.current}`)
        }

        if (states.current === 'disconnected') {
          console.warn('[Pusher] Desconectado. Intentando reconectar...')
        } else if (states.current === 'connected') {
          console.log('✅ Pusher inicializado correctamente')
        }
      })

      // Manejar errores de conexión
      this.pusher.connection.bind('error', (error: any) => {
        console.error('[Pusher] Error de conexión:', error)
        if (import.meta.env.DEV) {
          toast.error('Error de conexión con el servidor de notificaciones')
        }
      })

      // Manejar conexión establecida
      this.pusher.connection.bind('connected', () => {
        console.log('✅ Pusher conectado')
      })

      // Exponer instancia globalmente para debugging (solo en desarrollo)
      if (import.meta.env.DEV && typeof window !== 'undefined') {
        ;(window as any).pusherService = this
      }
    } catch (error) {
      console.error('[Pusher] Error al inicializar:', error)
      throw error
    } finally {
      this.isInitializing = false
    }
  }

  /**
   * Suscribirse al canal privado del usuario
   */
  subscribeToUserChannel(userId: number): void {
    if (!this.pusher) {
      console.error('[Pusher] No se puede suscribir: Pusher no está inicializado')
      return
    }

    // Desuscribirse del canal anterior si existe
    if (this.channel && this.userId) {
      this.pusher.unsubscribe(`user-${this.userId}`)
    }

    this.userId = userId
    const channelName = `user-${userId}`

    try {
      // Suscribirse al canal privado
      this.channel = this.pusher.subscribe(channelName)

      // Manejar suscripción exitosa
      this.channel.bind('pusher:subscription_succeeded', () => {
        console.log(`✅ Suscrito al canal: ${channelName}`)
        this.bindEvents()
      })

      // Manejar error de suscripción
      this.channel.bind('pusher:subscription_error', (status: number) => {
        console.error(`[Pusher] Error al suscribirse al canal ${channelName}:`, status)
        if (import.meta.env.DEV) {
          toast.error('Error al conectar con el canal de notificaciones')
        }
      })
    } catch (error) {
      console.error('[Pusher] Error al suscribirse:', error)
      if (import.meta.env.DEV) {
        toast.error('Error al suscribirse al canal de notificaciones')
      }
    }
  }

  /**
   * Vincular eventos de notificaciones
   * 
   * Basado en los eventos del backend:
   * - NotificationService::sendAlertNotification() -> alert.created
   * - NotificationService::sendIncidentNotification() -> incident.created
   * - NotificationService::sendIncidentResolvedNotification() -> incident.resolved
   * - NotificationService::sendProgressNotification() -> progress.updated
   * - NotificationService::sendTaskUpdateNotification() -> task.updated
   * - NotificationService::sendTaskAssignmentNotification() -> task.assigned
   * - NotificationService::sendGeneralNotification() -> test.notification (y otros)
   */
  private bindEvents(): void {
    if (!this.channel) {
      console.error('[Pusher] No se pueden vincular eventos: canal no existe')
      return
    }

    // ========== ALERTAS ==========
    // Evento: alert.created
    // Payload: { notification: {...}, alert: {...} }
    this.channel.bind('alert.created', (data: any) => {
      const alert = data.alert || data
      const alertType = alert.type === 'Critical' ? 'error' : 'warning'
      
      toast[alertType](alert.message || 'Nueva alerta', {
        description: `Tarea: ${alert.task_title || 'Sin título'}`,
        duration: 5000,
      })

      this.dispatchNotificationReceived()
    })

    // ========== INCIDENCIAS ==========
    // Evento: incident.created
    // Payload: { notification: {...}, incident: {...} }
    this.channel.bind('incident.created', (data: any) => {
      const incident = data.incident || data
      
      toast.error('Nueva Incidencia Reportada', {
        description: `${incident.reported_by || 'Usuario'}: ${incident.description || 'Sin descripción'}`,
        duration: 6000,
      })

      this.dispatchNotificationReceived()
    })

    // Evento: incident.managed
    // Payload: { notification: {...}, incident: {...} }
    this.channel.bind('incident.managed', (data: any) => {
      const incident = data.incident || data
      
      toast.info('Incidencia en Gestión', {
        description: `Tu incidencia está siendo gestionada. Tarea de solución: ${incident.solution_task_title || 'En proceso'}`,
        duration: 5000,
      })

      this.dispatchNotificationReceived()
    })

    // Evento: incident.resolved
    // Payload: { notification: {...}, incident: {...} }
    this.channel.bind('incident.resolved', (data: any) => {
      const incident = data.incident || data
      
      toast.success('Incidencia Resuelta', {
        description: `La incidencia en "${incident.task_title || 'tarea'}" ha sido resuelta`,
        duration: 5000,
      })

      this.dispatchNotificationReceived()
    })

    // ========== PROGRESO ==========
    // Evento: progress.updated
    // Payload: { notification: {...}, progress: {...} }
    this.channel.bind('progress.updated', (data: any) => {
      const progress = data.progress || data
      
      toast.success('Nuevo Progreso Reportado', {
        description: `${progress.task_title || 'Tarea'}: ${progress.description || 'Sin descripción'}`,
        duration: 5000,
      })

      this.dispatchNotificationReceived()
    })

    // ========== TAREAS ==========
    // Evento: task.updated
    // Payload: { task: {...} }
    this.channel.bind('task.updated', (data: any) => {
      const task = data.task || data
      
      toast.info('Tarea Actualizada', {
        description: `${task.title || 'Tarea'} - Estado: ${task.status || 'Actualizado'}`,
        duration: 4000,
      })

      this.dispatchNotificationReceived()
    })

    // Evento: task.assigned
    // Payload: { notification: {...}, task: {...} }
    this.channel.bind('task.assigned', (data: any) => {
      const task = data.task || data
      const notification = data.notification || {}
      
      toast.success('Tarea Asignada', {
        description: notification.title || `Nueva tarea: ${task.title || 'Sin título'}`,
        duration: 5000,
      })

      this.dispatchNotificationReceived()
    })

    // ========== NOTIFICACIONES DE PRUEBA ==========
    // Evento: test.notification
    // Basado en TestPushNotification.php y PusherController::testNotification()
    // Payload: { message: string, type: 'test', timestamp: string, user_id: number }
    // El backend envía directamente estos datos sin envolver en otro objeto
    // según NotificationService::sendGeneralNotification() que llama a broadcastToUser()
    this.channel.bind('test.notification', (data: any) => {
      // El payload viene directamente del backend según TestPushNotification.php:
      // ['message' => $message, 'type' => 'test', 'timestamp' => ..., 'user_id' => ...]
      const message = data.message || '🧪 Notificación de prueba recibida!'
      const timestamp = data.timestamp ? new Date(data.timestamp).toLocaleTimeString() : ''
      
      toast.success('Notificación de Prueba', {
        description: timestamp ? `${message} (${timestamp})` : message,
        duration: 3000,
      })

      // Log en desarrollo
      if (import.meta.env.DEV) {
        console.log('[Pusher] Notificación de prueba recibida:', {
          message: data.message,
          type: data.type,
          timestamp: data.timestamp,
          user_id: data.user_id,
        })
      }

      this.dispatchNotificationReceived()
    })

    console.log('✅ Eventos de notificaciones vinculados')
  }

  /**
   * Disparar evento personalizado para refrescar listas de notificaciones
   * Esto permite que componentes como notification-dropdown y notifications-page
   * se actualicen automáticamente cuando llega una nueva notificación
   */
  private dispatchNotificationReceived(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('notification-received'))
    }
  }

  /**
   * Verificar si Pusher está conectado
   */
  isConnected(): boolean {
    return this.pusher?.connection.state === 'connected' || false
  }

  /**
   * Obtener el estado actual de la conexión
   */
  getConnectionState(): ConnectionState | string {
    if (!this.pusher) {
      return 'not_initialized'
    }
    return this.pusher.connection.state as ConnectionState
  }

  /**
   * Desconectar Pusher y limpiar recursos
   */
  disconnect(): void {
    if (this.channel && this.pusher) {
      this.channel.unbind_all()
      if (this.userId) {
        this.pusher.unsubscribe(`user-${this.userId}`)
      }
      this.channel = null
    }

    if (this.pusher) {
      this.pusher.disconnect()
      this.pusher = null
    }

    this.userId = null
    this.connectionState = 'disconnected'
    console.log('🔌 Pusher desconectado')
  }

  /**
   * Obtener la instancia de Pusher (útil para debugging)
   */
  getPusherInstance(): Pusher | null {
    return this.pusher
  }

  /**
   * Obtener el canal actual
   */
  getChannel(): Channel | null {
    return this.channel
  }

  /**
   * Suscribirse a un canal público (ej: event-{eventId})
   */
  subscribeToPublicChannel(channelName: string): Channel {
    if (!this.pusher) {
      throw new Error('Pusher no está inicializado')
    }

    // Si ya existe, retornarlo
    if (this.publicChannels.has(channelName)) {
      return this.publicChannels.get(channelName)!
    }

    // Suscribirse al canal público
    const channel = this.pusher.subscribe(channelName)
    this.publicChannels.set(channelName, channel)

    channel.bind('pusher:subscription_succeeded', () => {
      if (import.meta.env.DEV) {
        console.log(`✅ Suscrito al canal público: ${channelName}`)
      }
    })

    channel.bind('pusher:subscription_error', (status: number) => {
      console.error(`[Pusher] Error al suscribirse al canal público ${channelName}:`, status)
    })

    return channel
  }

  /**
   * Desuscribirse de un canal público
   */
  unsubscribeFromPublicChannel(channelName: string): void {
    if (!this.pusher) {
      return
    }

    if (this.publicChannels.has(channelName)) {
      this.pusher.unsubscribe(channelName)
      this.publicChannels.delete(channelName)
      
      if (import.meta.env.DEV) {
        console.log(`🔌 Desuscrito del canal público: ${channelName}`)
      }
    }
  }
}

// Instancia singleton
export const pusherService = new PusherService()

/**
 * Hook para usar notificaciones en tiempo real
 * Se debe usar en componentes de nivel superior (ej: layout)
 * 
 * Basado en la documentación VERIFICACION-PUSHER-COMPLETA.md:
 * - Obtiene usuario del store de autenticación
 * - Inicializa Pusher automáticamente cuando hay usuario
 * - Se suscribe al canal del usuario (user-{userId})
 * - Muestra toasts (Sonner) para cada tipo de notificación
 * - Cleanup automático al desmontar
 */
export function useRealtimeNotifications(): void {
  const { user, accessToken } = useAuthStore()
  const userIdRef = useRef<number | null>(null)
  const isInitializingRef = useRef<boolean>(false)

  useEffect(() => {
    // Verificar que hay usuario y token
    if (!user?.id || !accessToken) {
      // Si había un usuario conectado y ahora no hay, desconectar
      if (userIdRef.current !== null) {
        pusherService.disconnect()
        userIdRef.current = null
        isInitializingRef.current = false
      }
      return
    }

    // Si ya estamos conectados al mismo usuario, no hacer nada
    if (userIdRef.current === user.id && pusherService.isConnected()) {
      return
    }

    // Si ya estamos inicializando para este usuario, no hacer nada
    if (isInitializingRef.current && userIdRef.current === user.id) {
      return
    }

    let isMounted = true
    const currentUserId = user.id
    isInitializingRef.current = true

    const initializePusher = async () => {
      try {
        // Si ya hay una conexión pero es para otro usuario, desconectar primero
        if (userIdRef.current !== null && userIdRef.current !== currentUserId) {
          pusherService.disconnect()
          userIdRef.current = null
        }

        // Verificar si Pusher ya está inicializado y conectado para este usuario
        const connectionState = pusherService.getConnectionState()
        if (connectionState === 'connected' && userIdRef.current === currentUserId) {
          if (isMounted) {
            isInitializingRef.current = false
          }
          return
        }

        // 1. Obtener credenciales del backend (GET /api/pusher/credentials)
        // Endpoint definido en Backend/app/Http/Controllers/PusherController.php
        const response = await api.get('/pusher/credentials')
        
        if (!isMounted || currentUserId !== user.id) {
          isInitializingRef.current = false
          return
        }

        if (!response.data.success || !response.data.data) {
          console.error('[Pusher] Error al obtener credenciales:', response.data)
          isInitializingRef.current = false
          return
        }

        const { key, cluster } = response.data.data

        if (!key || !cluster) {
          console.error('[Pusher] Credenciales incompletas:', { key, cluster })
          isInitializingRef.current = false
          return
        }

        // 2. Inicializar Pusher con key y cluster (solo si no está inicializado)
        if (!pusherService.getPusherInstance()) {
          await pusherService.initialize(key, cluster)
        }

        if (!isMounted || currentUserId !== user.id) {
          isInitializingRef.current = false
          return
        }

        // 3. Suscribirse al canal del usuario (user-{userId})
        // El formato coincide con el usado en NotificationService::broadcastToUser()
        pusherService.subscribeToUserChannel(currentUserId)
        userIdRef.current = currentUserId
        isInitializingRef.current = false
      } catch (error: any) {
        isInitializingRef.current = false
        console.error('[Pusher] Error al inicializar:', error)
        
        // No mostrar toast de error en producción si es un error de red común
        if (import.meta.env.DEV) {
          toast.error('Error al conectar con el servidor de notificaciones', {
            description: error.message || 'Verifica tu conexión a internet',
          })
        }
      }
    }

    initializePusher()

    // Cleanup: NO desconectar aquí para evitar ciclos de reconexión
    // Solo marcar como no montado para evitar actualizaciones de estado
    return () => {
      isMounted = false
      // No desconectar aquí - solo se desconecta cuando cambia el usuario o se desloguea
    }
  }, [user?.id, accessToken])

  // Cleanup cuando el usuario se desloguea completamente o cambia
  useEffect(() => {
    // Si no hay usuario, desconectar
    if (!user) {
      if (userIdRef.current !== null) {
        pusherService.disconnect()
        userIdRef.current = null
        isInitializingRef.current = false
      }
      return
    }

    // Si el usuario cambió, desconectar la conexión anterior
    if (userIdRef.current !== null && userIdRef.current !== user.id) {
      pusherService.disconnect()
      userIdRef.current = null
      isInitializingRef.current = false
    }
  }, [user?.id])
}
