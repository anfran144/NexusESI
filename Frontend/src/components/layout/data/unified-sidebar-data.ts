import { SidebarData } from '../types'
import type { AuthUser } from '@/services/auth.service'
import { 
  Command, 
  LayoutDashboard, 
  Building2, 
  Users, 
  Settings,
  Calendar,
  Bell,
  CheckSquare,
  FolderKanban,
  Presentation,
  BarChart3,
  AlertTriangle
} from 'lucide-react'
import { useEventContext } from '@/stores/event-context-store'

/**
 * Configuración unificada del sidebar basada ÚNICAMENTE en permisos
 * Enfoque "Permission-First" según DEVELOPMENT-GUIDELINES.md
 * 
 * NUNCA usa roles directamente - solo permisos granulares
 */
export function getUnifiedSidebarData(user: AuthUser, hasActiveEvent: boolean = false): SidebarData {
  const userPermissions = user.permissions || []
  const isSeedbedLeader = user.roles?.some(role => role.name === 'seedbed_leader') || false
  
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
          // Mi Evento - Seedbed Leader (Contextual)
          {
            title: 'Mi Evento',
            url: '/seedbed-leader/mi-evento',
            icon: Calendar,
            permission: 'events.participate',
            isVisible: () => {
              // Solo visible si es líder de semillero y tiene un evento activo
              return isSeedbedLeader && hasActiveEvent
            }
          },
          // Tareas del Comité - Seedbed Leader (Contextual)
          {
            title: 'Tareas del Comité',
            url: '/seedbed-leader/tareas-comite',
            icon: Users,
            permission: 'events.tasks.view',
            isVisible: () => {
              // Solo visible si es líder de semillero y tiene un evento activo
              return isSeedbedLeader && hasActiveEvent
            }
          },
                    // Mis Tareas - Seedbed Leader (Contextual)
          {
            title: 'Mis Tareas',
            url: '/seedbed-leader/mis-tareas',
            icon: CheckSquare,
            permission: 'events.tasks.view_assigned',
            isVisible: () => {
              // Solo visible si es líder de semillero y tiene un evento activo
              return isSeedbedLeader && hasActiveEvent
            }
          },
          // Calendario - Seedbed Leader (Contextual)
          {
            title: 'Calendario',
            url: '/seedbed-leader/mi-evento/calendario',
            icon: Calendar,
            permission: 'events.view',
            isVisible: () => {
              // Solo visible si es líder de semillero y tiene un evento activo
              return isSeedbedLeader && hasActiveEvent
            }
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
          // Mis Eventos - Coordinator (Solo coordinadores)
          {
            title: 'Mis Eventos',
            url: '/coordinator/eventos',
            icon: Calendar,
            permission: 'coordinator.dashboard.view'
          },
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
          // Líderes de Semillero - Coordinator (Contextual)
          {
            title: 'Líderes de Semillero',
            url: '#', // Se construirá dinámicamente
            icon: Users,
            permission: 'events.manage_participants',
            isVisible: () => {
              const { selectedEventId } = useEventContext.getState()
              return selectedEventId !== null
            }
          },
          // Comités de Trabajo - Coordinator (Contextual)
          {
            title: 'Comités de Trabajo',
            url: '#', // Se construirá dinámicamente
            icon: FolderKanban,
            permission: 'events.committees.manage',
            isVisible: () => {
              const { selectedEventId } = useEventContext.getState()
              return selectedEventId !== null
            }
          },
          // Banco de Tareas - Coordinator (Contextual)
          {
            title: 'Banco de Tareas',
            url: '#', // Se construirá dinámicamente
            icon: CheckSquare,
            permission: 'events.tasks.manage', // ✅ Nuevo permiso específico de eventos
            isVisible: () => {
              const { selectedEventId } = useEventContext.getState()
              return selectedEventId !== null
            }
          },
          // Mis Tareas - Seedbed Leader (Contextual)
          {
            title: 'Mis Tareas',
            url: '#', // Se construirá dinámicamente
            icon: CheckSquare,
            permission: 'events.tasks.view_assigned', // ✅ Nuevo permiso específico de eventos
            isVisible: () => {
              const { selectedEventId } = useEventContext.getState()
              return selectedEventId !== null
            }
          },
          // Monitoreo - Coordinator (Contextual)
          {
            title: 'Monitoreo',
            url: '#', // Se construirá dinámicamente
            icon: BarChart3,
            permission: 'events.tasks.manage', // Usar mismo permiso que gestión de tareas
            isVisible: () => {
              const { selectedEventId } = useEventContext.getState()
              return selectedEventId !== null
            }
          },
          // Incidencias - Coordinator (Contextual)
          {
            title: 'Incidencias',
            url: '#', // Se construirá dinámicamente
            icon: AlertTriangle,
            permission: 'incidents.view', // Nuevo permiso específico para incidencias
            isVisible: () => {
              const { selectedEventId } = useEventContext.getState()
              return selectedEventId !== null
            }
          },
          // Calendario - Coordinator (Contextual)
          {
            title: 'Calendario',
            url: '#', // Se construirá dinámicamente
            icon: Calendar,
            permission: 'events.view',
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