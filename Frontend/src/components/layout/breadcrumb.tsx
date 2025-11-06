import { ChevronRight } from 'lucide-react'
import { Link, useLocation } from '@tanstack/react-router'
import { useEventContext } from '@/stores/event-context-store'
import { useMemo } from 'react'

interface Breadcrumb {
  label: string
  href: string
}

export const Breadcrumb = () => {
  const { selectedEventId, selectedEventName } = useEventContext()
  const location = useLocation()

  const breadcrumbs = useMemo(() => {
    const crumbs: Breadcrumb[] = []

    // Si hay un evento seleccionado, construir breadcrumbs contextuales
    if (selectedEventId && selectedEventName) {
      crumbs.push({
        label: 'Eventos',
        href: '/coordinator/eventos'
      })

      crumbs.push({
        label: selectedEventName,
        href: `/coordinator/eventos/${selectedEventId}`
      })

      // Agregar crumb según la ruta actual
      if (location.pathname.includes('/participantes')) {
        crumbs.push({
          label: 'Líderes de Semillero',
          href: `/coordinator/eventos/${selectedEventId}/participantes`
        })
      } else if (location.pathname.includes('/comites')) {
        crumbs.push({
          label: 'Comités de Trabajo',
          href: `/coordinator/eventos/${selectedEventId}/comites`
        })
      } else if (location.pathname.includes('/tasks') || location.pathname.endsWith('/tasks')) {
        crumbs.push({
          label: 'Banco de Tareas',
          href: `/coordinator/eventos/${selectedEventId}/tasks`
        })
      } else if (location.pathname.includes('/monitoreo')) {
        crumbs.push({
          label: 'Monitoreo',
          href: `/coordinator/eventos/${selectedEventId}/monitoreo`
        })
      } else if (location.pathname.includes('/incidencias')) {
        crumbs.push({
          label: 'Incidencias',
          href: `/coordinator/eventos/${selectedEventId}/incidencias`
        })
      } else if (location.pathname.includes('/calendario')) {
        crumbs.push({
          label: 'Calendario',
          href: `/coordinator/eventos/${selectedEventId}/calendario`
        })
      }
    }

    return crumbs
  }, [selectedEventId, selectedEventName, location.pathname])

  // No mostrar breadcrumbs si no hay contexto
  if (breadcrumbs.length === 0) {
    return null
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.href} className="flex items-center space-x-2">
          {index > 0 && <ChevronRight className="h-4 w-4" />}
          <Link
            to={crumb.href}
            className={
              index === breadcrumbs.length - 1
                ? 'font-medium text-foreground'
                : 'hover:text-foreground transition-colors'
            }
          >
            {crumb.label}
          </Link>
        </div>
      ))}
    </nav>
  )
}

