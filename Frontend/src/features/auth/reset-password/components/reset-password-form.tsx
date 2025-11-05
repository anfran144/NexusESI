import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { CheckCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useForgotPasswordStore } from '@/stores/forgot-password-store'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { PasswordInput } from '@/components/ui/password-input'

const formSchema = z.object({
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula')
    .regex(/[a-z]/, 'La contraseña debe contener al menos una letra minúscula')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número'),
  password_confirmation: z.string(),
}).refine((data) => data.password === data.password_confirmation, {
  message: 'Las contraseñas no coinciden',
  path: ['password_confirmation'],
})

export function ResetPasswordForm({
  className,
  ...props
}: React.HTMLAttributes<HTMLFormElement>) {
  const navigate = useNavigate()
  const { isLoading, resetToken, email, resetPassword } = useForgotPasswordStore()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      password: '',
      password_confirmation: '',
    },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      const result = await resetPassword({ 
        email, 
        reset_token: resetToken, 
        password: data.password, 
        password_confirmation: data.password_confirmation 
      })
      
      if (result.success) {
        toast.success('¡Contraseña restablecida correctamente!')
        navigate({ to: '/sign-in' })
      } else {
        toast.error(result.message || 'Error al restablecer la contraseña')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al restablecer la contraseña'
      toast.error(errorMessage)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-4', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nueva Contraseña</FormLabel>
              <FormControl>
                <PasswordInput 
                  placeholder='********' 
                  autoComplete="new-password"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name='password_confirmation'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar Nueva Contraseña</FormLabel>
              <FormControl>
                <PasswordInput 
                  placeholder='********' 
                  autoComplete="new-password"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button className='mt-2' disabled={isLoading || !form.formState.isValid}>
          {isLoading ? (
            <Loader2 className='animate-spin mr-2 h-4 w-4' />
          ) : (
            <CheckCircle className='mr-2 h-4 w-4' />
          )}
          Restablecer Contraseña
        </Button>
      </form>
    </Form>
  )
}