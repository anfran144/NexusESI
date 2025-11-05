import { api } from './api'

/**
 * Servicio para gestión de comités de eventos
 */

export interface Committee {
  id: number
  name: string
  event_id: number
  event?: {
    id: number
    name: string
  }
  members_count: number
  members?: CommitteeMember[]
  created_at: string
  updated_at: string
}

export interface CommitteeMember {
  id: number
  name: string
  email: string
  assigned_at: string
}

export interface CommitteeFormData {
  name: string
  event_id: number
}

export interface AssignMemberData {
  user_id: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export class CommitteeService {
  private baseUrl = '/committees'

  /**
   * Obtener todos los comités (con filtros opcionales)
   */
  async getCommittees(params?: {
    event_id?: number
    per_page?: number
    page?: number
  }): Promise<ApiResponse<Committee[]>> {
    const response = await api.get(this.baseUrl, { params })
    return response.data
  }

  /**
   * Obtener un comité específico
   */
  async getCommittee(id: number): Promise<ApiResponse<Committee>> {
    const response = await api.get(`${this.baseUrl}/${id}`)
    return response.data
  }

  /**
   * Crear un nuevo comité
   */
  async createCommittee(data: CommitteeFormData): Promise<ApiResponse<Committee>> {
    const response = await api.post(this.baseUrl, data)
    return response.data
  }

  /**
   * Actualizar un comité existente
   */
  async updateCommittee(id: number, data: Partial<CommitteeFormData>): Promise<ApiResponse<Committee>> {
    const response = await api.put(`${this.baseUrl}/${id}`, data)
    return response.data
  }

  /**
   * Eliminar un comité
   */
  async deleteCommittee(id: number): Promise<ApiResponse<null>> {
    const response = await api.delete(`${this.baseUrl}/${id}`)
    return response.data
  }

  /**
   * Obtener miembros de un comité
   */
  async getMembers(committeeId: number): Promise<ApiResponse<CommitteeMember[]>> {
    const response = await api.get(`${this.baseUrl}/${committeeId}/members`)
    return response.data
  }

  /**
   * Asignar un usuario a un comité
   */
  async assignMember(committeeId: number, data: AssignMemberData): Promise<ApiResponse<CommitteeMember>> {
    const response = await api.post(`${this.baseUrl}/${committeeId}/assign`, data)
    return response.data
  }

  /**
   * Remover un miembro del comité
   */
  async removeMember(committeeId: number, userId: number): Promise<ApiResponse<null>> {
    const response = await api.delete(`${this.baseUrl}/${committeeId}/remove/${userId}`)
    return response.data
  }

}

// Exportar instancia única
export const committeeService = new CommitteeService()
