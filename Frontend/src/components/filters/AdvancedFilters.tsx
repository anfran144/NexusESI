import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  Filter, 
  X, 
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Save,
  Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AdvancedFilters } from '@/hooks/useAdvancedFilters'
import { format } from 'date-fns'

interface AdvancedFiltersProps {
  filters: AdvancedFilters
  onFiltersChange: (filters: Partial<AdvancedFilters>) => void
  onClearFilters?: () => void
  committees?: Array<{ id: number; name: string }>
  statusOptions?: Array<{ value: string; label: string }>
  showCommittees?: boolean
  showStatuses?: boolean
  showDates?: boolean
  showPeriod?: boolean
  showAssignedTo?: boolean
  showRiskLevel?: boolean
  dateLabel?: string
  dateField?: 'due_date' | 'created_at' | 'start_date' | 'end_date'
  onSaveFavorite?: (name: string, filters: AdvancedFilters) => void
  favorites?: Array<{ id: string; name: string; filters: AdvancedFilters }>
  onLoadFavorite?: (filters: AdvancedFilters) => void
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

export function AdvancedFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  committees = [],
  statusOptions = DEFAULT_STATUS_OPTIONS,
  showCommittees = true,
  showStatuses = true,
  showDates = true,
  showPeriod = false,
  showAssignedTo = false,
  showRiskLevel = false,
  dateLabel = 'Fecha de vencimiento',
  dateField = 'due_date',
  onSaveFavorite,
  favorites = [],
  onLoadFavorite,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [favoriteName, setFavoriteName] = useState('')
  
  const handleCommitteeToggle = (committeeId: number) => {
    const currentIds = filters.committeeIds || []
    const newIds = currentIds.includes(committeeId)
      ? currentIds.filter(id => id !== committeeId)
      : [...currentIds, committeeId]
    onFiltersChange({ committeeIds: newIds })
  }
  
  const handleStatusToggle = (status: string) => {
    const currentStatuses = filters.statuses || []
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status]
    onFiltersChange({ statuses: newStatuses })
  }
  
  const handleExcludeStatusToggle = (status: string) => {
    const currentExcludes = filters.excludeStatuses || []
    const newExcludes = currentExcludes.includes(status)
      ? currentExcludes.filter(s => s !== status)
      : [...currentExcludes, status]
    onFiltersChange({ excludeStatuses: newExcludes })
  }
  
  const handleDateRangeChange = (value: string) => {
    if (value === 'custom') {
      onFiltersChange({ dateRange: 'custom' })
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
    filters.assignedToId !== undefined ? 1 : 0,
    filters.riskLevel ? 1 : 0,
  ].reduce((a, b) => a + b, 0)
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="relative"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtros Avanzados
          {activeFiltersCount > 0 && (
            <Badge 
              variant="secondary" 
              className="ml-2 h-5 min-w-5 px-1.5 text-xs"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] max-h-[600px] overflow-y-auto" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Filtros Avanzados</h3>
            {onClearFilters && activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onClearFilters()
                  setIsOpen(false)
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Limpiar
              </Button>
            )}
          </div>
          
          <Separator />
          
          {/* Filtros por comité */}
          {showCommittees && committees.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Comités
              </Label>
              <div className="space-y-2 max-h-[150px] overflow-y-auto border rounded-md p-2">
                {committees.map((committee) => (
                  <div key={committee.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`committee-${committee.id}`}
                      checked={filters.committeeIds?.includes(committee.id) || false}
                      onCheckedChange={() => handleCommitteeToggle(committee.id)}
                    />
                    <Label
                      htmlFor={`committee-${committee.id}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {committee.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Filtros por estado */}
          {showStatuses && (
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Estados (Incluir)
              </Label>
              <div className="space-y-2 max-h-[150px] overflow-y-auto border rounded-md p-2">
                {statusOptions.map((status) => (
                  <div key={status.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status.value}`}
                      checked={filters.statuses?.includes(status.value) || false}
                      onCheckedChange={() => handleStatusToggle(status.value)}
                    />
                    <Label
                      htmlFor={`status-${status.value}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {status.label}
                    </Label>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <X className="h-4 w-4" />
                  Estados (Excluir)
                </Label>
                <div className="space-y-2 max-h-[150px] overflow-y-auto border rounded-md p-2">
                  {statusOptions.map((status) => (
                    <div key={`exclude-${status.value}`} className="flex items-center space-x-2">
                      <Checkbox
                        id={`exclude-status-${status.value}`}
                        checked={filters.excludeStatuses?.includes(status.value) || false}
                        onCheckedChange={() => handleExcludeStatusToggle(status.value)}
                      />
                      <Label
                        htmlFor={`exclude-status-${status.value}`}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {status.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Filtros por fecha */}
          {showDates && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {dateLabel}
              </Label>
              <Select
                value={filters.dateRange || ''}
                onValueChange={handleDateRangeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rango" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_RANGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {filters.dateRange === 'custom' && (
                <div className="space-y-2 pt-2">
                  <Label className="text-sm font-medium">Rango de fechas personalizado</Label>
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
              )}
            </div>
          )}
          
          {/* Filtros por período (para eventos) */}
          {showPeriod && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Período del evento
              </Label>
              <Select
                value={filters.period || ''}
                onValueChange={(value) => 
                  onFiltersChange({ period: value as AdvancedFilters['period'] })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar período" />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Filtros favoritos */}
          {favorites.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>Filtros Guardados</Label>
                <div className="space-y-1">
                  {favorites.map((favorite) => (
                    <Button
                      key={favorite.id}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        if (onLoadFavorite) {
                          onLoadFavorite(favorite.filters)
                        }
                      }}
                    >
                      {favorite.name}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}
          
          {/* Guardar filtro favorito */}
          {onSaveFavorite && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>Guardar como favorito</Label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nombre del filtro"
                    value={favoriteName}
                    onChange={(e) => setFavoriteName(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (favoriteName && activeFiltersCount > 0) {
                        onSaveFavorite(favoriteName, filters)
                        setFavoriteName('')
                      }
                    }}
                    disabled={!favoriteName || activeFiltersCount === 0}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
          
          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1"
              onClick={() => setIsOpen(false)}
            >
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

