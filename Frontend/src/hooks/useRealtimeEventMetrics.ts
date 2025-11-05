import { useEffect, useRef } from 'react'
import { pusherService } from '@/services/pusherService'

export interface EventMetricsData {
  progress_percentage: number
  total_tasks: number
  completed_tasks: number
  active_committees: number
  open_incidents: number
}

export interface MetricsUpdatePayload {
  event_id: number
  metrics: EventMetricsData
  timestamp: string
}

/**
 * Hook para escuchar actualizaciones de métricas de un evento en tiempo real
 * 
 * @param eventId ID del evento
 * @param onUpdate Callback que se ejecuta cuando llega una actualización
 */
export function useRealtimeEventMetrics(
  eventId: number,
  onUpdate: (metrics: EventMetricsData) => void
): void {
  const onUpdateRef = useRef(onUpdate)
  
  // Mantener el callback actualizado sin causar re-renders
  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  useEffect(() => {
    let cleanupFn: (() => void) | null = null
    let checkInterval: NodeJS.Timeout | null = null

    // Verificar que pusher está inicializado (con retry)
    const checkPusherConnection = () => {
      const pusherInstance = pusherService.getPusherInstance()
      const connectionState = pusherService.getConnectionState()
      
      if (pusherInstance && connectionState === 'connected') {
        return true
      }
      return false
    }
    
    const setupChannel = () => {
      try {
        // Suscribirse al canal público del evento
        const channelName = `event-${eventId}`
        const eventChannel = pusherService.subscribeToPublicChannel(channelName)

        // Handler para cuando llega una actualización de métricas
        const handleMetricsUpdate = (data: MetricsUpdatePayload) => {
          if (data.event_id === eventId && data.metrics) {
            onUpdateRef.current(data.metrics)
          }
        }

        // Vincular el evento metrics.updated
        eventChannel.bind('metrics.updated', handleMetricsUpdate)

        // Guardar función de cleanup
        cleanupFn = () => {
          eventChannel.unbind('metrics.updated', handleMetricsUpdate)
          pusherService.unsubscribeFromPublicChannel(channelName)
        }
      } catch (error) {
        console.error('[useRealtimeEventMetrics] Error al configurar canal:', error)
      }
    }

    // Si ya está conectado, configurar inmediatamente
    if (checkPusherConnection()) {
      setupChannel()
    } else {
      // Esperar a que Pusher esté conectado (con timeout)
      let retryCount = 0
      const maxRetries = 10
      checkInterval = setInterval(() => {
        if (checkPusherConnection() || retryCount >= maxRetries) {
          if (checkInterval) {
            clearInterval(checkInterval)
            checkInterval = null
          }
          if (checkPusherConnection()) {
            setupChannel()
          } else {
            console.warn('[useRealtimeEventMetrics] Pusher no está conectado después de múltiples intentos')
          }
        }
        retryCount++
      }, 500)
    }

    return () => {
      if (checkInterval) {
        clearInterval(checkInterval)
      }
      if (cleanupFn) {
        cleanupFn()
      }
    }
  }, [eventId])
}
