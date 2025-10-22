import {
  LayoutDashboard,
  Monitor,
  HelpCircle,
  Bell,
  Palette,
  Settings,
  Wrench,
  UserCog,
  Command,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'satnaing',
    email: 'satnaingdev@gmail.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'NexusESI',                 
      logo: Command,
      plan: 'Encuentro Semilleros Investigación',
    },
  ],
  navGroups: [
    {
      title: 'General',
      items: [
        {
          title: 'Panel de Control',
          url: '/',
          icon: LayoutDashboard,
        },
      ],
    },
    // {
    //   title: 'Páginas',
    //   items: [
    //     {
    //       title: 'Autenticación',
    //       icon: ShieldCheck,
    //       items: [
    //         {
    //           title: 'Iniciar Sesión',
    //           url: '/sign-in',
    //         },
    //         {
    //           title: 'Iniciar Sesión (2 Col)',
    //           url: '/sign-in-2',
    //         },
    //         {
    //           title: 'Registrarse',
    //           url: '/sign-up',
    //         },
    //         {
    //           title: 'Olvidé mi Contraseña',
    //           url: '/forgot-password',
    //         },
    //         {
    //           title: 'OTP',
    //           url: '/otp',
    //         },
    //       ],
    //     },
    //     {
    //       title: 'Errores',
    //       icon: Bug,
    //       items: [
    //         {
    //           title: 'No Autorizado',
    //           url: '/errors/unauthorized',
    //           icon: Lock,
    //         },
    //         {
    //           title: 'Prohibido',
    //           url: '/errors/forbidden',
    //           icon: UserX,
    //         },
    //         {
    //           title: 'No Encontrado',
    //           url: '/errors/not-found',
    //           icon: FileX,
    //         },
    //         {
    //           title: 'Error Interno del Servidor',
    //           url: '/errors/internal-server-error',
    //           icon: ServerOff,
    //         },
    //         {
    //           title: 'Error de Mantenimiento',
    //           url: '/errors/maintenance-error',
    //           icon: Construction,
    //         },
    //       ],
    //     },
    //   ],
    // },
    {
      title: 'Otros',
      items: [
        {
          title: 'Configuración',
          icon: Settings,
          items: [
            {
              title: 'Perfil',
              url: '/settings',
              icon: UserCog,
            },
            {
              title: 'Cuenta',
              url: '/settings/account',
              icon: Wrench,
            },
            {
              title: 'Apariencia',
              url: '/settings/appearance',
              icon: Palette,
            },
            {
              title: 'Notificaciones',
              url: '/settings/notifications',
              icon: Bell,
            },
            {
              title: 'Pantalla',
              url: '/settings/display',
              icon: Monitor,
            },
          ],
        },
        {
          title: 'Centro de Ayuda',
          url: '/help-center',
          icon: HelpCircle,
        },
      ],
    },
  ],
}
