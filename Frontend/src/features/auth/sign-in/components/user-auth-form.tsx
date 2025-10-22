import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { LogIn } from 'lucide-react'
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

const formSchema = z.object({
  email: z.string().email('Por favor ingresa un correo electrónico válido'),
  password: z
    .string()
    .min(1, 'Por favor ingresa tu contraseña')
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

interface UserAuthFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string
}

export function UserAuthForm({
  className,
  redirectTo,
  ...props
}: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuthStore()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      const result = await login({
        email: data.email,
        password: data.password
      })

      if (result.success) {
        toast.success('¡Bienvenido! Iniciando sesión...')
        
        // Usar setTimeout para asegurar que la navegación ocurra después del toast
        setTimeout(() => {
          const redirectPath = redirectTo || result.redirect_to || '/'
          navigate({ to: redirectPath, replace: true })
        }, 100)
      } else {
        toast.error(result.message || 'Error al iniciar sesión')
      }
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al iniciar sesión'
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
            <FormItem className='relative'>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <PasswordInput 
                  placeholder='********' 
                  autoComplete="current-password"
                  aria-describedby="password-description"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
              <Link
                to='/forgot-password'
                className='text-muted-foreground absolute end-0 -top-0.5 text-sm font-medium hover:opacity-75'
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </FormItem>
          )}
        />
        <Button 
          className='mt-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]' 
          disabled={isLoading || !form.formState.isValid}
          aria-describedby="login-button-description"
        >
          {isLoading ? <Spinner className="mr-2" /> : <LogIn className="mr-2 h-4 w-4" />}
          Iniciar Sesión
        </Button>

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
            type='button' 
            disabled={isLoading}
            aria-label="Iniciar sesión con GitHub"
            className="transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:bg-accent/80"
          >
            <IconGithub className='mr-2 h-4 w-4' /> GitHub
          </Button>
          <Button 
            variant='outline' 
            type='button' 
            disabled={isLoading}
            aria-label="Iniciar sesión con Facebook"
            className="transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:bg-accent/80"
          >
            <IconFacebook className='mr-2 h-4 w-4' /> Facebook
          </Button>
        </div>
      </form>
    </Form>
  )
}
