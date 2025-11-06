import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CalendarIcon, Loader2, RefreshCw, Search } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useAuthStore } from '@/stores/auth-store'
import { eventService } from '@/services/event.service'
import { toast } from 'sonner'
import type { Event } from '@/services/event.service'

const eventSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255, 'El nombre es muy largo'),
  description: z.string().min(1, 'La descripción es requerida'),
  start_date: z.date({ message: 'La fecha de inicio es requerida' }),
  end_date: z.date({ message: 'La fecha de fin es requerida' }),
  status: z.enum(['activo', 'inactivo', 'finalizado']),
  institution_id: z.string().min(1, 'La institución es requerida'),
}).refine((data) => data.end_date >= data.start_date, {
  message: 'La fecha de fin debe ser posterior a la fecha de inicio',
  path: ['end_date'],
})

type EventFormData = z.infer<typeof eventSchema>

interface EventFormProps {
  event?: any
  onSubmit: (data: EventFormData) => Promise<void>
  onCancel: () => void
}

export function EventForm({ event, onSubmit, onCancel }: EventFormProps) {
  const [loading, setLoading] = useState(false)
  const [reuseDialogOpen, setReuseDialogOpen] = useState(false)
  const [finishedEvents, setFinishedEvents] = useState<Event[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { user } = useAuthStore()

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: event?.name || '',
      description: event?.description || '',
      start_date: event?.start_date ? new Date(event.start_date) : undefined,
      end_date: event?.end_date ? new Date(event.end_date) : undefined,
      status: event?.status || 'inactivo',
      institution_id: user?.institution_id?.toString() || '',
    },
  })

  // Establecer la institución del usuario cuando se carga el componente
  useEffect(() => {
    if (user?.institution_id && !event) {
      form.setValue('institution_id', user.institution_id.toString())
    }
  }, [user, event, form])

  // Cargar eventos finalizados cuando se abre el diálogo
  useEffect(() => {
    if (reuseDialogOpen && !event) {
      loadFinishedEvents()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reuseDialogOpen, event])

  const loadFinishedEvents = async () => {
    try {
      setLoadingEvents(true)
      const response = await eventService.getFinishedSimilarEvents(searchQuery)
      if (response.success) {
        setFinishedEvents(response.data)
      }
    } catch (error) {
      console.error('Error al cargar eventos finalizados:', error)
      toast.error('Error al cargar eventos finalizados')
    } finally {
      setLoadingEvents(false)
    }
  }

  const handleReuseEvent = async (selectedEvent: Event) => {
    try {
      setLoadingEvents(true)
      const response = await eventService.getEventDataForReuse(selectedEvent.id)
      
      if (response.success && response.data) {
        const { event: eventData, committees, tasks } = response.data
        
        // Pre-llenar el formulario con los datos del evento
        form.setValue('name', eventData.name)
        form.setValue('description', eventData.description)
        
        toast.success(`Datos del evento "${selectedEvent.name}" cargados. Puedes ajustar la información según sea necesario.`)
        setReuseDialogOpen(false)
      }
    } catch (error) {
      console.error('Error al reutilizar datos del evento:', error)
      toast.error('Error al cargar los datos del evento')
    } finally {
      setLoadingEvents(false)
    }
  }

  const handleSubmit = async (data: EventFormData) => {
    try {
      setLoading(true)
      await onSubmit(data)
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {!event && (
          <div className="flex justify-end">
            <Dialog open={reuseDialogOpen} onOpenChange={setReuseDialogOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reutilizar datos de evento anterior
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Reutilizar datos de evento finalizado</DialogTitle>
                  <DialogDescription>
                    Selecciona un evento finalizado para reutilizar su información (comités, tareas, etc.)
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar eventos finalizados..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            loadFinishedEvents()
                          }
                        }}
                        className="pl-10"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={loadFinishedEvents}
                      disabled={loadingEvents}
                    >
                      {loadingEvents ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
                    </Button>
                  </div>
                  
                  {loadingEvents ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : finishedEvents.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No se encontraron eventos finalizados
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {finishedEvents.map((finishedEvent) => (
                        <div
                          key={finishedEvent.id}
                          className="border rounded-lg p-4 hover:bg-accent cursor-pointer transition-colors"
                          onClick={() => handleReuseEvent(finishedEvent)}
                        >
                          <div className="font-semibold">{finishedEvent.name}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {finishedEvent.description?.substring(0, 100)}...
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">
                            {format(new Date(finishedEvent.start_date), 'PPP', { locale: es })} - {format(new Date(finishedEvent.end_date), 'PPP', { locale: es })}
                          </div>
                          {finishedEvent.committees && finishedEvent.committees.length > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {finishedEvent.committees.length} comité(s) · {finishedEvent.tasks?.length || 0} tarea(s)
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Evento</FormLabel>
              <FormControl>
                <Input placeholder="Ingresa el nombre del evento" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe el evento..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha de Inicio</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP', { locale: es })
                        ) : (
                          <span>Selecciona una fecha</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      defaultMonth={field.value}
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => {
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        const dateToCompare = new Date(date)
                        dateToCompare.setHours(0, 0, 0, 0)
                        return dateToCompare < today
                      }}
                      className="rounded-lg border shadow-sm"
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => {
              const startDate = form.watch('start_date')
              return (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de Fin</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP', { locale: es })
                          ) : (
                            <span>Selecciona una fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        defaultMonth={field.value}
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => {
                          const today = new Date()
                          today.setHours(0, 0, 0, 0)
                          const dateToCompare = new Date(date)
                          dateToCompare.setHours(0, 0, 0, 0)
                          // Deshabilitar fechas antes de hoy
                          if (dateToCompare < today) return true
                          // Si hay fecha de inicio, deshabilitar fechas antes de ella
                          if (startDate) {
                            const start = new Date(startDate)
                            start.setHours(0, 0, 0, 0)
                            return dateToCompare < start
                          }
                          return false
                        }}
                        className="rounded-lg border shadow-sm"
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )
            }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                    <SelectItem value="finalizado">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="institution_id"
            render={() => (
              <FormItem>
                <FormLabel>Institución</FormLabel>
                <FormControl>
                  <Input 
                    value={user?.institution?.nombre || 'Institución no disponible'} 
                    disabled 
                    className="bg-muted"
                  />
                </FormControl>
                <FormDescription>
                  Los eventos solo pueden crearse para tu institución
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {event ? 'Actualizar' : 'Crear'} Evento
          </Button>
        </div>
      </form>
    </Form>
  )
}