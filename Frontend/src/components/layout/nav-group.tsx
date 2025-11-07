import React, { type ReactNode } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Badge } from '../ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import {
  type NavCollapsible,
  type NavItem,
  type NavLink,
  type NavGroup as NavGroupProps,
} from './types'
import { usePermissions } from '@/hooks/usePermissions'
import { useEventContext } from '@/stores/event-context-store'

export function NavGroup({ title, items }: NavGroupProps) {
  const { state, isMobile } = useSidebar()
  const { hasPermission } = usePermissions()
  const href = useLocation({ select: (location) => location.href })
  
  // Filtrar items basado en permisos y visibilidad
  const visibleItems = items.filter(item => {
    // Si tiene función isVisible, evaluarla
    if (item.isVisible && !item.isVisible()) return false
    
    // Si no tiene permiso definido, mostrar el item
    if (!item.permission) return true
    
    // Si tiene permiso definido, verificar que el usuario lo tenga
    return hasPermission(item.permission)
  })

  // Si no hay items visibles, no renderizar el grupo
  if (visibleItems.length === 0) return null

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarMenu>
        {visibleItems.map((item) => {
          const key = `${item.title}-${item.url}`

          if (!item.items)
            return <SidebarMenuLink key={key} item={item} href={href} />

          if (state === 'collapsed' && !isMobile)
            return (
              <SidebarMenuCollapsedDropdown key={key} item={item} href={href} />
            )

          return <SidebarMenuCollapsible key={key} item={item} href={href} />
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

function NavBadge({ children }: { children: ReactNode }) {
  return <Badge className='rounded-full px-1 py-0 text-xs'>{children}</Badge>
}

function SidebarMenuLink({ item, href }: { item: NavLink; href: string }) {
  const { setOpenMobile } = useSidebar()
  const { selectedEventId, clearSelectedEvent } = useEventContext()
  
  // Construir URL dinámica para opciones contextuales
  // Usar selectedEventId como dependencia para forzar re-render
  const linkUrl = React.useMemo(() => {
    let url = item.url
    
    // Si la URL es '#' y hay un evento seleccionado, construir URL contextual
    if (url === '#' && selectedEventId) {
      if (item.title === 'Panel del Evento') {
        url = `/coordinator/eventos/${selectedEventId}`
      } else if (item.title === 'Líderes de Semillero') {
        url = `/coordinator/eventos/${selectedEventId}/participantes`
      } else if (item.title === 'Comités de Trabajo') {
        url = `/coordinator/eventos/${selectedEventId}/comites`
      } else if (item.title === 'Banco de Tareas') {
        url = `/coordinator/eventos/${selectedEventId}/tasks` // ✅ Ruta contextual
      } else if (item.title === 'Monitoreo') {
        url = `/coordinator/eventos/${selectedEventId}/monitoreo` // ✅ Ruta contextual
      } else if (item.title === 'Incidencias') {
        url = `/coordinator/eventos/${selectedEventId}/incidencias` // ✅ Ruta contextual
      } else if (item.title === 'Calendario') {
        url = `/coordinator/eventos/${selectedEventId}/calendario` // ✅ Ruta contextual
      } else if (item.title === 'Reuniones') {
        url = `/coordinator/eventos/${selectedEventId}/reuniones` // ✅ Ruta contextual
      }
    }
    
    return url
  }, [item.url, item.title, selectedEventId])
  
  // Handler para click - limpiar contexto si es "Mis Eventos"
  const handleClick = () => {
    setOpenMobile(false)
    
    // Si es "Mis Eventos", limpiar el contexto del evento
    if (item.title === 'Mis Eventos') {
      clearSelectedEvent()
    }
  }
  
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={checkIsActive(href, item)}
        tooltip={item.title}
      >
        <Link to={linkUrl} onClick={handleClick}>
          {item.icon && <item.icon />}
          <span>{item.title}</span>
          {item.badge && <NavBadge>{item.badge}</NavBadge>}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function SidebarMenuCollapsible({
  item,
  href,
}: {
  item: NavCollapsible
  href: string
}) {
  const { setOpenMobile } = useSidebar()
  const { hasPermission } = usePermissions()
  
  // Filtrar subitems basado en permisos
  const visibleSubItems = item.items.filter(subItem => {
    if (!subItem.permission) return true
    return hasPermission(subItem.permission)
  })

  // Si no hay subitems visibles, no renderizar el collapsible
  if (visibleSubItems.length === 0) return null

  return (
    <Collapsible
      asChild
      defaultOpen={checkIsActive(href, item, true)}
      className='group/collapsible'
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title}>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
            <ChevronRight className='ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className='CollapsibleContent'>
          <SidebarMenuSub>
            {visibleSubItems.map((subItem) => (
              <SidebarMenuSubItem key={subItem.title}>
                <SidebarMenuSubButton
                  asChild
                  isActive={checkIsActive(href, subItem)}
                >
                  <Link to={subItem.url} onClick={() => setOpenMobile(false)}>
                    {subItem.icon && <subItem.icon />}
                    <span>{subItem.title}</span>
                    {subItem.badge && <NavBadge>{subItem.badge}</NavBadge>}
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

function SidebarMenuCollapsedDropdown({
  item,
  href,
}: {
  item: NavCollapsible
  href: string
}) {
  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            tooltip={item.title}
            isActive={checkIsActive(href, item)}
          >
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            {item.badge && <NavBadge>{item.badge}</NavBadge>}
            <ChevronRight className='ms-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent side='right' align='start' sideOffset={4}>
          <DropdownMenuLabel>
            {item.title} {item.badge ? `(${item.badge})` : ''}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {item.items.map((sub) => (
            <DropdownMenuItem key={`${sub.title}-${sub.url}`} asChild>
              <Link
                to={sub.url}
                className={`${checkIsActive(href, sub) ? 'bg-secondary' : ''}`}
              >
                {sub.icon && <sub.icon />}
                <span className='max-w-52 text-wrap'>{sub.title}</span>
                {sub.badge && (
                  <span className='ms-auto text-xs'>{sub.badge}</span>
                )}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

function checkIsActive(href: string, item: NavItem, mainNav = false) {
  // Para items con URL dinámica (#), verificar si la ruta actual coincide con el patrón esperado
  if (item.url === '#') {
    const { selectedEventId } = useEventContext.getState()
    
    if (selectedEventId) {
      // Construir la URL esperada basada en el título del item
      let expectedUrl = ''
      
      if (item.title === 'Panel del Evento') {
        expectedUrl = `/coordinator/eventos/${selectedEventId}`
      } else if (item.title === 'Líderes de Semillero') {
        expectedUrl = `/coordinator/eventos/${selectedEventId}/participantes`
      } else if (item.title === 'Comités de Trabajo') {
        expectedUrl = `/coordinator/eventos/${selectedEventId}/comites`
      } else if (item.title === 'Banco de Tareas') {
        expectedUrl = `/coordinator/eventos/${selectedEventId}/tasks`
      } else if (item.title === 'Monitoreo') {
        expectedUrl = `/coordinator/eventos/${selectedEventId}/monitoreo`
      } else if (item.title === 'Incidencias') {
        expectedUrl = `/coordinator/eventos/${selectedEventId}/incidencias`
      } else if (item.title === 'Calendario') {
        expectedUrl = `/coordinator/eventos/${selectedEventId}/calendario`
      } else if (item.title === 'Reuniones') {
        expectedUrl = `/coordinator/eventos/${selectedEventId}/reuniones`
      }
      
      // Verificar si la URL actual coincide con la esperada
      return href === expectedUrl || href.split('?')[0] === expectedUrl
    }
    
    return false
  }
  
  // Lógica original para URLs estáticas
  return (
    href === item.url || // /endpint?search=param
    href.split('?')[0] === item.url || // endpoint
    !!item?.items?.filter((i) => i.url === href).length || // if child nav is active
    (mainNav &&
      href.split('/')[1] !== '' &&
      href.split('/')[1] === item?.url?.split('/')[1])
  )
}
