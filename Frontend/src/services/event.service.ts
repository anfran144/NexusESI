import { api } from './api'

export interface Event {
  id: number
  name: string
  description: string
  start_date: string
  end_date: string
  status: 'active' | 'inactive' | 'finished'
  coordinator: {
    id: number
    name: string
    email?: string
  }
  institution: {
    id: number
    nombre: string
    identificador?: string
  }
  participants_count: number
  committees_count: number
  progress?: number
  tasks_completed?: number
  time_info?: {
    message: string
    type: 'finished' | 'inactive' | 'planning' | 'execution' | 'needs_finalization'
    days: number | null
    is_overdue: boolean
    is_urgent: boolean
  }
  can_perform_actions?: {
    can_edit_structure: boolean
    can_delete: boolean
    can_manage_committees: boolean
    can_manage_tasks: boolean
    can_manage_participants: boolean
    can_execute_tasks: boolean
    can_finalize: boolean
    can_reuse_data: boolean
  }
  status_transition_suggested?: boolean
  created_at: string
}

export interface EventFormData {
  name: string
  description: string
  start_date: string
  end_date: string
  coordinator_id: number
  institution_id: number
  status?: 'planificación' | 'en_progreso' | 'finalizado' | 'cancelado'
}

export interface EventsResponse {
  success: boolean
  data: Event[]
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export interface EventResponse {
  success: boolean
  data: Event
  message?: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export class EventService {
  private baseUrl = '/events'

  async getEvents(params?: {
    status?: string
    institution_id?: number
    my_events?: boolean
    per_page?: number
    page?: number
  }): Promise<EventsResponse> {
    const response = await api.get(this.baseUrl, { params })
    return response.data
  }

  async getEvent(id: number): Promise<EventResponse> {
    const response = await api.get(`${this.baseUrl}/${id}`)
    return response.data
  }

  async createEvent(data: EventFormData): Promise<EventResponse> {
    const response = await api.post(this.baseUrl, data)
    return response.data
  }

  async updateEvent(id: number, data: Partial<EventFormData>): Promise<EventResponse> {
    const response = await api.put(`${this.baseUrl}/${id}`, data)
    return response.data
  }

  async deleteEvent(id: number): Promise<ApiResponse<null>> {
    const response = await api.delete(`${this.baseUrl}/${id}`)
    return response.data
  }

  async getEventParticipants(id: number): Promise<ApiResponse<any[]>> {
    const response = await api.get(`${this.baseUrl}/${id}/participants`)
    return response.data
  }

  async participateInEvent(id: number): Promise<ApiResponse<any>> {
    const response = await api.post(`${this.baseUrl}/${id}/participate`)
    return response.data
  }

  async getAvailableEvents(): Promise<EventsResponse> {
    const response = await api.get(`${this.baseUrl}/available`)
    return response.data
  }

  // Métodos para Monitoreo
  async tasks(eventId: number): Promise<ApiResponse<any[]>> {
    const response = await api.get(`${this.baseUrl}/${eventId}/tasks`)
    return response.data
  }

  async getEventCommittees(eventId: number): Promise<ApiResponse<any[]>> {
    const response = await api.get('/committees', { 
      params: { event_id: eventId } 
    })
    return response.data
  }

  async getEventStatistics(eventId: number): Promise<ApiResponse<{
    total_tasks: number
    completed_tasks: number
    in_progress_tasks: number
    delayed_tasks: number
    paused_tasks: number
    overdue: number
    progress_percentage: number
    active_committees: number
    active_participants: number
    open_incidents: number
    my_tasks: number
  }>> {
    const response = await api.get(`${this.baseUrl}/${eventId}/statistics`)
    return response.data
  }

  /**
   * Exportar evento a PDF
   */
  async exportPdf(eventId: number): Promise<Blob> {
    const response = await api.get(`${this.baseUrl}/${eventId}/export/pdf`, {
      responseType: 'blob',
    })
    return response.data
  }

  /**
   * Exportar evento a Excel
   */
  async exportExcel(eventId: number): Promise<Blob> {
    const response = await api.get(`${this.baseUrl}/${eventId}/export/excel`, {
      responseType: 'blob',
    })
    return response.data
  }

  /**
   * Obtener datos del calendario del evento
   */
  async getEventCalendar(eventId: number): Promise<ApiResponse<{
    events: Array<{
      id: string
      title: string
      start: string
      end?: string
      allDay: boolean
      type: 'event' | 'task' | 'incident'
      color: string
      textColor?: string
      extendedProps: Record<string, any>
    }>
    event: {
      id: number
      name: string
      start_date: string
      end_date: string
    }
    committees: Array<{
      id: number
      name: string
    }>
  }>> {
    const response = await api.get(`${this.baseUrl}/${eventId}/calendar`)
    return response.data
  }

  /**
   * Obtener eventos finalizados similares para reutilizar datos
   */
  async getFinishedSimilarEvents(search?: string): Promise<ApiResponse<Event[]>> {
    const params = search ? { search } : {}
    const response = await api.get(`${this.baseUrl}/finished/similar`, { params })
    return response.data
  }

  /**
   * Obtener eventos que necesitan finalización
   */
  async getSuggestedFinalizations(): Promise<ApiResponse<Event[]>> {
    const response = await api.get(`${this.baseUrl}/suggested-finalizations`)
    return response.data
  }

  /**
   * Confirmar transición de estado del evento
   */
  async confirmStatusTransition(eventId: number, newStatus: 'finished' | 'inactive' | 'active'): Promise<ApiResponse<Event>> {
    const response = await api.post(`${this.baseUrl}/${eventId}/confirm-transition`, { new_status: newStatus })
    return response.data
  }

  /**
   * Obtener datos de un evento finalizado para reutilizar
   */
  async getEventDataForReuse(eventId: number): Promise<ApiResponse<{
    event: {
      name: string
      description: string
    }
    committees: Array<{
      name: string
      members: Array<{
        name: string
        email: string
      }>
    }>
    tasks: Array<{
      title: string
      description: string
      committee_name?: string
    }>
  }>> {
    const response = await api.get(`${this.baseUrl}/${eventId}/reuse-data`)
    return response.data
  }
}

export const eventService = new EventService()