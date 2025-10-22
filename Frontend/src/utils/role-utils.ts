// Tipos de roles disponibles en el sistema
export type UserRole = 'admin' | 'coordinator' | 'seedbed_leader'

// Configuración de roles y sus rutas correspondientes
export const ROLE_ROUTES: Record<UserRole, string> = {
  admin: '/admin',
  coordinator: '/coordinator',
  seedbed_leader: '/seedbed-leader',
}

// Configuración de títulos por rol
export const ROLE_TITLES: Record<UserRole, string> = {
  admin: 'Panel de Administración',
  coordinator: 'Panel de Coordinación',
  seedbed_leader: 'Panel de Liderazgo',
}

// Configuración de mensajes de bienvenida por rol
export const ROLE_WELCOME_MESSAGES: Record<UserRole, (name?: string) => string> = {
  admin: (name) => `¡Bienvenido, ${name || 'Administrador'}! Desde aquí puedes gestionar todo el sistema NexusESI y supervisar todas las actividades.`,
  coordinator: (name) => `¡Bienvenido, ${name || 'Coordinador'}! Aquí puedes supervisar y coordinar las actividades de los semilleros bajo tu responsabilidad.`,
  seedbed_leader: (name) => `¡Bienvenido, ${name || 'Líder'}! Gestiona tu semillero de investigación y coordina las actividades de tu equipo.`,
}

/**
 * Obtiene la ruta del dashboard según el rol del usuario
 */
export function getDashboardRoute(role: UserRole): string {
  return ROLE_ROUTES[role] || '/'
}

/**
 * Obtiene el título del dashboard según el rol del usuario
 */
export function getDashboardTitle(role: UserRole): string {
  return ROLE_TITLES[role] || 'Dashboard'
}

/**
 * Obtiene el mensaje de bienvenida según el rol del usuario
 */
export function getDashboardWelcomeMessage(role: UserRole, userName?: string): string {
  const messageFunction = ROLE_WELCOME_MESSAGES[role]
  return messageFunction ? messageFunction(userName) : `¡Bienvenido de vuelta, ${userName || 'Usuario'}!`
}

/**
 * Verifica si un rol es válido
 */
export function isValidRole(role: string): role is UserRole {
  return ['admin', 'coordinator', 'seedbed_leader'].includes(role)
}

/**
 * Obtiene el rol por defecto si no se especifica uno
 */
export function getDefaultRole(): UserRole {
  return 'seedbed_leader'
}