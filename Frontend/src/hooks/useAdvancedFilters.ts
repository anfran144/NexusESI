import { useState, useEffect, useCallback } from 'react'

export interface AdvancedFilters {
  // Filtros por comité
  committeeIds?: number[]
  
  // Filtros por estado
  statuses?: string[]
  excludeStatuses?: string[]
  
  // Filtros por fecha
  dateRange?: 'today' | 'this-week' | 'this-month' | 'last-week' | 'last-month' | 'overdue' | 'custom'
  dateFrom?: string
  dateTo?: string
  
  // Filtros por período (para eventos)
  period?: 'active' | 'upcoming' | 'past' | 'this-month' | 'next-month'
  startDateFrom?: string
  startDateTo?: string
  endDateFrom?: string
  endDateTo?: string
  
  // Otros filtros
  assignedToId?: number | null
  riskLevel?: string
  eventId?: number
}

interface UseAdvancedFiltersOptions {
  initialFilters?: AdvancedFilters
  syncWithUrl?: boolean
  filterKey?: string
}

export function useAdvancedFilters(options: UseAdvancedFiltersOptions = {}) {
  const { initialFilters = {}, syncWithUrl = true, filterKey = 'filters' } = options
  
  // Parsear filtros desde URL si están disponibles
  const parseFiltersFromUrl = useCallback((): AdvancedFilters => {
    if (!syncWithUrl) return initialFilters
    
    const searchParams = new URLSearchParams(window.location.search)
    const urlFilters = searchParams.get(filterKey)
    if (!urlFilters) return initialFilters
    
    try {
      const parsed = JSON.parse(decodeURIComponent(urlFilters))
      return { ...initialFilters, ...parsed }
    } catch {
      return initialFilters
    }
  }, [syncWithUrl, filterKey, initialFilters])
  
  const [filters, setFilters] = useState<AdvancedFilters>(parseFiltersFromUrl)
  
  // Sincronizar con URL cuando cambien los filtros
  useEffect(() => {
    if (!syncWithUrl) return
    
    const searchParams = new URLSearchParams(window.location.search)
    const filtersString = JSON.stringify(filters)
    
    if (filtersString === '{}' || Object.keys(filters).length === 0) {
      searchParams.delete(filterKey)
    } else {
      searchParams.set(filterKey, encodeURIComponent(filtersString))
    }
    
    const newUrl = `${window.location.pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    window.history.replaceState({}, '', newUrl)
  }, [filters, syncWithUrl, filterKey])
  
  const updateFilters = useCallback((newFilters: Partial<AdvancedFilters>) => {
    setFilters(prev => {
      const updated = { ...prev, ...newFilters }
      // Eliminar propiedades undefined/null vacías
      Object.keys(updated).forEach(key => {
        const value = updated[key as keyof AdvancedFilters]
        if (value === undefined || 
            (Array.isArray(value) && value.length === 0) ||
            (value === null && key !== 'assignedToId')) {
          delete updated[key as keyof AdvancedFilters]
        }
      })
      return updated
    })
  }, [])
  
  const resetFilters = useCallback(() => {
    setFilters(initialFilters)
  }, [initialFilters])
  
  const clearFilters = useCallback(() => {
    setFilters({})
  }, [])
  
  const hasActiveFilters = useCallback((): boolean => {
    return Object.keys(filters).length > 0 && 
           Object.values(filters).some(value => {
             if (Array.isArray(value)) return value.length > 0
             if (value === null) return false
             return value !== undefined && value !== ''
           })
  }, [filters])
  
  const getActiveFiltersCount = useCallback((): number => {
    return Object.values(filters).filter(value => {
      if (Array.isArray(value)) return value.length > 0
      if (value === null) return false
      return value !== undefined && value !== ''
    }).length
  }, [filters])
  
  return {
    filters,
    updateFilters,
    resetFilters,
    clearFilters,
    hasActiveFilters: hasActiveFilters(),
    activeFiltersCount: getActiveFiltersCount(),
  }
}

