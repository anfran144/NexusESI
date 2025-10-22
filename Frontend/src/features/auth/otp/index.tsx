import { Link } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { OtpForm } from './components/otp-form'

export function Otp() {
  return (
    <AuthLayout>
      <Card className='gap-4'>
        <CardHeader>
          <CardTitle className='text-base tracking-tight'>
            Autenticación de Dos Factores
          </CardTitle>
          <CardDescription>
            Ingresa el código de 6 dígitos que enviamos a tu correo electrónico.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OtpForm />
        </CardContent>
        <CardFooter>
          <p className='text-muted-foreground px-8 text-center text-sm'>
            ¿No recibiste el código?{' '}
            <Link
              to='/forgot-password'
              className='hover:text-primary underline underline-offset-4'
            >
              Reenviar un nuevo código
            </Link>
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
