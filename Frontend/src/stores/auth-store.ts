import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { authService, type AuthUser, type LoginCredentials, type RegisterData } from '@/services/auth.service';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  setUser: (user: AuthUser | null) => void;
  setAccessToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message?: string; redirect_to?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  resetAuth: () => void;
  getRedirectRoute: () => string;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      accessToken: null,
      isLoading: false,
      isAuthenticated: false,

      // Acciones
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setAccessToken: (token) => {
        set({ accessToken: token });
        if (token) {
          Cookies.set('ACCESS_TOKEN', token, { expires: 7 });
        } else {
          Cookies.remove('ACCESS_TOKEN');
        }
      },
      
      setLoading: (loading) => set({ isLoading: loading }),

      login: async (credentials) => {
        try {
          set({ isLoading: true });
          const response = await authService.login(credentials);
          
          if (response.success) {
            set({ 
              user: response.user, 
              accessToken: response.access_token,
              isAuthenticated: true,
              isLoading: false 
            });
            
            Cookies.set('ACCESS_TOKEN', response.access_token, { expires: 7 });
            
            return { 
              success: true, 
              redirect_to: response.user.dashboard_route 
            };
          }
          
          set({ isLoading: false });
          return { success: false, message: response.message };
        } catch (error: any) {
          set({ isLoading: false });
          const errorMessage = error.response?.data?.message || 'Error al iniciar sesión';
          return { success: false, message: errorMessage };
        }
      },

      register: async (data) => {
        try {
          set({ isLoading: true });
          const response = await authService.register(data);
          
          if (response.success) {
            set({ 
              user: response.user, 
              accessToken: response.access_token,
              isAuthenticated: true,
              isLoading: false 
            });
            
            Cookies.set('ACCESS_TOKEN', response.access_token, { expires: 7 });
            return { success: true };
          }
          
          set({ isLoading: false });
          return { success: false, message: response.message };
        } catch (error: any) {
          set({ isLoading: false });
          const errorMessage = error.response?.data?.message || 'Error al registrarse';
          return { success: false, message: errorMessage };
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch (error) {
          console.error('Error al cerrar sesión:', error);
        } finally {
          set({ 
            user: null, 
            accessToken: null, 
            isAuthenticated: false 
          });
          Cookies.remove('ACCESS_TOKEN');
        }
      },

      checkAuth: async () => {
        const state = get();
        
        // Si ya está autenticado y tiene usuario, no hacer llamada duplicada
        if (state.isAuthenticated && state.user) {
          return true;
        }
        
        try {
          set({ isLoading: true });
          const response = await authService.me();
          
          if (response.success && response.user) {
            set({ 
              user: response.user, 
              isAuthenticated: true,
              isLoading: false 
            });
            return true;
          }
          
          get().resetAuth();
          return false;
        } catch (error) {
          get().resetAuth();
          return false;
        }
      },

      resetAuth: () => {
        set({ 
          user: null, 
          accessToken: null, 
          isAuthenticated: false, 
          isLoading: false 
        });
        Cookies.remove('ACCESS_TOKEN');
      },

      getRedirectRoute: () => {
        const { user } = get();
        if (!user) return '/sign-in';
        return user.dashboard_route || '/sign-in';
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Intentar obtener el token de las cookies si no está en el estado
          const cookieToken = Cookies.get('ACCESS_TOKEN');
          if (cookieToken && !state.accessToken) {
            try {
              // Manejar tanto string plano como JSON
              const token = cookieToken.startsWith('"') ? JSON.parse(cookieToken) : cookieToken;
              state.accessToken = token;
            } catch (error) {
              console.error('Error parsing token from cookie:', error);
              Cookies.remove('ACCESS_TOKEN');
            }
          }
        }
      },
    }
  )
);
