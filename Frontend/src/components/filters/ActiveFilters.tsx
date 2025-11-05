import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { AdvancedFilters } from '@/hooks/useAdvancedFilters'

interface ActiveFiltersProps {
  filters: AdvancedFilters
  onRemoveFilter: (key: keyof AdvancedFilters) => void
  onClearAll?: () => void
  committees?: Array<{ id: number; name: string }>
  statusOptions?: Array<{ value: string; label: string }>
  getStatusLabel?: (value: string) => string
}

const DEFAULT_STATUS_OPTIONS = [
  { value: 'Pending', label: 'Pendiente' },
  { value: 'InProgress', label: 'En Progreso' },
  { value: 'Completed', label: 'Completada' },
  { value: 'Delayed', label: 'Retrasada' },
  { value: 'Paused', label: 'Pausada' },
]

const DATE_RANGE_LABELS: Record<string, string> = {
  'today': 'Hoy',
  'this-week': 'Esta semana',
  'this-month': 'Este mes',
  'last-week': 'Semana pasada',
  'last-month': 'Mes pasado',
  'overdue': 'Atrasadas',
  'custom': 'Rango personalizado',
}

const PERIOD_LABELS: Record<string, string> = {
  'active': 'Activos',
  'upcoming': 'Próximos',
  'past': 'Pasados',
  'this-month': 'Este mes',
  'next-month': 'Próximo mes',
}

export function ActiveFilters({
  filters,
  onRemoveFilter,
  onClearAll,
  committees = [],
  statusOptions = DEFAULT_STATUS_OPTIONS,
  getStatusLabel = (value: string) => {
    const option = statusOptions.find(opt => opt.value === value)
    return option?.label || value
  },
}: ActiveFiltersProps) {
  const activeFilters: Array<{ key: keyof AdvancedFilters; label: string }> = []
  
  // Filtros por comité
  if (filters.committeeIds && filters.committeeIds.length > 0) {
    const committeeNames = filters.committeeIds
      .map(id => committees.find(c => c.id === id)?.name)
      .filter(Boolean)
      .join(', ')
    if (committeeNames) {
      activeFilters.push({
        key: 'committeeIds',
        label: `Comités: ${committeeNames}`,
      })
    }
  }
  
  // Filtros por estado (incluir)
  if (filters.statuses && filters.statuses.length > 0) {
    activeFilters.push({
      key: 'statuses',
      label: `Estados: ${filters.statuses.map(getStatusLabel).join(', ')}`,
    })
  }
  
  // Filtros por estado (excluir)
  if (filters.excludeStatuses && filters.excludeStatuses.length > 0) {
    activeFilters.push({
      key: 'excludeStatuses',
      label: `Excluir: ${filters.excludeStatuses.map(getStatusLabel).join(', ')}`,
    })
  }
  
  // Filtros por rango de fechas
  if (filters.dateRange) {
    let dateLabel = DATE_RANGE_LABELS[filters.dateRange] || filters.dateRange
    if (filters.dateRange === 'custom' && (filters.dateFrom || filters.dateTo)) {
      const from = filters.dateFrom ? new Date(filters.dateFrom).toLocaleDateString('es-ES') : ''
      const to = filters.dateTo ? new Date(filters.dateTo).toLocaleDateString('es-ES') : ''
      dateLabel = `${from} - ${to}`
    }
    activeFilters.push({
      key: 'dateRange',
      label: dateLabel,
    })
  }
  
  // Filtros por período
  if (filters.period) {
    activeFilters.push({
      key: 'period',
      label: PERIOD_LABELS[filters.period] || filters.period,
    })
  }
  
  // Filtros por asignado
  if (filters.assignedToId !== undefined) {
    activeFilters.push({
      key: 'assignedToId',
      label: filters.assignedToId === null ? 'Sin asignar' : `Asignado a: ${filters.assignedToId}`,
    })
  }
  
  // Filtros por nivel de riesgo
  if (filters.riskLevel) {
    const riskLabels: Record<string, string> = {
      'Low': 'Bajo',
      'Medium': 'Medio',
      'High': 'Alto',
    }
    activeFilters.push({
      key: 'riskLevel',
      label: `Riesgo: ${riskLabels[filters.riskLevel] || filters.riskLevel}`,
    })
  }
  
  if (activeFilters.length === 0) {
    return null
  }
  
  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-md">
      <span className="text-sm text-muted-foreground">Filtros activos:</span>
      {activeFilters.map((filter) => (
        <Badge
          key={filter.key}
          variant="secondary"
          className="flex items-center gap-1 px-2 py-1"
        >
          <span className="text-xs">{filter.label}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 w-4 h-4 hover:bg-transparent"
            onClick={() => onRemoveFilter(filter.key)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
      {onClearAll && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs"
          onClick={onClearAll}
        >
          Limpiar todo
        </Button>
      )}
    </div>
  )
}

