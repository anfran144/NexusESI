import { useState } from 'react'
import { Users, FolderKanban, CheckSquare, Search, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ReusableParticipant {
  id: number
  name: string
  email: string
  institution: string | null
  is_available: boolean
  active_event: {
    id: number
    name: string
  } | null
}

interface ReusableCommittee {
  id: number
  name: string
  description: string | null
}

interface ReusableTask {
  id: number
  title: string
  description: string | null
}

interface ReuseDataSelectorProps {
  summary: {
    participants_count: number
    committees_count: number
    tasks_count: number
  }
  participants: ReusableParticipant[]
  committees: ReusableCommittee[]
  tasks: ReusableTask[]
  selectedParticipants: number[]
  selectedCommittees: number[]
  selectedTasks: number[]
  onParticipantsChange: (ids: number[]) => void
  onCommitteesChange: (ids: number[]) => void
  onTasksChange: (ids: number[]) => void
}

export function ReuseDataSelector({
  summary,
  participants,
  committees,
  tasks,
  selectedParticipants,
  selectedCommittees,
  selectedTasks,
  onParticipantsChange,
  onCommitteesChange,
  onTasksChange,
}: ReuseDataSelectorProps) {
  const [searchParticipants, setSearchParticipants] = useState('')
  const [searchCommittees, setSearchCommittees] = useState('')
  const [searchTasks, setSearchTasks] = useState('')
  const [activeTab, setActiveTab] = useState('participants')

  // Filtros de búsqueda
  const filteredParticipants = participants.filter((p) =>
    p.name.toLowerCase().includes(searchParticipants.toLowerCase()) ||
    p.email.toLowerCase().includes(searchParticipants.toLowerCase())
  )

  const filteredCommittees = committees.filter((c) =>
    c.name.toLowerCase().includes(searchCommittees.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchCommittees.toLowerCase()))
  )

  const filteredTasks = tasks.filter((t) =>
    t.title.toLowerCase().includes(searchTasks.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(searchTasks.toLowerCase()))
  )

  const handleSelectAll = (section: 'participants' | 'committees' | 'tasks') => {
    if (section === 'participants') {
      const filtered = filteredParticipants.map((p) => p.id)
      const allSelected = filtered.every((id) => selectedParticipants.includes(id))
      onParticipantsChange(allSelected ? [] : filtered)
    } else if (section === 'committees') {
      const filtered = filteredCommittees.map((c) => c.id)
      const allSelected = filtered.every((id) => selectedCommittees.includes(id))
      onCommitteesChange(allSelected ? [] : filtered)
    } else if (section === 'tasks') {
      const filtered = filteredTasks.map((t) => t.id)
      const allSelected = filtered.every((id) => selectedTasks.includes(id))
      onTasksChange(allSelected ? [] : filtered)
    }
  }

  const handleToggleItem = (
    section: 'participants' | 'committees' | 'tasks',
    id: number
  ) => {
    if (section === 'participants') {
      const newSelection = selectedParticipants.includes(id)
        ? selectedParticipants.filter((pid) => pid !== id)
        : [...selectedParticipants, id]
      onParticipantsChange(newSelection)
    } else if (section === 'committees') {
      const newSelection = selectedCommittees.includes(id)
        ? selectedCommittees.filter((cid) => cid !== id)
        : [...selectedCommittees, id]
      onCommitteesChange(newSelection)
    } else if (section === 'tasks') {
      const newSelection = selectedTasks.includes(id)
        ? selectedTasks.filter((tid) => tid !== id)
        : [...selectedTasks, id]
      onTasksChange(newSelection)
    }
  }

  const totalSelected = selectedParticipants.length + selectedCommittees.length + selectedTasks.length

  return (
    <div className="space-y-4">
        {/* Resumen visible siempre - Heurística 1: Visibilidad del estado */}
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Resumen de selección</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Los comités se crearán vacíos. Las tareas se crearán sin comité asignado y con la fecha de fin del evento.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            {totalSelected > 0 && (
              <Badge variant="default" className="text-sm">
                {totalSelected} elemento{totalSelected !== 1 ? 's' : ''} seleccionado{totalSelected !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Participantes:</span>
              <span className={cn(
                "font-medium",
                selectedParticipants.length > 0 ? "text-primary" : "text-muted-foreground"
              )}>
                {selectedParticipants.length} / {participants.filter((p) => p.is_available).length} disponibles
              </span>
              {participants.filter((p) => !p.is_available).length > 0 && (
                <span className="text-xs text-destructive">
                  ({participants.filter((p) => !p.is_available).length} no disponibles)
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Comités:</span>
              <span className={cn(
                "font-medium",
                selectedCommittees.length > 0 ? "text-primary" : "text-muted-foreground"
              )}>
                {selectedCommittees.length} / {summary.committees_count}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Tareas:</span>
              <span className={cn(
                "font-medium",
                selectedTasks.length > 0 ? "text-primary" : "text-muted-foreground"
              )}>
                {selectedTasks.length} / {summary.tasks_count}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs en lugar de acordeones - Heurística 4: Consistencia, 8: Diseño minimalista */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="participants" className="relative">
              <Users className="h-4 w-4 mr-2" />
              Participantes
              {selectedParticipants.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1.5 text-xs">
                  {selectedParticipants.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="committees" className="relative">
              <FolderKanban className="h-4 w-4 mr-2" />
              Comités
              {selectedCommittees.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1.5 text-xs">
                  {selectedCommittees.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="tasks" className="relative">
              <CheckSquare className="h-4 w-4 mr-2" />
              Tareas
              {selectedTasks.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1.5 text-xs">
                  {selectedTasks.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab de Participantes */}
          <TabsContent value="participants" className="space-y-3 mt-4">
            {summary.participants_count === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hay participantes en este evento</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar participantes..."
                      value={searchParticipants}
                      onChange={(e) => setSearchParticipants(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectAll('participants')}
                  >
                    {filteredParticipants.every((p) => selectedParticipants.includes(p.id))
                      ? 'Deseleccionar'
                      : 'Seleccionar todos'}
                  </Button>
                </div>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-2">
                    {filteredParticipants.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No se encontraron participantes
                      </p>
                    ) : (
                      filteredParticipants.map((participant) => {
                        const isSelected = selectedParticipants.includes(participant.id)
                        const isUnavailable = !participant.is_available
                        
                        return (
                          <div
                            key={participant.id}
                            className={cn(
                              'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                              isUnavailable && 'opacity-60 cursor-not-allowed',
                              !isUnavailable && 'cursor-pointer',
                              isSelected && !isUnavailable
                                ? 'border-primary bg-primary/5'
                                : isUnavailable
                                ? 'border-destructive/20 bg-destructive/5'
                                : 'border-border hover:bg-accent'
                            )}
                            onClick={() => !isUnavailable && handleToggleItem('participants', participant.id)}
                          >
                            <Checkbox
                              checked={isSelected}
                              disabled={isUnavailable}
                              onCheckedChange={() => !isUnavailable && handleToggleItem('participants', participant.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-medium">{participant.name}</div>
                                {isUnavailable && (
                                  <Badge variant="destructive" className="text-xs">
                                    No disponible
                                  </Badge>
                                )}
                                {isSelected && !isUnavailable && (
                                  <Badge variant="default" className="text-xs">
                                    Seleccionado
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {participant.email}
                              </div>
                              {participant.institution && (
                                <div className="text-xs text-muted-foreground">
                                  {participant.institution}
                                </div>
                              )}
                              {isUnavailable && participant.active_event && (
                                <div className="text-xs text-destructive mt-1">
                                  Activo en: {participant.active_event.name}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </ScrollArea>
              </>
            )}
          </TabsContent>

          {/* Tab de Comités */}
          <TabsContent value="committees" className="space-y-3 mt-4">
            {summary.committees_count === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FolderKanban className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hay comités en este evento</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar comités..."
                      value={searchCommittees}
                      onChange={(e) => setSearchCommittees(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectAll('committees')}
                  >
                    {filteredCommittees.every((c) => selectedCommittees.includes(c.id))
                      ? 'Deseleccionar'
                      : 'Seleccionar todos'}
                  </Button>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-xs text-blue-900 dark:text-blue-100">
                    <Info className="h-3 w-3 inline mr-1" />
                    Los comités se crearán vacíos (sin miembros). Podrás asignar miembros después.
                  </p>
                </div>
                <ScrollArea className="h-[350px] pr-4">
                  <div className="space-y-2">
                    {filteredCommittees.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No se encontraron comités
                      </p>
                    ) : (
                      filteredCommittees.map((committee) => (
                        <div
                          key={committee.id}
                          className={cn(
                            'flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
                            selectedCommittees.includes(committee.id)
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:bg-accent'
                          )}
                          onClick={() => handleToggleItem('committees', committee.id)}
                        >
                          <Checkbox
                            checked={selectedCommittees.includes(committee.id)}
                            onCheckedChange={() => handleToggleItem('committees', committee.id)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium">{committee.name}</div>
                              <Badge variant="outline" className="text-xs">
                                Vacío
                              </Badge>
                            </div>
                            {committee.description && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {committee.description}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </>
            )}
          </TabsContent>

          {/* Tab de Tareas */}
          <TabsContent value="tasks" className="space-y-3 mt-4">
            {summary.tasks_count === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hay tareas en este evento</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar tareas..."
                      value={searchTasks}
                      onChange={(e) => setSearchTasks(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectAll('tasks')}
                  >
                    {filteredTasks.every((t) => selectedTasks.includes(t.id))
                      ? 'Deseleccionar'
                      : 'Seleccionar todos'}
                  </Button>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-xs text-amber-900 dark:text-amber-100">
                    <Info className="h-3 w-3 inline mr-1" />
                    Las tareas se crearán sin comité asignado. Se usará la fecha de fin del evento como fecha de vencimiento (podrás ajustarla después).
                  </p>
                </div>
                <ScrollArea className="h-[350px] pr-4">
                  <div className="space-y-2">
                    {filteredTasks.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No se encontraron tareas
                      </p>
                    ) : (
                      filteredTasks.map((task) => (
                        <div
                          key={task.id}
                          className={cn(
                            'flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
                            selectedTasks.includes(task.id)
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:bg-accent'
                          )}
                          onClick={() => handleToggleItem('tasks', task.id)}
                        >
                          <Checkbox
                            checked={selectedTasks.includes(task.id)}
                            onCheckedChange={() => handleToggleItem('tasks', task.id)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="text-sm font-medium">{task.title}</div>
                              <Badge variant="outline" className="text-xs">
                                Sin comité
                              </Badge>
                            </div>
                            {task.description && (
                              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {task.description}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
  )
}
