import { api } from './api'

export interface Event {
  id: number
  name: string
  description: string
  start_date: string
  end_date: string
  status: 'planificación' | 'en_progreso' | 'finalizado' | 'cancelado'
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
}

export const eventService = new EventService()