import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { seedbedLeaderService } from '@/services/seedbed-leader-service'

export function useSidebarState() {
  const { user } = useAuthStore()
  const [hasActiveEvent, setHasActiveEvent] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !user.roles?.some(role => role.name === 'seedbed_leader')) {
      setLoading(false)
      return
    }

    const checkActiveEvent = async () => {
      try {
        const dashboardData = await seedbedLeaderService.getDashboard()
        setHasActiveEvent(dashboardData.has_active_event)
      } catch (error) {
        console.error('Error checking active event:', error)
        setHasActiveEvent(false)
      } finally {
        setLoading(false)
      }
    }

    checkActiveEvent()
  }, [user])

  return {
    hasActiveEvent,
    loading,
    isSeedbedLeader: user?.roles?.some(role => role.name === 'seedbed_leader') || false
  }
}
