import api from './api'

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
    email: string
  }
  institution: {
    id: number
    nombre: string
    identificador: string
  }
  participants_count: number
  created_at: string
  updated_at: string
}

export interface EventParticipation {
  id: number
  user_id: number
  event_id: number
  status: 'pendiente' | 'aprobado' | 'rechazado'
  created_at: string
  updated_at: string
}

export interface SeedbedLeaderDashboard {
  user: {
    id: number
    name: string
    email: string
    institution_id: number
  }
  available_events: Event[]
  active_event?: Event
  participated_events: Event[]
  has_active_event: boolean
}

class SeedbedLeaderService {
  /**
   * Obtener dashboard del líder de semillero
   */
  async getDashboard(): Promise<SeedbedLeaderDashboard> {
    const response = await api.get('/seedbed-leader/dashboard')
    return response.data.data
  }

  /**
   * Obtener eventos disponibles para participación
   */
  async getAvailableEvents(): Promise<Event[]> {
    const response = await api.get('/events/available')
    return response.data.data
  }

  /**
   * Obtener todos los eventos de la institución (para líderes de semillero)
   */
  async getInstitutionEvents(): Promise<Event[]> {
    const response = await api.get('/events')
    return response.data.data
  }

  /**
   * Obtener detalles de un evento específico
   */
  async getEventDetails(eventId: number): Promise<Event> {
    const response = await api.get(`/events/${eventId}`)
    return response.data.data
  }

  /**
   * Participar en un evento
   */
  async participateInEvent(eventId: number): Promise<EventParticipation> {
    const response = await api.post(`/events/${eventId}/participate`)
    return response.data.data
  }

  /**
   * Obtener participantes de un evento
   */
  async getEventParticipants(eventId: number): Promise<any[]> {
    const response = await api.get(`/events/${eventId}/participants`)
    return response.data.data
  }

  /**
   * Obtener tareas del usuario en un evento específico
   */
  async getMyTasks(eventId: number): Promise<any[]> {
    const response = await api.get(`/events/${eventId}/my-tasks`)
    return response.data.data
  }

  /**
   * Obtener alertas del usuario en un evento específico
   */
  async getMyAlerts(eventId: number): Promise<any[]> {
    const response = await api.get(`/events/${eventId}/alerts`)
    return response.data.data
  }

  /**
   * Obtener evento activo del líder de semillero
   */
  async getActiveEvent(): Promise<Event> {
    const response = await api.get('/seedbed-leader/active-event')
    return response.data.data
  }
}

export const seedbedLeaderService = new SeedbedLeaderService()
