import { useState, useEffect } from 'react'

export interface PasswordStrength {
  score: number // 0-4
  label: string
  color: string
  suggestions: string[]
}

export const usePasswordStrength = (password: string): PasswordStrength => {
  const [strength, setStrength] = useState<PasswordStrength>({
    score: 0,
    label: 'Muy débil',
    color: 'bg-red-500',
    suggestions: []
  })

  useEffect(() => {
    const evaluatePassword = (pwd: string): PasswordStrength => {
      if (!pwd) {
        return {
          score: 0,
          label: 'Ingresa una contraseña',
          color: 'bg-gray-300',
          suggestions: ['La contraseña es requerida']
        }
      }

      let score = 0
      const suggestions: string[] = []

      // Longitud mínima
      if (pwd.length >= 8) {
        score += 1
      } else {
        suggestions.push('Usa al menos 8 caracteres')
      }

      // Contiene minúsculas
      if (/[a-z]/.test(pwd)) {
        score += 1
      } else {
        suggestions.push('Incluye letras minúsculas')
      }

      // Contiene mayúsculas
      if (/[A-Z]/.test(pwd)) {
        score += 1
      } else {
        suggestions.push('Incluye letras mayúsculas')
      }

      // Contiene números
      if (/\d/.test(pwd)) {
        score += 1
      } else {
        suggestions.push('Incluye números')
      }

      // Contiene caracteres especiales
      if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
        score += 1
      } else {
        suggestions.push('Incluye caracteres especiales (!@#$%^&*)')
      }

      // Determinar etiqueta y color basado en el puntaje
      let label: string
      let color: string

      switch (score) {
        case 0:
        case 1:
          label = 'Muy débil'
          color = 'bg-red-500'
          break
        case 2:
          label = 'Débil'
          color = 'bg-orange-500'
          break
        case 3:
          label = 'Media'
          color = 'bg-yellow-500'
          break
        case 4:
          label = 'Fuerte'
          color = 'bg-green-500'
          break
        case 5:
          label = 'Muy fuerte'
          color = 'bg-green-600'
          break
        default:
          label = 'Muy débil'
          color = 'bg-red-500'
      }

      return {
        score,
        label,
        color,
        suggestions
      }
    }

    setStrength(evaluatePassword(password))
  }, [password])

  return strength
}