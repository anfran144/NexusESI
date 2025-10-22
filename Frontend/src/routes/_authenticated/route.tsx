import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    // Centralizar la verificación de autenticación en el store para evitar
    // llamadas duplicadas a /auth/me y poblar el estado global de usuario.
    const isOk = await useAuthStore.getState().checkAuth()
    if (!isOk) {
      throw redirect({
        to: '/sign-in',
        search: {
          redirect: location.href,
        },
      })
    }
  },
  component: AuthenticatedLayout,
})
