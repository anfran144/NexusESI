# NexusESI - Backend API

> API REST construida con Laravel 11 para el sistema de gestión de semilleros de investigación

---

## 📋 Descripción

Backend del sistema NexusESI implementado en Laravel 11 con autenticación JWT, sistema de roles y permisos, y integración con SendGrid para correos electrónicos.

---

## 🛠️ Requisitos

- **PHP**: 8.2 o superior
- **Composer**: 2.x
- **MySQL**: 8.0 o superior
- **SendGrid API Key**: Para envío de correos

---

## 🚀 Instalación

### 1. Instalar Dependencias

```bash
composer install
```

### 2. Configuración del Entorno

```bash
# Copiar archivo de entorno
cp .env.example .env

# Generar clave de aplicación
php artisan key:generate

# Generar secret para JWT
php artisan jwt:secret
```

### 3. Configurar Base de Datos

Edita `.env` y configura tu base de datos:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=nexusesi
DB_USERNAME=root
DB_PASSWORD=tu_password
```

### 4. Configurar SendGrid

**NexusESI usa SendGrid Web API** (más rápido y moderno):

```env
MAIL_MAILER=sendgrid
SENDGRID_API_KEY=SG.tu_sendgrid_api_key_aqui
MAIL_FROM_ADDRESS=tu_email_verificado@tudominio.com
MAIL_FROM_NAME="NexusESI"
```

**Importante**: Verifica tu email de remitente en SendGrid:
- Ve a: https://app.sendgrid.com/settings/sender_auth
- Verifica el email que usarás en `MAIL_FROM_ADDRESS`

**Alternativa SMTP**:
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=tu_sendgrid_api_key_aqui
MAIL_ENCRYPTION=tls
```

📖 **Guía completa**: [docs/env-email-config.example](../docs/env-email-config.example)

### 5. Ejecutar Migraciones y Seeders

```bash
# Ejecutar migraciones
php artisan migrate

# Ejecutar seeders (datos de prueba y configuración inicial)
php artisan db:seed
```

### 6. Iniciar Servidor

```bash
php artisan serve
```

La API estará disponible en: http://localhost:8000

---

## 🚢 Despliegue en Railway

1. **Crear el proyecto y Postgres**
   - Crea un proyecto nuevo en Railway y despliega un servicio **Postgres**.  
   - Copia las variables generadas en el panel y usa `env.railway.template` como referencia.

2. **Crear imagen Docker**
   - Railway detecta automáticamente el `Dockerfile` dentro de `Backend/`.  
   - No necesitas comandos de build personalizados; Railway ejecutará la build usando el Dockerfile multi-stage incluido.

3. **Configurar los servicios**
   - Crea **tres servicios** dentro del proyecto Railway usando la misma imagen generada:
     1. **App Service (HTTP)**
        - Start command: `app` (valor por defecto del contenedor).
        - Variables: APP_KEY, JWT_SECRET, Postgres (`DB_URL` o credenciales), SendGrid, Pusher, etc.
        - Exponer puerto: Railway setea `PORT`; no necesitas ajustar nada adicional.
     2. **Worker Service**
        - Start command: `worker`.
        - Variables: las mismas que el App Service.
        - Puedes ajustar comportamiento del worker con `QUEUE_TRIES`, `QUEUE_TIMEOUT`, `QUEUE_SLEEP`, `QUEUE_MAX_JOBS` o `QUEUE_MAX_TIME`.
     3. **Cron Service**
        - Start command: `cron`.
        - Variables: mismas que el App Service.
        - Ajusta el intervalo si lo requieres con `SCHEDULER_INTERVAL_SECONDS` (por defecto 60 segundos).

4. **Scripts auxiliares**
   - El contenedor usa los scripts en `railway/`:
     - `entrypoint.sh`: despacha según la variable `CONTAINER_ROLE` o el start command (`app`, `worker`, `cron`).
     - `init-app.sh`: ejecuta migraciones y cachea la aplicación antes de iniciar Apache.
     - `run-worker.sh`: lanza el worker y admite variables de entorno para tiempos/colas.
     - `run-cron.sh`: ejecuta el scheduler en un loop cada 60s (configurable).

5. **Variables y Logging**
   - Usa Postgres (`DB_CONNECTION=pgsql`) con `DB_URL=${{Postgres.DATABASE_URL}}`.  
   - Ajusta el logging a consola con `LOG_CHANNEL=stderr` y `LOG_STDERR_FORMATTER=\Monolog\Formatter\JsonFormatter` para visualizar los logs en Railway.  
   - Define `QUEUE_CONNECTION=database` para que el worker procese la cola con la base de datos.

---

## 📚 Módulos Implementados

### 1. Autenticación y Correo
- ✅ Registro y Login con JWT
- ✅ Recuperación de contraseña (OTP)
- ✅ Verificación de correo electrónico
- ✅ Integración con SendGrid

📖 **Documentación**: [docs/AUTENTICACION-Y-CORREO.md](../docs/AUTENTICACION-Y-CORREO.md)

### 2. Gestión de Usuarios
- ✅ CRUD de usuarios
- ✅ Sistema de roles (Admin, Coordinator, Seedbed Leader)
- ✅ Permisos granulares con Spatie
- ✅ Estados de usuario (pending_approval, active, suspended)

📖 **Documentación**: [docs/GESTION-USUARIOS.md](../docs/GESTION-USUARIOS.md)

### 3. Sistema Geográfico
- ✅ Gestión de países, estados y ciudades
- ✅ Estructura jerárquica con integridad referencial
- ✅ Datos pre-cargados de América Latina

📖 **Documentación**: [docs/SISTEMA-GEOGRAFICO.md](../docs/SISTEMA-GEOGRAFICO.md)

### 4. Gestión de Instituciones
- ✅ CRUD de instituciones educativas
- ✅ Relación con ubicación geográfica
- ✅ Estados activo/inactivo

📖 **Documentación**: [docs/GESTION-INSTITUCIONES.md](../docs/GESTION-INSTITUCIONES.md)

### 5. Sistema de Eventos
- ✅ CRUD de eventos
- ✅ Gestión de comités
- ✅ Participación de usuarios
- ✅ Control de acceso por rol

📖 **Documentación**: [docs/SISTEMA-EVENTOS.md](../docs/SISTEMA-EVENTOS.md)

---

## 🔒 Seguridad

### Autenticación JWT

```env
JWT_SECRET=your_jwt_secret
JWT_TTL=60                    # Minutos de validez del token
JWT_REFRESH_TTL=20160         # Minutos de validez del refresh token
JWT_BLACKLIST_ENABLED=true    # Habilitar blacklist
```

### Rate Limiting

**Configurado automáticamente:**
- Login: 5 intentos por minuto
- Recuperación de contraseña: 3 intentos por minuto
- Verificación de email: 3 intentos por minuto

### Validaciones de Contraseña

- Mínimo 8 caracteres
- Al menos 1 mayúscula
- Al menos 1 minúscula
- Al menos 1 número

---

## 🧪 Testing

### Ejecutar Tests

```bash
# Todos los tests
php artisan test

# Con coverage
php artisan test --coverage

# Tests específicos
php artisan test --filter=AuthTest
```

### Estructura de Tests

```
tests/
├── Feature/          # Tests de integración
│   ├── AuthTest.php
│   ├── UserTest.php
│   └── EventTest.php
└── Unit/             # Tests unitarios
    └── ExampleTest.php
```

---

## 📡 API Endpoints

### Autenticación

```http
POST /api/register          # Registrar usuario
POST /api/login             # Iniciar sesión
POST /api/logout            # Cerrar sesión
POST /api/refresh           # Refrescar token
GET  /api/me                # Usuario actual
```

### Recuperación de Contraseña

```http
POST /api/forgot-password/send-otp      # Enviar OTP
POST /api/forgot-password/verify-otp    # Verificar OTP
POST /api/forgot-password/reset-password # Cambiar contraseña
```

### Verificación de Email

```http
POST /api/email-verification/send-otp   # Enviar OTP
POST /api/email-verification/verify     # Verificar email
```

### Usuarios (Requiere autenticación)

```http
GET    /api/users           # Listar usuarios
GET    /api/users/{id}      # Obtener usuario
PUT    /api/users/{id}      # Actualizar usuario
DELETE /api/users/{id}      # Eliminar usuario
```

### Eventos (Requiere autenticación)

```http
GET    /api/events                    # Listar eventos
POST   /api/events                    # Crear evento
GET    /api/events/{id}               # Obtener evento
PUT    /api/events/{id}               # Actualizar evento
DELETE /api/events/{id}               # Eliminar evento
POST   /api/events/{id}/participate   # Participar en evento
GET    /api/events/{id}/participants  # Listar participantes
```

📖 **API Reference completa**: Ver documentación de cada módulo en `/docs`

---

## 🗂️ Estructura del Proyecto

```
Backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/    # Controladores
│   │   ├── Middleware/     # Middleware personalizado
│   │   ├── Requests/       # Form Requests
│   │   └── Resources/      # API Resources
│   ├── Mail/               # Mailables
│   ├── Models/             # Modelos Eloquent
│   └── Policies/           # Políticas de autorización
├── config/                 # Archivos de configuración
├── database/
│   ├── migrations/         # Migraciones
│   └── seeders/            # Seeders
├── resources/
│   └── views/
│       └── emails/         # Templates de email
├── routes/
│   ├── api.php             # Rutas API principales
│   └── api/                # Rutas organizadas por módulo
└── tests/                  # Tests
```

---

## 🔧 Comandos Útiles

### Desarrollo

```bash
# Limpiar caché
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Refrescar base de datos
php artisan migrate:fresh --seed

# Generar archivos
php artisan make:controller NombreController
php artisan make:model Nombre -m
php artisan make:migration create_nombre_table
php artisan make:seeder NombreSeeder
php artisan make:policy NombrePolicy
```

### Producción

```bash
# Optimizar
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Ejecutar migraciones
php artisan migrate --force
```

---

## 📧 Sistema de Correo

### Mailables Disponibles

1. **OtpMail** - Código OTP para recuperación de contraseña
2. **EmailVerificationMail** - Código OTP para verificación de email
3. **PasswordResetSuccessMail** - Confirmación de cambio de contraseña

### Testing de Emails

**Modo Log (Desarrollo):**
```env
MAIL_MAILER=log
```
Los emails se guardan en `storage/logs/laravel.log`

**Modo SendGrid (Producción):**
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.sendgrid.net
# ... resto de configuración SendGrid
```

---

## 🔄 Seeders Disponibles

```bash
# Ejecutar todos
php artisan db:seed

# Individuales
php artisan db:seed --class=RoleSeeder
php artisan db:seed --class=PermissionSeeder
php artisan db:seed --class=UserSeeder
php artisan db:seed --class=PaisSeeder
php artisan db:seed --class=EstadoSeeder
php artisan db:seed --class=CiudadSeeder
php artisan db:seed --class=InstitucionSeeder
php artisan db:seed --class=EventSeeder
```

**Orden recomendado:**
1. Roles y Permisos
2. Ubicaciones geográficas (País → Estado → Ciudad)
3. Instituciones
4. Usuarios
5. Eventos

---

## 🐛 Troubleshooting

### Error: "Class 'JWTAuth' not found"

```bash
php artisan config:clear
php artisan cache:clear
composer dump-autoload
```

### Error de conexión SendGrid

```bash
# Verificar configuración
php artisan tinker
>>> config('mail.password')  # Debe mostrar tu API key

# Test de conexión
telnet smtp.sendgrid.net 587
```

### Error de permisos en storage/

```bash
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

---

## 📦 Paquetes Principales

| Paquete | Versión | Uso |
|---------|---------|-----|
| laravel/framework | 11.x | Framework |
| tymon/jwt-auth | 2.x | Autenticación JWT |
| spatie/laravel-permission | 6.x | Roles y permisos |
| laravel/tinker | 2.x | REPL |

---

## 📖 Recursos

- **Documentación Laravel**: https://laravel.com/docs/11.x
- **JWT Auth**: https://jwt-auth.readthedocs.io
- **Spatie Permission**: https://spatie.be/docs/laravel-permission
- **SendGrid API**: https://docs.sendgrid.com

---

## 🤝 Contribución

Ver guía de contribución en [DEVELOPMENT-GUIDELINES.md](../DEVELOPMENT-GUIDELINES.md)

---

**Backend API** - NexusESI  
Versión 1.0.0 | Laravel 11.x | PHP 8.2+
