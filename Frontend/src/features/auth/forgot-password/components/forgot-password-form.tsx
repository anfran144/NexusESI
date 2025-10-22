import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { ArrowRight, Loader2 } from 'lucide-react'
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
import { Input } from '@/components/ui/input'

const formSchema = z.object({
  email: z.string().email('Por favor ingresa un correo electrónico válido'),
})

export function ForgotPasswordForm({
  className,
  ...props
}: React.HTMLAttributes<HTMLFormElement>) {
  const navigate = useNavigate()
  const { isLoading, sendOtp } = useForgotPasswordStore()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      const result = await sendOtp({ email: data.email })
      
      if (result.success) {
        toast.success(`¡Código OTP enviado a ${data.email}!`)
        navigate({ to: '/otp' })
      } else {
        toast.error(result.message || 'Error al enviar el código OTP')
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al enviar el código OTP'
      toast.error(errorMessage)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-2', className)}
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
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className='mt-2' disabled={isLoading || !form.formState.isValid}>
          Continuar
          {isLoading ? <Loader2 className='animate-spin ml-2 h-4 w-4' /> : <ArrowRight className='ml-2 h-4 w-4' />}
        </Button>
      </form>
    </Form>
  )
}
