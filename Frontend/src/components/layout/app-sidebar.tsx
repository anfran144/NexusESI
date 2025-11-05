import { useLayout } from '@/context/layout-provider'
import { useAuthStore } from '@/stores/auth-store'
import { useEventContext } from '@/stores/event-context-store'
import { useSidebarState } from '@/hooks/useSidebarState'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import { Calendar } from 'lucide-react'
// import { AppTitle } from './app-title'
import { getUnifiedSidebarData, defaultSidebarData } from './data/unified-sidebar-data'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { TeamSwitcher } from './team-switcher'

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const { user } = useAuthStore()
  const { selectedEventName } = useEventContext()
  const { hasActiveEvent } = useSidebarState()
  
  // Generar datos del sidebar basados en permisos del usuario autenticado
  const sidebarData = user ? getUnifiedSidebarData(user, hasActiveEvent) : defaultSidebarData
  
  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <TeamSwitcher teams={sidebarData.teams} />

        {/* Replace <TeamSwitch /> with the following <AppTitle />
         /* if you want to use the normal app title instead of TeamSwitch dropdown */}
        {/* <AppTitle /> */}
        
        {/* Badge de Evento Activo */}
        {selectedEventName && (
          <div className="px-3 py-2 mt-2 bg-primary/10 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <Badge variant="secondary" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                Evento Activo
              </Badge>
            </div>
            <p className="text-sm font-medium truncate" title={selectedEventName}>
              {selectedEventName}
            </p>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
