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
}

export const eventService = new EventService()