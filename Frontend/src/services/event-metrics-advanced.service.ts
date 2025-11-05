import { api } from './api'

export interface CommitteeMetricsData {
  committee_id: number
  committee_name: string
  total_tasks: number
  completed_tasks: number
  in_progress_tasks: number
  pending_tasks: number
  delayed_tasks: number
  progress_percentage: number
  active_members: number
}

export interface ProgressHistoryData {
  date: string
  completed_tasks: number
  total_tasks: number
  progress_percentage: number
}

export interface WorkloadData {
  user_id: number
  user_name: string
  total_tasks: number
  completed_tasks: number
  pending_tasks: number
  overdue_tasks: number
}

export interface AlertsMetricsData {
  total_critical: number
  total_preventive: number
  unread_critical: number
  unread_preventive: number
  total_alerts: number
}

export interface MilestoneData {
  id: string
  type: string
  title: string
  description: string
  date: string
  timestamp: string
  icon: string
  color: string
  metadata?: Record<string, any>
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

/**
 * Obtener métricas avanzadas por comité
 */
export async function getEventCommitteeMetrics(eventId: number): Promise<ApiResponse<CommitteeMetricsData[]>> {
  const response = await api.get(`/events/${eventId}/metrics/committees`)
  return response.data
}

/**
 * Obtener historial de progreso del evento
 */
export async function getEventProgressHistory(eventId: number, days: number = 30): Promise<ApiResponse<ProgressHistoryData[]>> {
  const response = await api.get(`/events/${eventId}/metrics/progress-history`, {
    params: { days }
  })
  return response.data
}

/**
 * Obtener distribución de carga de trabajo
 */
export async function getEventWorkload(eventId: number): Promise<ApiResponse<WorkloadData[]>> {
  const response = await api.get(`/events/${eventId}/metrics/workload`)
  return response.data
}

/**
 * Obtener métricas de alertas por tipo
 */
export async function getEventAlertsMetrics(eventId: number): Promise<ApiResponse<AlertsMetricsData>> {
  const response = await api.get(`/events/${eventId}/metrics/alerts`)
  return response.data
}

/**
 * Obtener timeline de hitos importantes del evento
 */
export async function getEventMilestones(eventId: number): Promise<ApiResponse<MilestoneData[]>> {
  const response = await api.get(`/events/${eventId}/metrics/milestones`)
  return response.data
}
