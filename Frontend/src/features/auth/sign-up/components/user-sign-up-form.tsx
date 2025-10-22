import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { IconFacebook, IconGithub } from '@/assets/brand-icons'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'

const formSchema = z
  .object({
    name: z.string().min(1, 'Por favor ingresa tu nombre completo'),
    email: z.string().email('Por favor ingresa un correo electrónico válido'),
    password: z
      .string()
      .min(1, 'Por favor ingresa tu contraseña')
      .min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string().min(1, 'Por favor confirma tu contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
      message: 'Las contraseñas no coinciden',
      path: ['confirmPassword'],
    })

interface UserSignUpFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string
}

export function UserSignUpForm({
  className,
  redirectTo,
  ...props
}: UserSignUpFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { register } = useAuthStore()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      await register({
        name: data.name,
        email: data.email,
        password: data.password,
        password_confirmation: data.confirmPassword,
        institution_id: 1 // Default institution ID for user registration
      })

      toast.success(`¡Cuenta creada exitosamente!`)
      
      // Redirect to dashboard after successful registration
      const targetPath = redirectTo || '/'
      navigate({ to: targetPath, replace: true })
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al crear la cuenta'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre Completo</FormLabel>
              <FormControl>
                <Input 
                  placeholder='Tu nombre completo' 
                  autoComplete="name"
                  aria-describedby="name-description"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo Electrónico</FormLabel>
              <FormControl>
                <Input 
                  placeholder='nombre@ejemplo.com' 
                  type="email"
                  autoComplete="email"
                  aria-describedby="email-description"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <PasswordInput 
                  placeholder='********' 
                  autoComplete="new-password"
                  aria-describedby="password-description"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='confirmPassword'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar Contraseña</FormLabel>
              <FormControl>
                <PasswordInput 
                  placeholder='********' 
                  autoComplete="new-password"
                  aria-describedby="confirm-password-description"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button 
          className='mt-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]' 
          disabled={isLoading || !form.formState.isValid}
          aria-describedby="signup-button-description"
        >
          {isLoading && <Spinner className='mr-2' />}
          <UserPlus className='mr-2 h-4 w-4' />
          Crear Cuenta
        </Button>

        <div className='text-center text-sm'>
          ¿Ya tienes una cuenta?{' '}
          <Link
            to='/sign-in'
            className='hover:text-primary underline underline-offset-4'
          >
            Iniciar Sesión
          </Link>
        </div>

        <div className='relative'>
          <div className='absolute inset-0 flex items-center'>
            <span className='w-full border-t' />
          </div>
          <div className='relative flex justify-center text-xs uppercase'>
            <span className='bg-background text-muted-foreground px-2'>
              O continúa con
            </span>
          </div>
        </div>

        <div className='grid grid-cols-2 gap-2'>
          <Button
            variant='outline'
            className='w-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:bg-accent/80'
            type='button'
            disabled={isLoading}
            aria-label="Registrarse con GitHub"
          >
            <IconGithub className='mr-2 h-4 w-4' /> GitHub
          </Button>
          <Button
            variant='outline'
            className='w-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:bg-accent/80'
            type='button'
            disabled={isLoading}
            aria-label="Registrarse con Facebook"
          >
            <IconFacebook className='mr-2 h-4 w-4' /> Facebook
          </Button>
        </div>
      </form>
    </Form>
  )
}