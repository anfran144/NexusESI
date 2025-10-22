import { create } from 'zustand';
import { AuthService, type ForgotPasswordData, type VerifyOtpData, type ResetPasswordData } from '@/services/auth.service';

const authService = new AuthService();

interface ForgotPasswordState {
  isLoading: boolean;
  email: string;
  resetToken: string;
  step: 'email' | 'otp' | 'reset' | 'success';
  message: string;
  error: string;
}

interface ForgotPasswordActions {
  setLoading: (loading: boolean) => void;
  setEmail: (email: string) => void;
  setResetToken: (token: string) => void;
  setStep: (step: ForgotPasswordState['step']) => void;
  setMessage: (message: string) => void;
  setError: (error: string) => void;
  sendOtp: (data: ForgotPasswordData) => Promise<{ success: boolean; message: string }>;
  verifyOtp: (data: VerifyOtpData) => Promise<{ success: boolean; message: string }>;
  resetPassword: (data: ResetPasswordData) => Promise<{ success: boolean; message: string }>;
  reset: () => void;
}

type ForgotPasswordStore = ForgotPasswordState & ForgotPasswordActions;

export const useForgotPasswordStore = create<ForgotPasswordStore>((set) => ({
  // Estado inicial
  isLoading: false,
  email: '',
  resetToken: '',
  step: 'email',
  message: '',
  error: '',

  // Acciones
  setLoading: (loading) => set({ isLoading: loading }),
  setEmail: (email) => set({ email }),
  setResetToken: (token) => set({ resetToken: token }),
  setStep: (step) => set({ step }),
  setMessage: (message) => set({ message, error: '' }),
  setError: (error) => set({ error, message: '' }),

  sendOtp: async (data) => {
    try {
      set({ isLoading: true, error: '', message: '' });
      const response = await authService.sendOtp(data);
      
      if (response.success) {
        set({ 
          email: data.email,
          step: 'otp',
          message: response.message,
          isLoading: false 
        });
        return { success: true, message: response.message };
      }
      
      set({ error: response.message, isLoading: false });
      return { success: false, message: response.message };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al enviar OTP';
      set({ error: errorMessage, isLoading: false });
      return { success: false, message: errorMessage };
    }
  },

  verifyOtp: async (data) => {
    try {
      set({ isLoading: true, error: '', message: '' });
      const response = await authService.verifyOtp(data);
      
      if (response.success) {
        set({ 
          resetToken: response.reset_token,
          step: 'reset',
          message: response.message,
          isLoading: false 
        });
        return { success: true, message: response.message };
      }
      
      set({ error: response.message, isLoading: false });
      return { success: false, message: response.message };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al verificar OTP';
      set({ error: errorMessage, isLoading: false });
      return { success: false, message: errorMessage };
    }
  },

  resetPassword: async (data) => {
    try {
      set({ isLoading: true, error: '', message: '' });
      const response = await authService.resetPassword(data);
      
      if (response.success) {
        set({ 
          step: 'success',
          message: response.message,
          isLoading: false 
        });
        return { success: true, message: response.message };
      }
      
      set({ error: response.message, isLoading: false });
      return { success: false, message: response.message };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al restablecer contraseña';
      set({ error: errorMessage, isLoading: false });
      return { success: false, message: errorMessage };
    }
  },

  reset: () => {
    set({
      isLoading: false,
      email: '',
      resetToken: '',
      step: 'email',
      message: '',
      error: '',
    });
  },
}));