import { api } from './api'

export interface DashboardStats {
  instituciones: {
    total: number
    activas: number
    inactivas: number
  }
  usuarios: {
    coordinadores: number
    lideres: number
    total: number
    por_rol: Record<string, number>
  }
  estadisticas_recientes: {
    instituciones_mes: number
    usuarios_mes: number
  }
}

export interface Institucion {
  id: number
  nombre: string
  identificador: string
  estado: 'activo' | 'inactivo' | 'pendiente'
  ciudad_id: number
  ciudad?: {
    id: number
    nombre: string
    estado?: {
      id: number
      nombre: string
      pais?: {
        id: number
        nombre: string
        codigo_iso: string
      }
    }
  }
  created_at: string
  updated_at: string
}

export interface Usuario {
  id: number
  name: string
  email: string
  email_verified_at: string | null
  rol: string
  estado: 'Activo' | 'Inactivo' | 'Pendiente'
  created_at: string
  updated_at: string
}

export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  errors?: Record<string, string[]>
}

class AdminService {
  private baseUrl = '/admin'

  /**
   * Obtener estadísticas del dashboard
   */
  async getDashboard(): Promise<ApiResponse<DashboardStats>> {
    const response = await api.get(`${this.baseUrl}/dashboard`)
    return response.data
  }

  /**
   * Obtener lista de instituciones con filtros
   */
  async getInstituciones(params?: {
    nombre?: string
    identificador?: string
    estado?: string
    page?: number
    per_page?: number
  }): Promise<ApiResponse<PaginatedResponse<Institucion>>> {
    const response = await api.get(`${this.baseUrl}/instituciones`, { params })
    return response.data
  }

  /**
   * Crear nueva institución
   */
  async crearInstitucion(data: {
    nombre: string
    identificador: string
    ciudad_id: number
    estado?: 'activo' | 'inactivo' | 'pendiente'
  }): Promise<ApiResponse<Institucion>> {
    const response = await api.post(`${this.baseUrl}/instituciones`, data)
    return response.data
  }

  /**
   * Actualizar institución
   */
  async actualizarInstitucion(
    id: number,
    data: {
      nombre?: string
      identificador?: string
      ciudad_id?: number
      estado?: 'activo' | 'inactivo' | 'pendiente'
    }
  ): Promise<ApiResponse<Institucion>> {
    const response = await api.put(`${this.baseUrl}/instituciones/${id}`, data)
    return response.data
  }

  /**
   * Obtener lista de usuarios con filtros
   */
  async getUsuarios(params?: {
    rol?: string
    estado?: string
    search?: string
    page?: number
    per_page?: number
  }): Promise<ApiResponse<PaginatedResponse<Usuario>>> {
    const response = await api.get(`${this.baseUrl}/usuarios`, { params })
    return response.data
  }

  /**
   * Cambiar rol de usuario
   */
  async cambiarRolUsuario(
    id: number,
    rol: 'admin' | 'coordinator' | 'seedbed_leader'
  ): Promise<ApiResponse<{ user_id: number; name: string; email: string; nuevo_rol: string }>> {
    const response = await api.put(`${this.baseUrl}/usuarios/${id}/rol`, { rol })
    return response.data
  }

  /**
   * Activar/Desactivar usuario
   */
  async toggleUsuario(
    id: number,
    activo: boolean
  ): Promise<ApiResponse<{ user_id: number; name: string; email: string; estado: string }>> {
    const response = await api.put(`${this.baseUrl}/usuarios/${id}/toggle`, { activo })
    return response.data
  }
}

export const adminService = new AdminService()