import { create } from 'zustand'

/**
 * Store de contexto de evento para coordinadores
 * 
 * Gestiona el evento seleccionado actualmente por el coordinador
 * para activar opciones contextuales en el menú (participantes, comités)
 */

interface EventContextState {
  selectedEventId: number | null
  selectedEventName: string | null
  setSelectedEvent: (id: number, name?: string) => void
  clearSelectedEvent: () => void
}

export const useEventContext = create<EventContextState>((set) => ({
  selectedEventId: null,
  selectedEventName: null,
  
  setSelectedEvent: (id: number, name?: string) => {
    set({ 
      selectedEventId: id,
      selectedEventName: name || null
    })
  },
  
  clearSelectedEvent: () => {
    set({ 
      selectedEventId: null,
      selectedEventName: null 
    })
  }
}))

// Funciones estables para evitar re-renders innecesarios
export const useEventContextActions = () => {
  const setSelectedEvent = useEventContext((state) => state.setSelectedEvent)
  const clearSelectedEvent = useEventContext((state) => state.clearSelectedEvent)
  
  return {
    setSelectedEvent,
    clearSelectedEvent
  }
}