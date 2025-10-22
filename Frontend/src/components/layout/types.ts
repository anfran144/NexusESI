import { type LinkProps } from '@tanstack/react-router'

type User = {
  name: string
  email: string
  avatar: string
}

type Team = {
  name: string
  logo: React.ElementType
  plan: string
}

type BaseNavItem = {
  title: string
  badge?: string
  icon?: React.ElementType
  permission?: string // Nueva propiedad para control de permisos
  isVisible?: () => boolean // Función para determinar si el item es visible
}

type NavLink = BaseNavItem & {
  url: LinkProps['to'] | (string & {})
  items?: never
  isActive?: boolean
}

type NavCollapsible = BaseNavItem & {
  items: (BaseNavItem & { 
    url: LinkProps['to'] | (string & {})
    permission?: string // También en items anidados
    isActive?: boolean
    isVisible?: () => boolean
  })[]
  url?: never
}

type NavItem = NavCollapsible | NavLink

type NavGroup = {
  title: string
  items: NavItem[]
}

type SidebarData = {
  user: User
  teams: Team[]
  navGroups: NavGroup[]
}

export type { SidebarData, NavGroup, NavItem, NavCollapsible, NavLink }
