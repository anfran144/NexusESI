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
import { SignUpForm } from './components/sign-up-form'

export function SignUp() {
  return (
    <AuthLayout>
      <Card className='gap-4'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>
            Crear una cuenta
          </CardTitle>
          <CardDescription>
              Ingresa tu información para crear tu cuenta. <br />
              ¿Ya tienes una cuenta?{' '}
              <Link
                to='/sign-in'
                className='hover:text-primary underline underline-offset-4'
              >
                Iniciar Sesión
              </Link>
            </CardDescription>
        </CardHeader>
        <CardContent>
          <SignUpForm />
        </CardContent>
        <CardFooter>
          <p className='text-muted-foreground px-8 text-center text-sm'>
            Al hacer clic en crear cuenta, aceptas nuestros{' '}
            <a
              href='/terms'
              className='hover:text-primary underline underline-offset-4'
            >
              Términos de Servicio
            </a>{' '}
            y{' '}
            <a
              href='/privacy'
              className='hover:text-primary underline underline-offset-4'
            >
              Política de Privacidad
            </a>
            .
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
