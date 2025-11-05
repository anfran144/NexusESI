import { useState, useEffect } from 'react'
import type { AdvancedFilters } from './useAdvancedFilters'

interface FilterFavorite {
  id: string
  name: string
  filters: AdvancedFilters
  createdAt: string
}

const STORAGE_KEY = 'nexus-esi-filter-favorites'

export function useFilterFavorites(context?: string) {
  const storageKey = context ? `${STORAGE_KEY}-${context}` : STORAGE_KEY
  const [favorites, setFavorites] = useState<FilterFavorite[]>([])
  
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsed = JSON.parse(stored) as FilterFavorite[]
        setFavorites(parsed)
      }
    } catch (error) {
      console.error('Error loading filter favorites:', error)
    }
  }, [storageKey])
  
  const saveFavorite = (name: string, filters: AdvancedFilters) => {
    const newFavorite: FilterFavorite = {
      id: Date.now().toString(),
      name,
      filters,
      createdAt: new Date().toISOString(),
    }
    
    const updated = [...favorites, newFavorite]
    setFavorites(updated)
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated))
    } catch (error) {
      console.error('Error saving filter favorite:', error)
      throw error
    }
  }
  
  const deleteFavorite = (id: string) => {
    const updated = favorites.filter(fav => fav.id !== id)
    setFavorites(updated)
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated))
    } catch (error) {
      console.error('Error deleting filter favorite:', error)
      throw error
    }
  }
  
  const loadFavorite = (id: string): AdvancedFilters | null => {
    const favorite = favorites.find(fav => fav.id === id)
    return favorite ? favorite.filters : null
  }
  
  return {
    favorites,
    saveFavorite,
    deleteFavorite,
    loadFavorite,
  }
}

