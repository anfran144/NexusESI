import { api } from './api';

export interface Pais {
  id: number;
  nombre: string;
  codigo: string;
  created_at: string;
  updated_at: string;
}

export interface Estado {
  id: number;
  nombre: string;
  codigo: string;
  pais_id: number;
  created_at: string;
  updated_at: string;
  pais?: Pais;
}

export interface Ciudad {
  id: number;
  nombre: string;
  codigo: string;
  estado_id: number;
  created_at: string;
  updated_at: string;
  estado?: Estado;
}

export interface Institucion {
  id: number;
  nombre: string;
  tipo: string;
  direccion: string;
  telefono: string | null;
  email: string | null;
  website: string | null;
  ciudad_id: number;
  estado: 'activo' | 'inactivo';
  created_at: string;
  updated_at: string;
  ciudad?: Ciudad;
}

export interface LocationResponse<T> {
  success: boolean;
  data: T[];
  message?: string;
}

export interface InstitutionResponse {
  success: boolean;
  data: Institucion[];
  message?: string;
  ciudad?: {
    id: number;
    nombre: string;
    estado: {
      id: number;
      nombre: string;
      pais: {
        id: number;
        nombre: string;
      };
    };
  };
}

export class LocationService {
  async getPaises(): Promise<LocationResponse<Pais>> {
    const response = await api.get('/registration/paises');
    return response.data;
  }

  async getEstadosByPais(paisId: number): Promise<LocationResponse<Estado>> {
    const response = await api.get(`/registration/estados/${paisId}`);
    return response.data;
  }

  async getCiudadesByEstado(estadoId: number): Promise<LocationResponse<Ciudad>> {
    const response = await api.get(`/registration/ciudades/${estadoId}`);
    return response.data;
  }

  async getInstitucionesByCiudad(ciudadId: number): Promise<InstitutionResponse> {
    const response = await api.get(`/registration/instituciones/${ciudadId}`);
    return response.data;
  }
}

export const locationService = new LocationService();