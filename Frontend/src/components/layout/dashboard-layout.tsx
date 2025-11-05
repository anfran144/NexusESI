import type { ReactNode } from 'react'
import { ConfigDrawer } from '@/components/layout/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/auth/profile-dropdown'
import { Search } from '@/components/ui/search'
import { ThemeSwitch } from '@/components/ui/theme-switch'
import { NotificationDropdown } from '@/components/layout/notification-dropdown'
import { DashboardFooter } from './dashboard-footer'

type DashboardLayoutProps = {
  children: ReactNode
  headerActions?: ReactNode
  showSearch?: boolean
  showFooter?: boolean
  showNotifications?: boolean
  fluid?: boolean
  fixed?: boolean
}

export function DashboardLayout({
  children,
  headerActions,
  showSearch = true,
  showFooter = true,
  showNotifications = true,
  fluid = false,
  fixed = false,
}: DashboardLayoutProps) {
  return (
    <>
      {/* ===== Header ===== */}
      <Header fixed={fixed}>
        <div className='flex items-center gap-2 flex-1'>
          {/* Título removido - ahora se maneja en DashboardContent */}
        </div>
        
        <div className='ms-auto flex items-center space-x-4'>
          {showSearch && <Search />}
          {showNotifications && <NotificationDropdown />}
          {headerActions}
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      {/* ===== Main Content ===== */}
      <Main fixed={fixed} fluid={fluid}>
        <div className='flex flex-col flex-1'>
          <div className='flex-1'>
            {children}
          </div>
          
          {/* ===== Footer ===== */}
          {showFooter && <DashboardFooter />}
        </div>
      </Main>
    </>
  )
}