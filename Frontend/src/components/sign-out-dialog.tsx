import { useState } from 'react'
import { useNavigate, useLocation } from '@tanstack/react-router'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'

interface SignOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm?: () => void
}

export function SignOutDialog({ open, onOpenChange, onConfirm }: SignOutDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuthStore()

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await logout()
      
      if (onConfirm) {
        onConfirm()
      }
      
      toast.success('Sesión cerrada exitosamente')
      
      // Preserve current location for redirect after sign-in
      const currentPath = location.href
      navigate({
        to: '/sign-in',
        search: { redirect: currentPath },
        replace: true,
      })
    } catch (error) {
      console.error('Error during sign out:', error)
      toast.error('Error al cerrar sesión')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Cerrar Sesión"
      desc="¿Estás seguro de que quieres cerrar tu sesión? Tendrás que iniciar sesión nuevamente para acceder a tu cuenta."
      confirmText={isLoading ? "Cerrando..." : "Cerrar Sesión"}
      cancelBtnText="Cancelar"
      destructive
      handleConfirm={handleSignOut}
      isLoading={isLoading}
    />
  )
}
