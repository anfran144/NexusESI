/**
 * Utilidad para generar colores determinísticos para comités
 * Basado en hash del nombre e ID del comité
 */

// Paleta de colores predefinida
const COMMITTEE_COLORS = [
  {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200',
    icon: 'text-blue-600'
  },
  {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200',
    icon: 'text-green-600'
  },
  {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-200',
    icon: 'text-purple-600'
  },
  {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-200',
    icon: 'text-orange-600'
  },
  {
    bg: 'bg-pink-100',
    text: 'text-pink-800',
    border: 'border-pink-200',
    icon: 'text-pink-600'
  },
  {
    bg: 'bg-indigo-100',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
    icon: 'text-indigo-600'
  },
  {
    bg: 'bg-teal-100',
    text: 'text-teal-800',
    border: 'border-teal-200',
    icon: 'text-teal-600'
  },
  {
    bg: 'bg-cyan-100',
    text: 'text-cyan-800',
    border: 'border-cyan-200',
    icon: 'text-cyan-600'
  },
  {
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    icon: 'text-emerald-600'
  },
  {
    bg: 'bg-violet-100',
    text: 'text-violet-800',
    border: 'border-violet-200',
    icon: 'text-violet-600'
  }
]

/**
 * Genera un hash simple a partir de una cadena
 */
function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convertir a entero de 32 bits
  }
  return Math.abs(hash)
}

/**
 * Genera colores determinísticos para un comité
 * @param committeeName - Nombre del comité
 * @param committeeId - ID del comité
 * @returns Objeto con clases CSS para colores
 */
export function getCommitteeColor(committeeName: string, committeeId: number) {
  // Crear una cadena única combinando nombre e ID
  const uniqueString = `${committeeName}-${committeeId}`
  
  // Generar hash
  const hash = simpleHash(uniqueString)
  
  // Seleccionar color basado en el hash
  const colorIndex = hash % COMMITTEE_COLORS.length
  const selectedColor = COMMITTEE_COLORS[colorIndex]
  
  return {
    ...selectedColor,
    // Clases combinadas para facilitar el uso
    card: `${selectedColor.bg} ${selectedColor.border}`,
    badge: `${selectedColor.bg} ${selectedColor.text}`,
    button: `${selectedColor.bg} hover:${selectedColor.bg.replace('100', '200')} ${selectedColor.text}`,
    // Color hexadecimal para gráficos
    hex: getHexColor(colorIndex)
  }
}

/**
 * Convierte el índice de color a valor hexadecimal
 */
function getHexColor(index: number): string {
  const hexColors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#8B5CF6', // purple
    '#F59E0B', // orange
    '#EC4899', // pink
    '#6366F1', // indigo
    '#14B8A6', // teal
    '#06B6D4', // cyan
    '#059669', // emerald
    '#7C3AED'  // violet
  ]
  return hexColors[index] || '#6B7280' // gray como fallback
}

/**
 * Hook para usar colores de comité en componentes React
 */
export function useCommitteeColor(committeeName: string, committeeId: number) {
  return getCommitteeColor(committeeName, committeeId)
}

/**
 * Obtiene un color aleatorio para casos especiales
 */
export function getRandomCommitteeColor() {
  const randomIndex = Math.floor(Math.random() * COMMITTEE_COLORS.length)
  return COMMITTEE_COLORS[randomIndex]
}

/**
 * Valida si un comité tiene colores válidos
 */
export function isValidCommitteeColor(committee: { name: string; id: number }): boolean {
  return !!(committee.name && committee.id && committee.name.trim().length > 0)
}
