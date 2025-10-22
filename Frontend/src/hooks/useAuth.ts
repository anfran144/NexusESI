import { useAuthStore } from '@/stores/auth-store'

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, login, logout, register, checkAuth } = useAuthStore()

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    register,
    checkAuth
  }
}