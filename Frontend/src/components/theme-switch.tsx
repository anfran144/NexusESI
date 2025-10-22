import { useEffect } from 'react'
import { Check, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/theme-provider'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function ThemeSwitch() {
  const { theme, setTheme } = useTheme()

  /* Update theme-color meta tag
   * when theme is updated */
  useEffect(() => {
    const themeColor = theme === 'dark' ? 'oklch(0.15 0.02 225)' : 'oklch(0.96 0.004 247.896)'
    const metaThemeColor = document.querySelector("meta[name='theme-color']")
    if (metaThemeColor) metaThemeColor.setAttribute('content', themeColor)
  }, [theme])

  return (
    <Tooltip>
      <DropdownMenu modal={false}>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button 
              variant='ghost' 
              size='icon' 
              className='scale-95 rounded-full hover:scale-100 transition-transform duration-200 ease-in-out'
              aria-label={`Cambiar tema. Tema actual: ${theme === 'light' ? 'claro' : theme === 'dark' ? 'oscuro' : 'sistema'}`}
            >
              <Sun className='size-[1.2rem] scale-100 rotate-0 transition-all duration-300 ease-in-out dark:scale-0 dark:-rotate-90' />
              <Moon className='absolute size-[1.2rem] scale-0 rotate-90 transition-all duration-300 ease-in-out dark:scale-100 dark:rotate-0' />
              <span className='sr-only'>Cambiar tema</span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Cambiar tema de la aplicación</p>
        </TooltipContent>
        <DropdownMenuContent align='end' className="animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200">
          <DropdownMenuItem 
            onClick={() => setTheme('light')}
            className="cursor-pointer transition-colors duration-150 hover:bg-accent/80"
          >
            Claro{' '}
            <Check
              size={14}
              className={cn('ms-auto transition-opacity duration-200', theme !== 'light' && 'opacity-0')}
            />
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setTheme('dark')}
            className="cursor-pointer transition-colors duration-150 hover:bg-accent/80"
          >
            Oscuro
            <Check
              size={14}
              className={cn('ms-auto transition-opacity duration-200', theme !== 'dark' && 'opacity-0')}
            />
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setTheme('system')}
            className="cursor-pointer transition-colors duration-150 hover:bg-accent/80"
          >
            Sistema
            <Check
              size={14}
              className={cn('ms-auto transition-opacity duration-200', theme !== 'system' && 'opacity-0')}
            />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Tooltip>
  )
}
