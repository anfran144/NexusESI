/**
 * Servicio para calcular métricas dinámicas de eventos
 * Basado en las decisiones del documento DatosPlaceholder.md
 */

import { useState, useEffect, useCallback } from 'react'
import { taskService } from './taskService'
import { committeeService } from './committee.service'

export interface EventMetrics {
  // Métricas principales
  progress: number // completed_tasks / max(total_tasks, 1)
  total_tasks: number // SUM tareas de todos los comités del evento
  completed_tasks: number // SUM tareas con status = Completed
  open_incidents: number // Incidencias con status = Reported
  
  // Métricas de actividad
  active_committees: number // Comités con al menos 1 tarea no Completed
  active_participants: number // Usuarios con ≥1 tarea del evento no Completed
  
  // Métricas adicionales
  my_tasks: number // Tareas asignadas al usuario actual
  committees_count: number // Total de comités del evento
  participants_count: number // Total de participantes del evento
}

export interface CommitteeMetrics {
  total_tasks: number
  completed_tasks: number
  in_progress_tasks?: number
  pending_tasks?: number
  delayed_tasks?: number
  progress: number
  active_members: number
}

/**
 * Calcula métricas dinámicas para un evento
 */
export async function calculateEventMetrics(eventId: number, userId?: number): Promise<EventMetrics> {
  try {
    // Obtener comités del evento
    const committeesResponse = await committeeService.getCommittees({ event_id: eventId })
    const committees = committeesResponse.data || []
    
    // Obtener todas las tareas del evento directamente (no a través de comités)
    const allTasks: any[] = []
    try {
      const tasksResponse = await taskService.getTasks({ event_id: eventId })
      const tasks = Array.isArray(tasksResponse) ? tasksResponse : ((tasksResponse as any).data || [])
      allTasks.push(...tasks)
    } catch (error) {
      console.warn(`Error loading tasks for event ${eventId}:`, error)
    }
    
    // Obtener incidencias del evento (si hay endpoint específico)
    let incidents: any[] = []
    try {
      const incidentsResponse = await taskService.getIncidents()
      incidents = Array.isArray(incidentsResponse) ? incidentsResponse : ((incidentsResponse as any).data || [])
    } catch (error) {
      console.warn('Error loading incidents for event:', error)
    }
    
    // Calcular métricas básicas
    const totalTasks = allTasks.length
    const completedTasks = allTasks.filter(task => task.status === 'Completed').length
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    
    // Calcular comités activos (con al menos 1 tarea no completada)
    const activeCommittees = committees.filter(committee => {
      const committeeTasks = allTasks.filter(task => task.committee_id === committee.id)
      return committeeTasks.some(task => task.status !== 'Completed')
    }).length
    
    // Calcular participantes activos (usuarios con tareas no completadas)
    const activeParticipants = new Set(
      allTasks
        .filter(task => task.status !== 'Completed' && task.assigned_to_id)
        .map(task => task.assigned_to_id)
    ).size
    
    // Calcular tareas del usuario actual
    const myTasks = userId ? allTasks.filter(task => task.assigned_to_id === userId).length : 0
    
    // Calcular incidencias abiertas
    const openIncidents = incidents.filter(incident => incident.status === 'Reported').length
    
    return {
      progress,
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      open_incidents: openIncidents,
      active_committees: activeCommittees,
      active_participants: activeParticipants,
      my_tasks: myTasks,
      committees_count: committees.length,
      participants_count: activeParticipants // Aproximación
    }
  } catch (error) {
    console.error('Error calculating event metrics:', error)
    // Retornar métricas por defecto en caso de error
    return {
      progress: 0,
      total_tasks: 0,
      completed_tasks: 0,
      open_incidents: 0,
      active_committees: 0,
      active_participants: 0,
      my_tasks: 0,
      committees_count: 0,
      participants_count: 0
    }
  }
}

/**
 * Calcula métricas para un comité específico
 */
export async function calculateCommitteeMetrics(committeeId: number): Promise<CommitteeMetrics> {
  try {
    // Obtener tareas del comité
    const tasksResponse = await taskService.getTasks({ committee_id: committeeId })
    const tasks = Array.isArray(tasksResponse) ? tasksResponse : ((tasksResponse as any).data || [])
    
    // Calcular métricas
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((task: any) => task.status === 'Completed').length
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    
    // Calcular miembros activos (usuarios con tareas no completadas)
    const activeMembers = new Set(
      tasks
        .filter((task: any) => task.status !== 'Completed' && task.assigned_to_id)
        .map((task: any) => task.assigned_to_id)
    ).size
    
    return {
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      progress,
      active_members: activeMembers
    }
  } catch (error) {
    console.error('Error calculating committee metrics:', error)
    return {
      total_tasks: 0,
      completed_tasks: 0,
      progress: 0,
      active_members: 0
    }
  }
}

/**
 * Hook para usar métricas de evento en componentes React
 */
export function useEventMetrics(eventId: number, userId?: number) {
  const [metrics, setMetrics] = useState<EventMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setLoading(true)
        setError(null)
        const calculatedMetrics = await calculateEventMetrics(eventId, userId)
        setMetrics(calculatedMetrics)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading metrics')
      } finally {
        setLoading(false)
      }
    }
    
    loadMetrics()
  }, [eventId, userId])
  
  const refreshMetrics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const calculatedMetrics = await calculateEventMetrics(eventId, userId)
      setMetrics(calculatedMetrics)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error refreshing metrics')
    } finally {
      setLoading(false)
    }
  }, [eventId, userId])
  
  return {
    metrics,
    loading,
    error,
    refreshMetrics
  }
}

/**
 * Hook para usar métricas de comité en componentes React
 */
export function useCommitteeMetrics(committeeId: number) {
  const [metrics, setMetrics] = useState<CommitteeMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setLoading(true)
        setError(null)
        const calculatedMetrics = await calculateCommitteeMetrics(committeeId)
        setMetrics(calculatedMetrics)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading committee metrics')
      } finally {
        setLoading(false)
      }
    }
    
    loadMetrics()
  }, [committeeId])
  
  const refreshMetrics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const calculatedMetrics = await calculateCommitteeMetrics(committeeId)
      setMetrics(calculatedMetrics)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error refreshing committee metrics')
    } finally {
      setLoading(false)
    }
  }, [committeeId])
  
  return {
    metrics,
    loading,
    error,
    refreshMetrics
  }
}

