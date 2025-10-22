import { SidebarData } from '../types'
import type { AuthUser } from '@/services/auth.service'
import { 
  Command, 
  LayoutDashboard, 
  Building2, 
  Users, 
  Settings,
  Calendar,
  FolderKanban,
  Presentation
} from 'lucide-react'
import { useEventContext } from '@/stores/event-context-store'

/**
 * Configuración unificada del sidebar basada ÚNICAMENTE en permisos
 * Enfoque "Permission-First" según DEVELOPMENT-GUIDELINES.md
 * 
 * NUNCA usa roles directamente - solo permisos granulares
 */
export function getUnifiedSidebarData(user: AuthUser): SidebarData {
  const userPermissions = user.permissions || []
  
  // Determinar el plan según los permisos (solo para mostrar en UI)
  let plan = 'Usuario'
  if (userPermissions.includes('admin.dashboard.view')) {
    plan = 'Administración'
  } else if (userPermissions.includes('coordinator.dashboard.view')) {
    plan = 'Coordinación'
  } else if (userPermissions.includes('seedbed_leader.dashboard.view')) {
    plan = 'Liderazgo'
  }

  return {
    user: {
      name: user.name || '',
      email: user.email || '',
      avatar: user.avatar || '/images/default-avatar.png'
    },
    teams: [
      {
        name: 'NexusESI',
        logo: Command,
        plan
      }
    ],
    navGroups: [
      {
        title: 'General',
        items: [
          // Dashboard Admin
          {
            title: 'Panel de Control',
            url: '/admin',
            icon: LayoutDashboard,
            permission: 'admin.dashboard.view'
          },
          // Dashboard Coordinator
          {
            title: 'Panel de Control',
            url: '/coordinator',
            icon: LayoutDashboard,
            permission: 'coordinator.dashboard.view'
          },
          // Dashboard Seedbed Leader
          {
            title: 'Panel de Control',
            url: '/seedbed-leader',
            icon: LayoutDashboard,
            permission: 'seedbed_leader.dashboard.view'
          },
          // Instituciones - Admin
          {
            title: 'Instituciones',
            url: '/admin/instituciones',
            icon: Building2,
            permission: 'admin.institutions.view'
          },
          // Usuarios - Admin
          {
            title: 'Usuarios',
            url: '/admin/usuarios',
            icon: Users,
            permission: 'admin.users.view'
          },
          // Permisos - Admin
          {
            title: 'Permisos',
            url: '/admin/permisos',
            icon: Settings,
            permission: 'admin.roles.manage'
          },
          // Mis Eventos - Coordinator (Siempre visible)
          {
            title: 'Mis Eventos',
            url: '/coordinator/eventos',
            icon: Calendar,
            permission: 'events.view'
          },
          // Eventos - Seedbed Leader
          {
            title: 'Eventos',
            url: '/seedbed-leader/eventos',
            icon: Calendar,
            permission: 'events.participate'
          }
        ]
      },
      // Grupo Contextual: Gestión del Evento
      {
        title: 'Gestión del Evento',
        items: [
          // Panel del Evento - Coordinator (Contextual)
          {
            title: 'Panel del Evento',
            url: '#', // Se construirá dinámicamente
            icon: Presentation,
            permission: 'events.view',
            isVisible: () => {
              const { selectedEventId } = useEventContext.getState()
              return selectedEventId !== null
            }
          },
          // Participantes - Coordinator (Contextual)
          {
            title: 'Participantes',
            url: '#', // Se construirá dinámicamente
            icon: Users,
            permission: 'events.manage_participants',
            isVisible: () => {
              const { selectedEventId } = useEventContext.getState()
              return selectedEventId !== null
            }
          },
          // Comités - Coordinator (Contextual)
          {
            title: 'Comités',
            url: '#', // Se construirá dinámicamente
            icon: FolderKanban,
            permission: 'events.committees.manage',
            isVisible: () => {
              const { selectedEventId } = useEventContext.getState()
              return selectedEventId !== null
            }
          }
        ]
      }
    ]
  }
}

/**
 * Configuración por defecto para usuarios sin permisos específicos
 */
export const defaultSidebarData: SidebarData = {
  user: {
    name: '',
    email: '',
    avatar: '/images/default-avatar.png'
  },
  teams: [
    {
      name: 'NexusESI',
      logo: Command,
      plan: 'Usuario'
    }
  ],
  navGroups: [
    {
      title: 'Dashboard',
      items: [
        {
          title: 'Panel Principal',
          url: '/',
          icon: LayoutDashboard,
          permission: 'dashboard.view'
        }
      ]
    }
  ]
}