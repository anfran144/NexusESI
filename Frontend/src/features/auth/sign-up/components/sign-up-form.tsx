import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, Check, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuthStore } from '@/stores/auth-store'
import { useLocationData } from '@/hooks/useLocationData'
import { usePasswordStrength } from '@/hooks/usePasswordStrength'
import { cn } from '@/lib/utils'

const formSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Ingresa un correo electrónico válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  password_confirmation: z.string(),
  pais_id: z.number({ message: 'Selecciona un país' }).optional(),
  estado_id: z.number({ message: 'Selecciona un estado' }).optional(),
  ciudad_id: z.number({ message: 'Selecciona una ciudad' }).optional(),
  institution_id: z.number({ message: 'Selecciona una institución' }).optional(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'Debes aceptar los términos y condiciones',
  }),
})
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Las contraseñas no coinciden',
    path: ['password_confirmation'],
  })

export function SignUpForm({
  className,
  ...props
}: React.HTMLAttributes<HTMLFormElement>) {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false)
  const navigate = useNavigate()
  const { register } = useAuthStore()
  const { paisesQuery, useEstadosByPais, useCiudadesByEstado, useInstitucionesByCiudad } = useLocationData()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange', // Habilita validación en tiempo real
    defaultValues: {
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      pais_id: undefined,
      estado_id: undefined,
      ciudad_id: undefined,
      institution_id: undefined,
      acceptTerms: false,
    },
  })

  // Obtener valores actuales para las queries dependientes y validación
  const paisId = form.watch('pais_id')
  const estadoId = form.watch('estado_id')
  const ciudadId = form.watch('ciudad_id')
  const password = form.watch('password')
  const passwordConfirmation = form.watch('password_confirmation')
  
  // Hook para evaluar fortaleza de contraseña
  const passwordStrength = usePasswordStrength(password)

  // Queries dependientes
  const estadosQuery = useEstadosByPais(paisId ?? null)
  const ciudadesQuery = useCiudadesByEstado(estadoId ?? null)
  const institucionesQuery = useInstitucionesByCiudad(ciudadId ?? null)

  // Validación individual de cada campo obligatorio
  const isFormValid = useMemo(() => {
    const formValues = form.getValues()
    const formErrors = form.formState.errors
    
    // Verificar que no hay errores en ningún campo
    const hasNoErrors = Object.keys(formErrors).length === 0
    
    // Verificar que todos los campos obligatorios están completados
    const isNameValid = formValues.name && formValues.name.trim().length >= 2
    const isEmailValid = formValues.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email)
    const isPasswordValid = formValues.password && formValues.password.length >= 8
    const isPasswordConfirmationValid = formValues.password_confirmation && 
      formValues.password === formValues.password_confirmation
    const isPaisValid = formValues.pais_id && formValues.pais_id > 0
    const isEstadoValid = formValues.estado_id && formValues.estado_id > 0
    const isCiudadValid = formValues.ciudad_id && formValues.ciudad_id > 0
    const isInstitutionValid = formValues.institution_id && formValues.institution_id > 0
    const isTermsAccepted = formValues.acceptTerms === true
    
    return hasNoErrors && 
           isNameValid && 
           isEmailValid && 
           isPasswordValid && 
           isPasswordConfirmationValid && 
           isPaisValid && 
           isEstadoValid && 
           isCiudadValid && 
           isInstitutionValid && 
           isTermsAccepted
  }, [
    form.watch('name'),
    form.watch('email'), 
    form.watch('password'),
    form.watch('password_confirmation'),
    form.watch('pais_id'),
    form.watch('estado_id'),
    form.watch('ciudad_id'),
    form.watch('institution_id'),
    form.watch('acceptTerms'),
    form.formState.errors
  ])

  // Resetear campos dependientes cuando cambia la selección padre
  const handlePaisChange = (value: string) => {
    const paisIdNum = parseInt(value)
    form.setValue('pais_id', paisIdNum)
    form.setValue('estado_id', undefined)
    form.setValue('ciudad_id', undefined)
    form.setValue('institution_id', undefined)
  }

  const handleEstadoChange = (value: string) => {
    const estadoIdNum = parseInt(value)
    form.setValue('estado_id', estadoIdNum)
    form.setValue('ciudad_id', undefined)
    form.setValue('institution_id', undefined)
  }

  const handleCiudadChange = (value: string) => {
    const ciudadIdNum = parseInt(value)
    form.setValue('ciudad_id', ciudadIdNum)
    form.setValue('institution_id', undefined)
  }

  const handleInstitucionChange = (value: string) => {
    const institutionIdNum = parseInt(value)
    form.setValue('institution_id', institutionIdNum)
  }

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)
    
    // Validate institution_id before submitting
    if (!data.institution_id) {
      toast.error('Por favor selecciona una institución')
      setIsLoading(false)
      return
    }
    
    try {
      const result = await register({
        name: data.name,
        email: data.email,
        password: data.password,
        password_confirmation: data.password_confirmation,
        institution_id: data.institution_id,
      })

      if (result.success) {
        toast.success('¡Registro exitoso! Tu cuenta está pendiente de aprobación.')
        navigate({ to: '/sign-in' })
      } else {
        toast.error(result.message || 'Error al registrarse')
      }
    } catch (error: any) {
      console.error('Error en registro:', error)
      toast.error(error.response?.data?.message || 'Error al registrarse')
    } finally {
      setIsLoading(false)
    }
  }

  // Función para obtener clases de validación visual
  const getFieldValidationClasses = (fieldName: keyof z.infer<typeof formSchema>, hasValue: boolean) => {
    const error = form.formState.errors[fieldName]
    const isValid = !error && hasValue && form.formState.touchedFields[fieldName]
    
    if (error) {
      return 'border-red-500 focus-visible:ring-red-500'
    }
    if (isValid) {
      return 'border-green-500 focus-visible:ring-green-500'
    }
    return ''
  }

  // Función para mostrar íconos de validación
  const getValidationIcon = (fieldName: keyof z.infer<typeof formSchema>, hasValue: boolean) => {
    const error = form.formState.errors[fieldName]
    const isValid = !error && hasValue && form.formState.touchedFields[fieldName]
    
    if (error) {
      return <X className="h-4 w-4 text-red-500" />
    }
    if (isValid) {
      return <Check className="h-4 w-4 text-green-500" />
    }
    return null
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn('grid gap-8', className)}
      {...props}
    >
      {/* Primera fila - Información personal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nombre */}
        <div className="space-y-3">
          <Label htmlFor="name">Nombre Completo</Label>
          <div className="relative">
            <Input
              id="name"
              placeholder="Juan Pérez"
              type="text"
              autoComplete="name"
              className={getFieldValidationClasses('name', !!form.watch('name'))}
              {...form.register('name')}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {getValidationIcon('name', !!form.watch('name'))}
            </div>
          </div>
          {form.formState.errors.name && (
            <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
              <X className="h-3 w-3" />
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-3">
          <Label htmlFor="email">Correo Electrónico</Label>
          <div className="relative">
            <Input
              id="email"
              placeholder="correo@ejemplo.com"
              type="email"
              autoComplete="email"
              className={getFieldValidationClasses('email', !!form.watch('email'))}
              {...form.register('email')}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {getValidationIcon('email', !!form.watch('email'))}
            </div>
          </div>
          {form.formState.errors.email && (
            <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
              <X className="h-3 w-3" />
              {form.formState.errors.email.message}
            </p>
          )}
        </div>
      </div>

      {/* Segunda fila - Ubicación geográfica */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* País */}
        <div className="space-y-3">
          <Label htmlFor="pais">País</Label>
          <Select onValueChange={handlePaisChange} disabled={paisesQuery.isLoading}>
            <SelectTrigger className={getFieldValidationClasses('pais_id', !!paisId)}>
              <SelectValue placeholder={paisesQuery.isLoading ? "Cargando países..." : "Selecciona un país"} />
            </SelectTrigger>
            <SelectContent>
              {paisesQuery.data?.data.map((pais) => (
                <SelectItem key={pais.id} value={pais.id.toString()}>
                  {pais.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.pais_id && (
            <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
              <X className="h-3 w-3" />
              {form.formState.errors.pais_id.message}
            </p>
          )}
        </div>

        {/* Estado */}
        <div className="space-y-3">
          <Label htmlFor="estado">Estado/Departamento</Label>
          <Select 
            onValueChange={handleEstadoChange} 
            disabled={!paisId || estadosQuery.isLoading}
          >
            <SelectTrigger className={getFieldValidationClasses('estado_id', !!estadoId)}>
              <SelectValue 
                placeholder={
                  !paisId 
                    ? "Primero selecciona un país" 
                    : estadosQuery.isLoading 
                      ? "Cargando estados..." 
                      : "Selecciona un estado"
                } 
              />
            </SelectTrigger>
            <SelectContent>
              {estadosQuery.data?.data.map((estado) => (
                <SelectItem key={estado.id} value={estado.id.toString()}>
                  {estado.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.estado_id && (
            <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
              <X className="h-3 w-3" />
              {form.formState.errors.estado_id.message}
            </p>
          )}
        </div>
      </div>

      {/* Tercera fila - Ciudad e Institución */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ciudad */}
        <div className="space-y-3">
          <Label htmlFor="ciudad">Ciudad</Label>
          <Select 
            onValueChange={handleCiudadChange} 
            disabled={!estadoId || ciudadesQuery.isLoading}
          >
            <SelectTrigger className={getFieldValidationClasses('ciudad_id', !!ciudadId)}>
              <SelectValue 
                placeholder={
                  !estadoId 
                    ? "Primero selecciona un estado" 
                    : ciudadesQuery.isLoading 
                      ? "Cargando ciudades..." 
                      : "Selecciona una ciudad"
                } 
              />
            </SelectTrigger>
            <SelectContent>
              {ciudadesQuery.data?.data.map((ciudad) => (
                <SelectItem key={ciudad.id} value={ciudad.id.toString()}>
                  {ciudad.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.ciudad_id && (
            <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
              <X className="h-3 w-3" />
              {form.formState.errors.ciudad_id.message}
            </p>
          )}
        </div>

        {/* Institución */}
        <div className="space-y-3">
          <Label htmlFor="institucion">Institución</Label>
          <Select 
            onValueChange={handleInstitucionChange} 
            disabled={!ciudadId || institucionesQuery.isLoading}
          >
            <SelectTrigger className={getFieldValidationClasses('institution_id', !!form.watch('institution_id'))}>
              <SelectValue 
                placeholder={
                  !ciudadId 
                    ? "Primero selecciona una ciudad" 
                    : institucionesQuery.isLoading 
                      ? "Cargando instituciones..." 
                      : institucionesQuery.data?.data.length === 0
                        ? "No hay instituciones disponibles"
                        : "Selecciona una institución"
                } 
              />
            </SelectTrigger>
            <SelectContent>
              {institucionesQuery.data?.data.map((institucion) => (
                <SelectItem key={institucion.id} value={institucion.id.toString()}>
                  {institucion.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.institution_id && (
            <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
              <X className="h-3 w-3" />
              {form.formState.errors.institution_id.message}
            </p>
          )}
        </div>
      </div>

      {/* Cuarta fila - Contraseñas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contraseña */}
        <div className="space-y-3">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Input
              id="password"
              placeholder="********"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              className={cn(
                getFieldValidationClasses('password', !!password),
                "pr-20" // Espacio extra para los iconos
              )}
              {...form.register('password')}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {getValidationIcon('password', !!password)}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto p-1 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
           {/* Indicador de fortaleza de contraseña */}
           {password && (
             <div className="space-y-2 mt-2">
               <div className="flex items-center justify-between">
                 <span className="text-xs text-muted-foreground">Fortaleza:</span>
                 <span className={cn(
                   "text-xs font-medium",
                   passwordStrength.score <= 1 ? "text-red-500" :
                   passwordStrength.score === 2 ? "text-orange-500" :
                   passwordStrength.score === 3 ? "text-yellow-500" :
                   "text-green-500"
                 )}>
                   {passwordStrength.label}
                 </span>
               </div>
               <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
                 <div 
                   className={cn(
                     "h-full transition-all duration-300 ease-in-out",
                     passwordStrength.score <= 1 ? "bg-red-500" :
                     passwordStrength.score === 2 ? "bg-orange-500" :
                     passwordStrength.score === 3 ? "bg-yellow-500" :
                     "bg-green-500"
                   )}
                   style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                 />
               </div>
               {passwordStrength.suggestions.length > 0 && (
                 <ul className="text-xs text-muted-foreground space-y-1">
                   {passwordStrength.suggestions.slice(0, 2).map((suggestion, index) => (
                     <li key={index} className="flex items-center gap-1">
                       <span className="w-1 h-1 bg-current rounded-full" />
                       {suggestion}
                     </li>
                   ))}
                 </ul>
               )}
             </div>
           )}
          
          {form.formState.errors.password && (
            <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
              <X className="h-3 w-3" />
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        {/* Confirmar Contraseña */}
        <div className="space-y-3">
          <Label htmlFor="password_confirmation">Confirmar Contraseña</Label>
          <div className="relative">
            <Input
              id="password_confirmation"
              placeholder="********"
              type={showPasswordConfirmation ? "text" : "password"}
              autoComplete="new-password"
              className={cn(
                getFieldValidationClasses('password_confirmation', !!passwordConfirmation),
                "pr-20" // Espacio extra para los iconos
              )}
              {...form.register('password_confirmation')}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {getValidationIcon('password_confirmation', !!passwordConfirmation)}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto p-1 hover:bg-transparent"
                onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
              >
                {showPasswordConfirmation ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          {/* Indicador de coincidencia de contraseñas */}
          {passwordConfirmation && password && (
            <div className="flex items-center gap-2 text-xs mt-2">
              {password === passwordConfirmation ? (
                <>
                  <Check className="h-3 w-3 text-green-500" />
                  <span className="text-green-500">Las contraseñas coinciden</span>
                </>
              ) : (
                <>
                  <X className="h-3 w-3 text-red-500" />
                  <span className="text-red-500">Las contraseñas no coinciden</span>
                </>
              )}
            </div>
          )}
          
          {form.formState.errors.password_confirmation && (
            <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
              <X className="h-3 w-3" />
              {form.formState.errors.password_confirmation.message}
            </p>
          )}
        </div>
      </div>

      {/* Checkbox de aceptación de términos */}
      <div className="space-y-3">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="acceptTerms"
            checked={form.watch('acceptTerms')}
            onCheckedChange={(checked) => form.setValue('acceptTerms', !!checked)}
            className={cn(
              form.formState.errors.acceptTerms && "border-red-500"
            )}
          />
          <div className="grid gap-1.5 leading-none">
            <Label
              htmlFor="acceptTerms"
              className="text-sm font-normal leading-relaxed cursor-pointer"
            >
              He leído y acepto los{' '}
              <a 
                href="/terms" 
                className="text-primary underline hover:no-underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Términos de Servicio
              </a>
              {' '}y la{' '}
              <a 
                href="/privacy" 
                className="text-primary underline hover:no-underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Política de Privacidad
              </a>
            </Label>
          </div>
        </div>
        {form.formState.errors.acceptTerms && (
          <p className="text-sm text-red-500 flex items-center gap-1 ml-7 mt-1">
            <X className="h-3 w-3" />
            {form.formState.errors.acceptTerms.message}
          </p>
        )}
      </div>

      <Button 
        type="submit"
        className="mt-4 w-full" 
        disabled={isLoading || !isFormValid}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creando cuenta...
          </>
        ) : (
          'Crear Cuenta'
        )}
      </Button>
    </form>
  )
}
