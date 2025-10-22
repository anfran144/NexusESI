# Módulo de Autenticación y Correo Electrónico

> Documentación completa del sistema de autenticación, recuperación de contraseña y correo electrónico con SendGrid

---

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Autenticación JWT](#autenticación-jwt)
3. [Recuperación de Contraseña](#recuperación-de-contraseña)
4. [Verificación de Correo](#verificación-de-correo)
5. [Configuración SendGrid](#configuración-sendgrid)
6. [Seguridad](#seguridad)
7. [API Reference](#api-reference)
8. [Testing](#testing)

---

## Descripción General

El módulo de autenticación y correo electrónico maneja:
- Autenticación de usuarios con JWT
- Recuperación de contraseña mediante OTP
- Verificación de correo electrónico
- Envío de correos transaccionales vía SendGrid

### Tecnologías

- **Laravel 11.x** - Framework backend
- **tymon/jwt-auth** - Autenticación JWT
- **SendGrid** - Servicio de correo electrónico
- **Spatie Permissions** - Control de acceso basado en roles

---

## Autenticación JWT

### Configuración

```env
JWT_SECRET=your_jwt_secret_here
JWT_TTL=60
JWT_REFRESH_TTL=20160
JWT_BLACKLIST_ENABLED=true
```

### Endpoints

#### 1. Registro de Usuario
```http
POST /api/register
Content-Type: application/json

{
  "name": "Usuario Ejemplo",
  "email": "usuario@example.com",
  "password": "Password123",
  "password_confirmation": "Password123",
  "institution_id": 1
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "¡Gracias por registrarte!",
  "user": {
    "id": 1,
    "name": "Usuario Ejemplo",
    "email": "usuario@example.com",
    "status": "pending_approval"
  }
}
```

#### 2. Login
```http
POST /api/login
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "Password123"
}
```

**Respuesta:**
```json
{
  "success": true,
  "user": { /* datos del usuario */ },
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

#### 3. Logout
```http
POST /api/logout
Authorization: Bearer {token}
```

#### 4. Refresh Token
```http
POST /api/refresh
Authorization: Bearer {token}
```

---

## Recuperación de Contraseña

### Flujo Completo

1. **Usuario solicita recuperación** → Envío de OTP por email
2. **Usuario verifica OTP** → Recibe token de reset
3. **Usuario establece nueva contraseña** → Confirmación por email

### 1. Enviar OTP

```http
POST /api/forgot-password/send-otp
Content-Type: application/json

{
  "email": "usuario@example.com"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Código OTP enviado exitosamente",
  "data": {
    "email": "usuario@example.com",
    "user_name": "Usuario Ejemplo",
    "otp": "123456",  // Solo en desarrollo
    "expires_in": 15
  }
}
```

### 2. Verificar OTP

```http
POST /api/forgot-password/verify-otp
Content-Type: application/json

{
  "email": "usuario@example.com",
  "otp": "123456"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Código OTP verificado exitosamente",
  "data": {
    "reset_token": "abc123...",
    "email": "usuario@example.com",
    "expires_in": 15
  }
}
```

### 3. Restablecer Contraseña

```http
POST /api/forgot-password/reset-password
Content-Type: application/json

{
  "email": "usuario@example.com",
  "reset_token": "abc123...",
  "password": "NuevaPassword123",
  "password_confirmation": "NuevaPassword123"
}
```

**Validación de Contraseña:**
- Mínimo 8 caracteres
- Al menos 1 mayúscula
- Al menos 1 minúscula
- Al menos 1 número
- No puede ser igual a la anterior

---

## Verificación de Correo

### 1. Enviar OTP de Verificación

```http
POST /api/email-verification/send-otp
Content-Type: application/json

{
  "email": "usuario@example.com"
}
```

### 2. Verificar Email

```http
POST /api/email-verification/verify
Content-Type: application/json

{
  "email": "usuario@example.com",
  "otp": "654321"
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Correo electrónico verificado exitosamente",
  "data": {
    "user_id": 1,
    "verified_at": "2025-10-21 13:45:30"
  }
}
```

---

## Configuración SendGrid

### Setup Rápido

1. **Crear cuenta en SendGrid**
   - Ir a [sendgrid.com](https://sendgrid.com)
   - Plan gratuito: 100 emails/día

2. **Obtener API Key**
   - Settings → API Keys → Create API Key
   - Permisos: Full Access o Mail Send

3. **Verificar Sender Identity en SendGrid**
   - Ve a: https://app.sendgrid.com/settings/sender_auth
   - Verifica tu email o dominio
   - **Importante**: SendGrid no enviará emails si el remitente no está verificado

4. **Instalar dependencias** (ya instalado en NexusESI)
   ```bash
   composer require symfony/sendgrid-mailer
   composer require symfony/http-client
   ```

5. **Configurar `.env`**

   #### Opción A: Web API (Recomendado - Usado en NexusESI) ⭐
   ```env
   MAIL_MAILER=sendgrid
   SENDGRID_API_KEY=SG.tu_sendgrid_api_key_aqui
   MAIL_FROM_ADDRESS=andersonf.diaz212@umariana.edu.co
   MAIL_FROM_NAME="NexusESI"
   ```

   #### Opción B: SMTP (Alternativa)
   ```env
   MAIL_MAILER=smtp
   MAIL_HOST=smtp.sendgrid.net
   MAIL_PORT=587
   MAIL_USERNAME=apikey
   MAIL_PASSWORD=tu_sendgrid_api_key_aqui
   MAIL_ENCRYPTION=tls
   MAIL_FROM_ADDRESS=noreply@nexusesi.com
   MAIL_FROM_NAME="NexusESI"
   ```

6. **Limpiar Cache**
   ```bash
   php artisan config:clear
   php artisan cache:clear
   ```

7. **Probar Configuración**
   ```bash
   php artisan email:test tu_email@example.com
   ```

### Templates de Email

#### 1. OTP para Recuperación de Contraseña
- **Mailable**: `App\Mail\OtpMail`
- **Vista HTML**: `resources/views/emails/otp.blade.php`
- **Vista Texto**: `resources/views/emails/otp-text.blade.php`

#### 2. Verificación de Email
- **Mailable**: `App\Mail\EmailVerificationMail`
- **Vista HTML**: `resources/views/emails/email-verification.blade.php`
- **Vista Texto**: `resources/views/emails/email-verification-text.blade.php`

#### 3. Confirmación de Reset
- **Mailable**: `App\Mail\PasswordResetSuccessMail`
- **Vista HTML**: `resources/views/emails/password-reset-success.blade.php`
- **Vista Texto**: `resources/views/emails/password-reset-success-text.blade.php`

---

## Seguridad

### Rate Limiting

**Configuración:**
```php
private const RATE_LIMIT_MAX_ATTEMPTS = 3;
private const RATE_LIMIT_DECAY_MINUTES = 1;
```

**Comportamiento:**
- Máximo 3 solicitudes por minuto por email
- Respuesta HTTP 429 si se excede
- Header `retry_after` indica tiempo de espera

### Validación de Intentos

**Tabla `password_reset_tokens`:**
```sql
CREATE TABLE password_reset_tokens (
    email VARCHAR(255) PRIMARY KEY,
    token VARCHAR(255) NOT NULL,
    attempts INT DEFAULT 0,
    type VARCHAR(255) DEFAULT 'password_reset',
    last_attempt_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL
);
```

**Límites:**
- Máximo 5 intentos por OTP
- Auto-eliminación al exceder límite
- Tracking de último intento

### Expiración de Tokens

```php
private const OTP_EXPIRATION_MINUTES = 15;
private const RESET_TOKEN_EXPIRATION_MINUTES = 15;
```

**Validación:**
```php
if (Carbon::parse($tokenRecord->created_at)
    ->addMinutes(15)->isPast()) {
    // Token expirado - eliminar
}
```

### Generación Segura de OTP

```php
private function generateSecureOtp(): string
{
    try {
        $otp = random_int(100000, 999999);
        return str_pad((string) $otp, 6, '0', STR_PAD_LEFT);
    } catch (\Exception $e) {
        return str_pad((string) mt_rand(100000, 999999), 6, '0', STR_PAD_LEFT);
    }
}
```

### Hashing de Tokens

Todos los tokens se almacenan hasheados:

```php
DB::table('password_reset_tokens')->insert([
    'email' => $email,
    'token' => Hash::make($otp),  // Bcrypt
    'created_at' => Carbon::now(),
]);
```

---

## API Reference

### Resumen de Endpoints

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/api/register` | No | Registrar nuevo usuario |
| POST | `/api/login` | No | Iniciar sesión |
| POST | `/api/logout` | Sí | Cerrar sesión |
| POST | `/api/refresh` | Sí | Refrescar token |
| GET | `/api/me` | Sí | Datos del usuario actual |
| POST | `/api/forgot-password/send-otp` | No | Enviar OTP de recuperación |
| POST | `/api/forgot-password/verify-otp` | No | Verificar OTP |
| POST | `/api/forgot-password/reset-password` | No | Restablecer contraseña |
| POST | `/api/email-verification/send-otp` | No | Enviar OTP de verificación |
| POST | `/api/email-verification/verify` | No | Verificar email |

### Códigos de Respuesta

| Código | Significado |
|--------|------------|
| 200 | OK - Operación exitosa |
| 201 | Created - Usuario creado |
| 401 | Unauthorized - Credenciales inválidas |
| 403 | Forbidden - Máximo de intentos excedido |
| 404 | Not Found - Token/Usuario no encontrado |
| 410 | Gone - Token expirado |
| 422 | Unprocessable Entity - Validación fallida |
| 429 | Too Many Requests - Rate limit excedido |
| 500 | Internal Server Error - Error del servidor |

---

## Testing

### Modo Desarrollo

**En `.env`:**
```env
APP_ENV=local
MAIL_MAILER=log
```

**Características:**
- OTP visible en respuesta JSON
- Emails guardados en `storage/logs/laravel.log`
- Mensajes de error detallados

### Colección Postman

**Ubicación**: `docs/NexusESI-Email-API.postman_collection.json`

**Incluye:**
- Todos los endpoints de autenticación
- Tests automatizados
- Variables de entorno
- Scripts para guardar tokens

**Importar:**
1. Abrir Postman
2. File → Import
3. Seleccionar `NexusESI-Email-API.postman_collection.json`
4. Configurar variable `base_url` = `http://localhost:8000`

### Ejemplos con curl

**Enviar OTP:**
```bash
curl -X POST http://localhost:8000/api/forgot-password/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@example.com"}'
```

**Verificar OTP:**
```bash
curl -X POST http://localhost:8000/api/forgot-password/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@example.com","otp":"123456"}'
```

### Troubleshooting

#### Email no se envía

**1. Verificar configuración:**
```bash
php artisan tinker
>>> config('mail.password')
```

**2. Verificar conexión SMTP:**
```bash
telnet smtp.sendgrid.net 587
```

**3. Revisar logs:**
```bash
tail -f storage/logs/laravel.log
```

#### Rate limit alcanzado

```bash
php artisan tinker
>>> use Illuminate\Support\Facades\RateLimiter;
>>> RateLimiter::clear('forgot-password:usuario@example.com');
```

---

## Archivos del Módulo

### Controllers
- `app/Http/Controllers/Api/AuthController.php`
- `app/Http/Controllers/Api/ForgotPasswordController.php`
- `app/Http/Controllers/Api/EmailVerificationController.php`

### Mailables
- `app/Mail/OtpMail.php`
- `app/Mail/EmailVerificationMail.php`
- `app/Mail/PasswordResetSuccessMail.php`

### Templates
- `resources/views/emails/otp.blade.php`
- `resources/views/emails/otp-text.blade.php`
- `resources/views/emails/email-verification.blade.php`
- `resources/views/emails/email-verification-text.blade.php`
- `resources/views/emails/password-reset-success.blade.php`
- `resources/views/emails/password-reset-success-text.blade.php`

### Rutas
- `routes/api/auth.php`
- `routes/api/forgot-password.php`
- `routes/api/email-verification.php`

### Migraciones
- `database/migrations/0001_01_01_000000_create_users_table.php`
- `database/migrations/2025_10_21_132150_add_attempts_to_password_reset_tokens_table.php`

### Configuración
- `docs/env-email-config.example` - Configuración de ejemplo
- `docs/NexusESI-Email-API.postman_collection.json` - Colección Postman

---

**Última actualización**: 21 de Octubre, 2025  
**Versión**: 1.0.0  
**Estado**: ✅ Producción Ready

