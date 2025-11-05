import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { DatePicker } from '@/components/ui/date-picker'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { type DateRange } from 'react-day-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CheckIcon,
  X,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  FilterX,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AdvancedFilters } from '@/hooks/useAdvancedFilters'
import { format } from 'date-fns'

interface FiltersBarProps {
  filters: AdvancedFilters
  onFiltersChange: (filters: Partial<AdvancedFilters>) => void
  onClearFilters?: () => void
  committees?: Array<{ id: number; name: string }>
  statusOptions?: Array<{ value: string; label: string }>
  members?: Array<{ id: number; name: string; email?: string }>
  showCommittees?: boolean
  showStatuses?: boolean
  showDates?: boolean
  showPeriod?: boolean
  showAssignedTo?: boolean
  dateLabel?: string
  resultsCount?: number
  totalCount?: number
  // Para limitar fechas al rango del evento
  eventStartDate?: string
  eventEndDate?: string
}

const DEFAULT_STATUS_OPTIONS = [
  { value: 'Pending', label: 'Pendiente' },
  { value: 'InProgress', label: 'En Progreso' },
  { value: 'Completed', label: 'Completada' },
  { value: 'Delayed', label: 'Retrasada' },
  { value: 'Paused', label: 'Pausada' },
]

const DATE_RANGE_OPTIONS = [
  { value: 'today', label: 'Hoy' },
  { value: 'this-week', label: 'Esta semana' },
  { value: 'this-month', label: 'Este mes' },
  { value: 'last-week', label: 'Semana pasada' },
  { value: 'last-month', label: 'Mes pasado' },
  { value: 'overdue', label: 'Atrasadas' },
  { value: 'custom', label: 'Rango personalizado' },
]

const PERIOD_OPTIONS = [
  { value: 'active', label: 'Activos' },
  { value: 'upcoming', label: 'Próximos' },
  { value: 'past', label: 'Pasados' },
  { value: 'this-month', label: 'Este mes' },
  { value: 'next-month', label: 'Próximo mes' },
]

/**
 * FiltersBar - Componente de filtros que cumple con ISO 9241-110
 * 
 * Principios ISO implementados:
 * - Visibilidad del estado: Filtros activos siempre visibles
 * - Adecuación a la tarea: Filtros organizados lógicamente
 * - Control del usuario: Aplicación inmediata, sin botón "Aplicar"
 * - Prevención de errores: Feedback visual inmediato
 * - Capacidad de aprendizaje: Iconos intuitivos y etiquetas claras
 */
export function FiltersBar({
  filters,
  onFiltersChange,
  onClearFilters,
  committees = [],
  statusOptions = DEFAULT_STATUS_OPTIONS,
  members = [],
  showCommittees = true,
  showStatuses = true,
  showDates = true,
  showPeriod = false,
  showAssignedTo = false,
  dateLabel = 'Fecha de vencimiento',
  resultsCount,
  totalCount,
  eventStartDate,
  eventEndDate,
}: FiltersBarProps) {
  const handleCommitteeToggle = (committeeId: number) => {
    const currentIds = filters.committeeIds || []
    const newIds = currentIds.includes(committeeId)
      ? currentIds.filter(id => id !== committeeId)
      : [...currentIds, committeeId]
    onFiltersChange({ committeeIds: newIds })
  }

  const handleStatusToggle = (status: string, isExclude = false) => {
    if (isExclude) {
      // Si está en includes, quitarlo primero
      const currentStatuses = filters.statuses || []
      const newStatuses = currentStatuses.filter(s => s !== status)
      
      const currentExcludes = filters.excludeStatuses || []
      const newExcludes = currentExcludes.includes(status)
        ? currentExcludes.filter(s => s !== status)
        : [...currentExcludes, status]
      
      onFiltersChange({ 
        statuses: newStatuses.length > 0 ? newStatuses : undefined,
        excludeStatuses: newExcludes.length > 0 ? newExcludes : undefined
      })
    } else {
      // Si está en excludes, quitarlo primero
      const currentExcludes = filters.excludeStatuses || []
      const newExcludes = currentExcludes.filter(s => s !== status)
      
      const currentStatuses = filters.statuses || []
      const newStatuses = currentStatuses.includes(status)
        ? currentStatuses.filter(s => s !== status)
        : [...currentStatuses, status]
      
      onFiltersChange({ 
        statuses: newStatuses.length > 0 ? newStatuses : undefined,
        excludeStatuses: newExcludes.length > 0 ? newExcludes : undefined
      })
    }
  }

  const handleDateRangeChange = (value: string) => {
    if (value === 'custom') {
      onFiltersChange({ dateRange: 'custom' })
    } else if (value === 'none') {
      onFiltersChange({ 
        dateRange: undefined,
        dateFrom: undefined,
        dateTo: undefined,
      })
    } else {
      onFiltersChange({ 
        dateRange: value as AdvancedFilters['dateRange'],
        dateFrom: undefined,
        dateTo: undefined,
      })
    }
  }

  const activeFiltersCount = [
    filters.committeeIds?.length || 0,
    filters.statuses?.length || 0,
    filters.excludeStatuses?.length || 0,
    filters.dateRange ? 1 : 0,
    filters.dateFrom || filters.dateTo ? 1 : 0,
    filters.period ? 1 : 0,
    filters.assignedToId ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

  const hasActiveFilters = activeFiltersCount > 0

  // Calcular texto de rango de fechas
  const getDateRangeLabel = () => {
    if (filters.dateRange === 'custom') {
      if (filters.dateFrom && filters.dateTo) {
        return `${format(new Date(filters.dateFrom), 'dd/MM')} - ${format(new Date(filters.dateTo), 'dd/MM')}`
      }
      if (filters.dateFrom) return `Desde ${format(new Date(filters.dateFrom), 'dd/MM')}`
      if (filters.dateTo) return `Hasta ${format(new Date(filters.dateTo), 'dd/MM')}`
      return 'Personalizado'
    }
    const option = DATE_RANGE_OPTIONS.find(opt => opt.value === filters.dateRange)
    return option?.label || ''
  }

  return (
    <div className="space-y-3" role="region" aria-label="Filtros de búsqueda">
      {/* Barra principal de filtros - SIEMPRE VISIBLE */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/30 rounded-lg border">
        {/* Contador de resultados - PRINCIPIO ISO: Visibilidad del estado */}
        {resultsCount !== undefined && totalCount !== undefined && (
          <>
            <div 
              className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-md border text-sm"
              role="status"
              aria-live="polite"
            >
              <span className="font-medium">
                Mostrando <strong>{resultsCount}</strong> de <strong>{totalCount}</strong>
              </span>
            </div>
            <Separator orientation="vertical" className="h-6" />
          </>
        )}

        {/* Filtro: Comités - VISIBLE con badges */}
        {showCommittees && committees.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9"
                aria-label="Filtrar por comités"
              >
                <Users className="h-4 w-4 mr-2" />
                Comités
                {filters.committeeIds && filters.committeeIds.length > 0 && (
                  <>
                    <Separator orientation="vertical" className="mx-2 h-4" />
                    <Badge variant="secondary" className="rounded-sm px-1.5 font-normal">
                      {filters.committeeIds.length}
                      <span className="ml-1 hidden sm:inline">
                        {filters.committeeIds.length === 1 ? 'seleccionado' : 'seleccionados'}
                      </span>
                    </Badge>
                  </>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar comité..." />
                <CommandList>
                  <CommandEmpty>No se encontraron comités.</CommandEmpty>
                  <CommandGroup>
                    {committees.map((committee) => {
                      const isSelected = filters.committeeIds?.includes(committee.id) || false
                      return (
                        <CommandItem
                          key={committee.id}
                          onSelect={() => handleCommitteeToggle(committee.id)}
                          className="cursor-pointer"
                        >
                          <div
                            className={cn(
                              'flex h-4 w-4 items-center justify-center rounded-sm border mr-2',
                              isSelected
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'opacity-50 [&_svg]:invisible'
                            )}
                          >
                            <CheckIcon className="h-4 w-4" />
                          </div>
                          <span>{committee.name}</span>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                  {filters.committeeIds && filters.committeeIds.length > 0 && (
                    <>
                      <CommandSeparator />
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => onFiltersChange({ committeeIds: [] })}
                          className="justify-center text-center cursor-pointer"
                        >
                          Limpiar selección
                        </CommandItem>
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}

        {/* Filtro: Estados - VISIBLE con badges */}
        {showStatuses && (
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9"
                aria-label="Filtrar por estados"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Estados
                {((filters.statuses?.length || 0) + (filters.excludeStatuses?.length || 0)) > 0 && (
                  <>
                    <Separator orientation="vertical" className="mx-2 h-4" />
                    <Badge variant="secondary" className="rounded-sm px-1.5 font-normal">
                      {(filters.statuses?.length || 0) + (filters.excludeStatuses?.length || 0)}
                    </Badge>
                  </>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar estado..." />
                <CommandList>
                  <CommandEmpty>No se encontraron estados.</CommandEmpty>
                  <CommandGroup heading="Incluir">
                    {statusOptions.map((status) => {
                      const isSelected = filters.statuses?.includes(status.value) || false
                      const isExcluded = filters.excludeStatuses?.includes(status.value) || false
                      const isDisabled = isExcluded // Deshabilitar si está en excluir
                      
                      return (
                        <CommandItem
                          key={`include-${status.value}`}
                          value={`include-${status.value}-${status.label}`}
                          onSelect={() => !isDisabled && handleStatusToggle(status.value, false)}
                          className={cn(
                            "cursor-pointer",
                            isDisabled && "opacity-50 cursor-not-allowed"
                          )}
                          disabled={isDisabled}
                        >
                          <div
                            className={cn(
                              'flex h-4 w-4 items-center justify-center rounded-sm border mr-2',
                              isSelected
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'opacity-50 [&_svg]:invisible'
                            )}
                          >
                            <CheckIcon className="h-4 w-4" />
                          </div>
                          <span>{status.label}</span>
                          {isExcluded && (
                            <span className="ml-auto text-xs text-muted-foreground">(excluido)</span>
                          )}
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup heading="Excluir">
                    {statusOptions.map((status) => {
                      const isSelected = filters.excludeStatuses?.includes(status.value) || false
                      const isIncluded = filters.statuses?.includes(status.value) || false
                      const isDisabled = isIncluded // Deshabilitar si está en incluir
                      
                      return (
                        <CommandItem
                          key={`exclude-${status.value}`}
                          value={`exclude-${status.value}-${status.label}`}
                          onSelect={() => !isDisabled && handleStatusToggle(status.value, true)}
                          className={cn(
                            "cursor-pointer",
                            isDisabled && "opacity-50 cursor-not-allowed"
                          )}
                          disabled={isDisabled}
                        >
                          <div
                            className={cn(
                              'flex h-4 w-4 items-center justify-center rounded-sm border mr-2',
                              isSelected
                                ? 'bg-destructive text-destructive-foreground border-destructive'
                                : 'opacity-50 [&_svg]:invisible'
                            )}
                          >
                            <X className="h-3 w-3" />
                          </div>
                          <span>{status.label}</span>
                          {isIncluded && (
                            <span className="ml-auto text-xs text-muted-foreground">(incluido)</span>
                          )}
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                  {((filters.statuses?.length || 0) + (filters.excludeStatuses?.length || 0)) > 0 && (
                    <>
                      <CommandSeparator />
                      <CommandGroup>
                        <CommandItem
                          onSelect={() => onFiltersChange({ statuses: [], excludeStatuses: [] })}
                          className="justify-center text-center cursor-pointer"
                        >
                          Limpiar selección
                        </CommandItem>
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}

        {/* Filtro: Fechas - VISIBLE con badge */}
        {showDates && (
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9"
                aria-label="Filtrar por fecha"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {dateLabel}
                {filters.dateRange && (
                  <>
                    <Separator orientation="vertical" className="mx-2 h-4" />
                    <Badge variant="secondary" className="rounded-sm px-1.5 font-normal">
                      {getDateRangeLabel()}
                    </Badge>
                  </>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] max-h-[90vh] overflow-y-auto" align="start">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rango de fechas</label>
                  <div className="space-y-2">
                    <Select
                      value={filters.dateRange || 'none'}
                      onValueChange={handleDateRangeChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar rango" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin filtro</SelectItem>
                        {DATE_RANGE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {filters.dateRange === 'custom' && (
                  <div className="space-y-3 pt-2 border-t">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Rango de fechas personalizado</label>
                      <DateRangePicker
                        range={{
                          from: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
                          to: filters.dateTo ? new Date(filters.dateTo) : undefined,
                        }}
                        onSelect={(range) => {
                          onFiltersChange({
                            dateFrom: range?.from ? format(range.from, 'yyyy-MM-dd') : undefined,
                            dateTo: range?.to ? format(range.to, 'yyyy-MM-dd') : undefined,
                          })
                        }}
                        placeholder="Seleccionar rango de fechas"
                      />
                    </div>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Filtro: Responsable/Líder - VISIBLE con badge */}
        {showAssignedTo && members.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9"
                aria-label="Filtrar por responsable"
              >
                <Users className="h-4 w-4 mr-2" />
                Responsable
                {filters.assignedToId && (
                  <>
                    <Separator orientation="vertical" className="mx-2 h-4" />
                    <Badge variant="secondary" className="rounded-sm px-1.5 font-normal">
                      {members.find(m => m.id === filters.assignedToId)?.name || 'Seleccionado'}
                    </Badge>
                  </>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Buscar responsable..." />
                <CommandList>
                  <CommandEmpty>No se encontraron responsables.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => onFiltersChange({ assignedToId: undefined })}
                      className="cursor-pointer"
                    >
                      <div className="flex h-4 w-4 items-center justify-center rounded-sm border mr-2 opacity-50 [&_svg]:invisible">
                        <CheckIcon className="h-4 w-4" />
                      </div>
                      <span>Sin filtro</span>
                    </CommandItem>
                    {members.map((member) => {
                      const isSelected = filters.assignedToId === member.id
                      return (
                        <CommandItem
                          key={member.id}
                          onSelect={() => onFiltersChange({ assignedToId: isSelected ? undefined : member.id })}
                          className="cursor-pointer"
                        >
                          <div
                            className={cn(
                              'flex h-4 w-4 items-center justify-center rounded-sm border mr-2',
                              isSelected
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'opacity-50 [&_svg]:invisible'
                            )}
                          >
                            <CheckIcon className="h-4 w-4" />
                          </div>
                          <span>{member.name}</span>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}

        {/* Filtro: Período (para eventos) */}
        {showPeriod && (
          <Select
            value={filters.period || 'none'}
            onValueChange={(value) => 
              onFiltersChange({ 
                period: value === 'none' ? undefined : (value as AdvancedFilters['period'])
              })
            }
          >
            <SelectTrigger className="h-9 w-[180px]">
              <Clock className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin filtro</SelectItem>
              {PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Botón limpiar - VISIBLE cuando hay filtros activos */}
        {hasActiveFilters && onClearFilters && (
          <>
            <Separator orientation="vertical" className="h-6" />
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-9"
              aria-label="Limpiar todos los filtros"
            >
              <FilterX className="h-4 w-4 mr-2" />
              Limpiar filtros
            </Button>
          </>
        )}
      </div>

      {/* Badges de filtros activos - SIEMPRE VISIBLES cuando hay filtros */}
      {hasActiveFilters && (
        <div 
          className="flex flex-wrap items-center gap-2 px-3 py-2 bg-muted/50 rounded-md border"
          role="list"
          aria-label="Filtros activos"
        >
          <span className="text-xs text-muted-foreground font-medium">Filtros activos:</span>
          
          {/* Comités seleccionados */}
          {filters.committeeIds && filters.committeeIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5" role="listitem">
              {committees
                .filter(c => filters.committeeIds?.includes(c.id))
                .map((committee) => (
                  <Badge
                    key={committee.id}
                    variant="secondary"
                    className="flex items-center gap-1 px-2 py-0.5"
                  >
                    <Users className="h-3 w-3" />
                    {committee.name}
                    <button
                      onClick={() => handleCommitteeToggle(committee.id)}
                      className="ml-1 rounded-full hover:bg-destructive/20 p-0.5"
                      aria-label={`Quitar filtro de comité ${committee.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
            </div>
          )}

          {/* Estados incluidos */}
          {filters.statuses && filters.statuses.length > 0 && (
            <div className="flex flex-wrap gap-1.5" role="listitem">
              {statusOptions
                .filter(s => filters.statuses?.includes(s.value))
                .map((status) => (
                  <Badge
                    key={status.value}
                    variant="secondary"
                    className="flex items-center gap-1 px-2 py-0.5"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    {status.label}
                    <button
                      onClick={() => handleStatusToggle(status.value, false)}
                      className="ml-1 rounded-full hover:bg-destructive/20 p-0.5"
                      aria-label={`Quitar filtro de estado ${status.label}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
            </div>
          )}

          {/* Estados excluidos */}
          {filters.excludeStatuses && filters.excludeStatuses.length > 0 && (
            <div className="flex flex-wrap gap-1.5" role="listitem">
              {statusOptions
                .filter(s => filters.excludeStatuses?.includes(s.value))
                .map((status) => (
                  <Badge
                    key={`exclude-${status.value}`}
                    variant="destructive"
                    className="flex items-center gap-1 px-2 py-0.5"
                  >
                    <X className="h-3 w-3" />
                    Excluir: {status.label}
                    <button
                      onClick={() => handleStatusToggle(status.value, true)}
                      className="ml-1 rounded-full hover:bg-destructive/20 p-0.5"
                      aria-label={`Quitar exclusión de estado ${status.label}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
            </div>
          )}

          {/* Filtro de fecha */}
          {filters.dateRange && (
            <Badge
              variant="secondary"
              className="flex items-center gap-1 px-2 py-0.5"
              role="listitem"
            >
              <Calendar className="h-3 w-3" />
              {getDateRangeLabel()}
              <button
                onClick={() => handleDateRangeChange('none')}
                className="ml-1 rounded-full hover:bg-destructive/20 p-0.5"
                aria-label="Quitar filtro de fecha"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {/* Filtro de responsable */}
          {filters.assignedToId && (
            <Badge
              variant="secondary"
              className="flex items-center gap-1 px-2 py-0.5"
              role="listitem"
            >
              <Users className="h-3 w-3" />
              {members.find(m => m.id === filters.assignedToId)?.name || 'Responsable'}
              <button
                onClick={() => onFiltersChange({ assignedToId: undefined })}
                className="ml-1 rounded-full hover:bg-destructive/20 p-0.5"
                aria-label="Quitar filtro de responsable"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

