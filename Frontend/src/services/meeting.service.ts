import { api } from './api'

export interface Meeting {
  id: number
  title: string
  description?: string
  scheduled_at: string
  location?: string
  meeting_type: 'planning' | 'coordination' | 'committee' | 'general'
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  qr_code?: string
  qr_url?: string
  qr_expires_at?: string
  has_qr_code: boolean
  invitation_status?: 'pending' | 'accepted' | 'declined'
  total_invited: number
  total_attended: number
  coordinator: {
    id: number
    name: string
    email: string
  }
  event: {
    id: number
    name: string
  }
}

export interface MeetingFormData {
  title: string
  description?: string
  scheduled_at: string
  location?: string
  meeting_type: 'planning' | 'coordination' | 'committee' | 'general'
  committee_ids?: number[]
}

export interface MeetingInvitation {
  id: number
  user: {
    id: number
    name: string
    email: string
  }
  committee?: {
    id: number
    name: string
  }
  status: 'pending' | 'accepted' | 'declined'
  invited_at?: string
  responded_at?: string
}

export interface MeetingAttendance {
  id: number
  user: {
    id: number
    name: string
    email: string
  }
  checked_in_at: string
  checked_in_via: 'qr' | 'manual'
  device_info?: string
  ip_address?: string
}

export interface MeetingDetail extends Meeting {
  is_qr_valid: boolean
  invitations: MeetingInvitation[]
  attendances: MeetingAttendance[]
}

export interface MeetingsResponse {
  success: boolean
  data: Meeting[]
  message?: string
}

export interface MeetingResponse {
  success: boolean
  data: Meeting | MeetingDetail
  message?: string
}

export interface MeetingAttendancesResponse {
  success: boolean
  data: {
    meeting: {
      id: number
      title: string
      scheduled_at: string
    }
    attendances: MeetingAttendance[]
    total_attended: number
    total_invited: number
  }
}

export interface QrResponse {
  success: boolean
  data: {
    qr_code: string
    qr_url: string
    qr_expires_at: string
  }
  message?: string
}

export interface CheckInResponse {
  success: boolean
  message: string
  data: {
    attendance: {
      id: number
      user: {
        id: number
        name: string
        email: string
      }
      meeting: {
        id: number
        title: string
      }
      checked_in_at: string
      checked_in_via: string
    }
  }
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export class MeetingService {
  private baseUrl = '/events'

  /**
   * Listar reuniones de un evento
   */
  async getMeetings(eventId: number): Promise<MeetingsResponse> {
    const response = await api.get(`${this.baseUrl}/${eventId}/meetings`)
    return response.data
  }

  /**
   * Obtener detalles de una reunión
   */
  async getMeeting(meetingId: number): Promise<MeetingResponse> {
    const response = await api.get(`/meetings/${meetingId}`)
    return response.data
  }

  /**
   * Crear una nueva reunión
   */
  async createMeeting(eventId: number, data: MeetingFormData): Promise<MeetingResponse> {
    const response = await api.post(`${this.baseUrl}/${eventId}/meetings`, data)
    return response.data
  }

  /**
   * Actualizar una reunión
   */
  async updateMeeting(meetingId: number, data: MeetingFormData): Promise<MeetingResponse> {
    const response = await api.put(`/meetings/${meetingId}`, data)
    return response.data
  }

  /**
   * Cancelar una reunión
   */
  async deleteMeeting(meetingId: number): Promise<ApiResponse<void>> {
    const response = await api.delete(`/meetings/${meetingId}`)
    return response.data
  }

  /**
   * Generar/Regenerar QR code
   */
  async generateQr(meetingId: number): Promise<QrResponse> {
    const response = await api.post(`/meetings/${meetingId}/generate-qr`)
    return response.data
  }

  /**
   * Obtener información del QR
   */
  async getQrImage(meetingId: number): Promise<QrResponse> {
    const response = await api.get(`/meetings/${meetingId}/qr`)
    return response.data
  }

  /**
   * Listar asistencias de una reunión
   */
  async getAttendances(meetingId: number): Promise<MeetingAttendancesResponse> {
    const response = await api.get(`/meetings/${meetingId}/attendances`)
    return response.data
  }

  /**
   * Aceptar invitación
   */
  async acceptInvitation(meetingId: number): Promise<ApiResponse<{ invitation_status: string }>> {
    const response = await api.post(`/meetings/${meetingId}/accept`)
    return response.data
  }

  /**
   * Rechazar invitación
   */
  async declineInvitation(meetingId: number): Promise<ApiResponse<{ invitation_status: string }>> {
    const response = await api.post(`/meetings/${meetingId}/decline`)
    return response.data
  }

  /**
   * Check-in vía QR (público, requiere autenticación)
   */
  async checkIn(qrToken: string, credentials?: { email: string; password: string }): Promise<CheckInResponse> {
    // Crear una instancia de axios para esta llamada pública
    const axios = (await import('axios')).default
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
    
    // Obtener token del store si está disponible
    const { useAuthStore } = await import('@/stores/auth-store')
    const token = useAuthStore.getState().accessToken
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    // Si hay token, agregarlo al header
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    // Si hay credenciales, enviarlas; si no, solo enviar el token
    const data = credentials && credentials.email && credentials.password 
      ? credentials 
      : {}
    
    const response = await axios.post(
      `${API_BASE_URL}/public/meetings/check-in/${qrToken}`, 
      data,
      { headers }
    )
    return response.data
  }

  /**
   * Validar token QR (público, sin autenticación)
   */
  async validateQrToken(qrToken: string): Promise<ApiResponse<{
    meeting: {
      id: number
      title: string
      scheduled_at: string
      location?: string
    }
    event: {
      id: number
      name: string
    }
  }>> {
    const response = await api.get(`/public/meetings/check-in/${qrToken}/validate`)
    return response.data
  }
}

export const meetingService = new MeetingService()

