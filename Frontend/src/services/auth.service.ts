import { api } from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  institution_id: number;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  institution_id: number;
  institution?: {
    id: number;
    nombre: string;
  };
  status: string;
  created_at: string;
  updated_at: string;
  avatar?: string; // Añadiendo propiedad avatar opcional
  roles: Array<{
    id: number;
    name: string;
    display_name: string;
  }>;
  permissions: string[];
  role_display_name: string;
  welcome_message: string;
  dashboard_route: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: AuthUser;
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface ForgotPasswordData {
  email: string;
}

export interface VerifyOtpData {
  email: string;
  otp: string;
}

export interface ResetPasswordData {
  email: string;
  reset_token: string;
  password: string;
  password_confirmation: string;
}

export class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post('/auth/register', data);
    return response.data;
  }

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  }

  async me(): Promise<{ success: boolean; user: AuthUser }> {
    const response = await api.get('/auth/me');
    return response.data;
  }

  async refresh(): Promise<{ success: boolean; access_token: string; token_type: string; expires_in: number }> {
    const response = await api.post('/auth/refresh');
    return response.data;
  }

  async checkAuth(): Promise<boolean> {
    try {
      await this.me();
      return true;
    } catch {
      return false;
    }
  }

  // Funcionalidad de forgot password
  async sendOtp(data: ForgotPasswordData): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/forgot-password/send-otp', data);
    return response.data;
  }

  async verifyOtp(data: VerifyOtpData): Promise<{ success: boolean; message: string; reset_token: string }> {
    const response = await api.post('/forgot-password/verify-otp', data);
    return response.data;
  }

  async resetPassword(data: ResetPasswordData): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/forgot-password/reset-password', data);
    return response.data;
  }
}

export const authService = new AuthService();