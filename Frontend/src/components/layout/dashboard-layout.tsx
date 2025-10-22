import type { ReactNode } from 'react'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { DashboardFooter } from './dashboard-footer'

type DashboardLayoutProps = {
  children: ReactNode
  title?: string
  description?: string
  headerActions?: ReactNode
  showSearch?: boolean
  showFooter?: boolean
  fluid?: boolean
  fixed?: boolean
}

export function DashboardLayout({
  children,
  title,
  description,
  headerActions,
  showSearch = true,
  showFooter = true,
  fluid = false,
  fixed = false,
}: DashboardLayoutProps) {
  return (
    <>
      {/* ===== Header ===== */}
      <Header fixed={fixed}>
        <div className='flex items-center gap-2 flex-1'>
          {title && (
            <div className='flex flex-col'>
              <h1 className='text-lg font-semibold'>{title}</h1>
              {description && (
                <p className='text-sm text-muted-foreground'>{description}</p>
              )}
            </div>
          )}
        </div>
        
        <div className='ms-auto flex items-center space-x-4'>
          {showSearch && <Search />}
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