import { Link } from '@tanstack/react-router'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Heart, Mail, ExternalLink } from 'lucide-react'

export function DashboardFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className='mt-auto pt-8 border-t bg-background'>
      <div className='px-4 pb-6'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-6'>
          {/* Información de la Empresa */}
          <div className='space-y-3'>
            <h3 className='font-semibold text-sm'>NexusESI</h3>
            <p className='text-xs text-muted-foreground'>
              Sistema de gestión de eventos de semilleros diseñado para optimizar procesos y mejorar la productividad.
            </p>
          </div>

          {/* Enlaces Rápidos */}
          <div className='space-y-3'>
            <h3 className='font-semibold text-sm'>Enlaces Rápidos</h3>
            <div className='flex flex-col space-y-2'>
              <Link 
                to='/help-center' 
                className='text-xs text-muted-foreground hover:text-foreground transition-colors'
              >
                Centro de Ayuda
              </Link>
              <Link 
                to='/settings' 
                className='text-xs text-muted-foreground hover:text-foreground transition-colors'
              >
                Configuración
              </Link>
              <Link 
                to='/settings/account' 
                className='text-xs text-muted-foreground hover:text-foreground transition-colors'
              >
                Mi Cuenta
              </Link>
            </div>
          </div>

          {/* Soporte */}
          <div className='space-y-3'>
            <h3 className='font-semibold text-sm'>Soporte</h3>
            <div className='flex flex-col space-y-2'>
              <Button 
                variant='ghost' 
                size='sm' 
                className='justify-start h-auto p-0 text-xs text-muted-foreground hover:text-foreground'
                asChild
              >
                <a href='mailto:soporte@nexusesi.com'>
                  <Mail className='w-3 h-3 mr-2' />
                  Contactar Soporte
                </a>
              </Button>
              <Button 
                variant='ghost' 
                size='sm' 
                className='justify-start h-auto p-0 text-xs text-muted-foreground hover:text-foreground'
                asChild
              >
                <a href='https://docs.nexusesi.com' target='_blank' rel='noopener noreferrer'>
                  <ExternalLink className='w-3 h-3 mr-2' />
                  Documentación
                </a>
              </Button>
            </div>
          </div>

          {/* Estado del Sistema */}
          <div className='space-y-3'>
            <h3 className='font-semibold text-sm'>Estado del Sistema</h3>
            <div className='flex items-center space-x-2'>
              <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
              <span className='text-xs text-muted-foreground'>Todos los sistemas operativos</span>
            </div>
            <p className='text-xs text-muted-foreground'>
              Última actualización: {new Date().toLocaleDateString('es-ES')}
            </p>
          </div>
        </div>

        {/* Línea de Copyright */}
        <Separator className='mb-4' />
        <div className='flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0'>
          <div className='flex items-center space-x-1 text-xs text-muted-foreground'>
            <span>© {currentYear} NexusESI. Todos los derechos reservados.</span>
          </div>
          
          <div className='flex items-center space-x-4'>
            <Button 
              variant='ghost' 
              size='sm' 
              className='h-auto p-0 text-xs text-muted-foreground hover:text-foreground'
              asChild
            >
              <a href='/privacy' className='flex items-center space-x-1'>
                <span>Privacidad</span>
              </a>
            </Button>
            <Button 
              variant='ghost' 
              size='sm' 
              className='h-auto p-0 text-xs text-muted-foreground hover:text-foreground'
              asChild
            >
              <a href='/terms' className='flex items-center space-x-1'>
                <span>Términos</span>
              </a>
            </Button>
            <div className='flex items-center space-x-1 text-xs text-muted-foreground'>
              <span>Hecho con</span>
              <Heart className='w-3 h-3 text-red-500 fill-current' />
              <span>por el equipo NexusESI</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}