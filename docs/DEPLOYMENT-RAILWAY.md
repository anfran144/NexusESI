# 🚀 Guía de Despliegue en Railway - NexusESI

Esta guía detalla el proceso completo para desplegar NexusESI en Railway, incluyendo la configuración de servicios múltiples, almacenamiento en la nube y WebSocket.

## 📋 Tabla de Contenidos

- [Prerrequisitos](#prerrequisitos)
- [Arquitectura en Railway](#arquitectura-en-railway)
- [Configuración de Servicios Externos](#configuración-de-servicios-externos)
- [Despliegue del Backend](#despliegue-del-backend)
- [Despliegue del Frontend](#despliegue-del-frontend)
- [Configuración de Variables de Entorno](#configuración-de-variables-de-entorno)
- [Configuración de Workers y Scheduler](#configuración-de-workers-y-scheduler)
- [Verificación del Despliegue](#verificación-del-despliegue)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerrequisitos

### Cuentas Necesarias

1. **Railway** - [railway.app](https://railway.app)
   - Crear cuenta (puedes usar GitHub)
   - Tener método de pago configurado (Railway ofrece $5 de crédito gratis)

2. **AWS S3** - Para almacenamiento de archivos
   - Crear cuenta en [AWS](https://aws.amazon.com)
   - Crear bucket S3
   - Obtener Access Key ID y Secret Access Key

3. **Pusher** - Para WebSocket/Broadcasting
   - Crear cuenta en [Pusher](https://pusher.com)
   - Crear una app
   - Obtener credenciales (App ID, Key, Secret, Cluster)

4. **SendGrid** - Para envío de correos
   - Crear cuenta en [SendGrid](https://sendgrid.com)
   - Crear API Key
   - Verificar dominio de remitente

## 🏗️ Arquitectura en Railway

NexusESI requiere **4 servicios separados** en Railway:

```
┌─────────────────────────────────────────────────────┐
│                  Railway Project                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐ │
│  │  Backend   │  │   Queue    │  │  Scheduler   │ │
│  │    Web     │  │   Worker   │  │              │ │
│  │  Service   │  │  Service   │  │   Service    │ │
│  └────────────┘  └────────────┘  └──────────────┘ │
│                                                      │
│  ┌────────────┐  ┌────────────┐                    │
│  │  Frontend  │  │ PostgreSQL │                    │
│  │   Service  │  │  Database  │                    │
│  └────────────┘  └────────────┘                    │
│                                                      │
└─────────────────────────────────────────────────────┘

         ┌──────────────────────┐
         │  Servicios Externos  │
         ├──────────────────────┤
         │  - AWS S3            │
         │  - Pusher            │
         │  - SendGrid          │
         └──────────────────────┘
```

## 🗄️ Configuración de Servicios Externos

### 1. Configurar AWS S3

#### Crear Bucket

1. Ir a [AWS S3 Console](https://s3.console.aws.amazon.com)
2. Clic en "Create bucket"
3. Configuración:
   - **Bucket name**: `nexusesi-production` (debe ser único globalmente)
   - **Region**: `us-east-1` (o la región más cercana)
   - **Block Public Access**: Desmarcar "Block all public access" ⚠️
   - Confirmar que entiendes que el bucket será público
4. Crear el bucket

#### Configurar CORS

1. Ir al bucket creado
2. Pestaña "Permissions" → "CORS"
3. Agregar esta configuración:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000
    }
]
```

#### Crear Políticas de Bucket

1. En "Permissions" → "Bucket Policy"
2. Agregar:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::nexusesi-production/*"
        }
    ]
}
```

#### Crear IAM User

1. Ir a [IAM Console](https://console.aws.amazon.com/iam)
2. Users → Add users
3. Nombre: `nexusesi-railway`
4. Access type: Programmatic access
5. Permissions: Attach existing policies directly
   - Buscar y seleccionar: `AmazonS3FullAccess`
6. Crear usuario
7. **Guardar Access Key ID y Secret Access Key** ⚠️

### 2. Configurar Pusher

1. Ir a [Pusher Dashboard](https://dashboard.pusher.com)
2. Clic en "Create app"
3. Configuración:
   - **Name**: NexusESI Production
   - **Cluster**: Seleccionar el más cercano (ej: `us2`)
   - **Tech stack**: Laravel + JavaScript
4. Ir a "App Keys" y copiar:
   - `app_id`
   - `key`
   - `secret`
   - `cluster`

### 3. Configurar SendGrid

1. Ir a [SendGrid Dashboard](https://app.sendgrid.com)
2. Settings → API Keys → Create API Key
3. Nombre: `NexusESI Railway`
4. Permissions: Full Access
5. **Guardar el API Key** ⚠️

#### Verificar Dominio/Email

1. Settings → Sender Authentication
2. Verificar dominio o single sender email
3. Configurar el email que usarás como remitente

## 🚂 Despliegue del Backend

### Paso 1: Crear Proyecto en Railway

1. Ir a [Railway Dashboard](https://railway.app/dashboard)
2. Clic en "New Project"
3. Seleccionar "Deploy from GitHub repo"
4. Autorizar Railway a acceder a tu repositorio
5. Seleccionar el repositorio NexusESI
6. Railway detectará automáticamente el Backend Laravel

### Paso 2: Agregar Base de Datos PostgreSQL

1. En tu proyecto Railway, clic en "+ New"
2. Seleccionar "Database" → "PostgreSQL"
3. Railway creará automáticamente la base de datos
4. Las variables de entorno se conectarán automáticamente

### Paso 3: Configurar Variables de Entorno del Backend

En Railway, ir al servicio Backend → Variables tab:

#### Variables de la Aplicación

```bash
APP_NAME=NexusESI
APP_ENV=production
APP_DEBUG=false
APP_TIMEZONE=America/Bogota
APP_URL=https://your-backend-url.railway.app
APP_LOCALE=es
APP_FALLBACK_LOCALE=es

# Se generará automáticamente en el primer deploy
# APP_KEY=base64:...
```

#### Base de Datos (Auto-conectadas por Railway)

```bash
# Estas variables se configuran automáticamente al agregar PostgreSQL
# No necesitas configurarlas manualmente
DB_CONNECTION=pgsql
```

#### Sistema de Archivos (S3)

```bash
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=tu_access_key_de_iam
AWS_SECRET_ACCESS_KEY=tu_secret_key_de_iam
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=nexusesi-production
AWS_URL=https://nexusesi-production.s3.amazonaws.com
```

#### Broadcasting (Pusher)

```bash
BROADCAST_CONNECTION=pusher
PUSHER_APP_ID=tu_pusher_app_id
PUSHER_APP_KEY=tu_pusher_key
PUSHER_APP_SECRET=tu_pusher_secret
PUSHER_APP_CLUSTER=us2
PUSHER_SCHEME=https
PUSHER_PORT=443
```

#### Correo (SendGrid)

```bash
MAIL_MAILER=sendgrid
MAIL_FROM_ADDRESS=noreply@tudominio.com
MAIL_FROM_NAME=NexusESI
SENDGRID_API_KEY=tu_sendgrid_api_key
```

#### JWT

```bash
# Generar con: php artisan jwt:secret
JWT_SECRET=tu_jwt_secret_generado
JWT_TTL=60
JWT_REFRESH_TTL=20160
```

#### Queue

```bash
QUEUE_CONNECTION=database
```

#### Frontend URL

```bash
# Actualizar después de desplegar el frontend
FRONTEND_URL=https://your-frontend-url.railway.app
CORS_ALLOWED_ORIGINS=https://your-frontend-url.railway.app
```

### Paso 4: Generar APP_KEY

Después del primer despliegue:

1. Ir al servicio Backend → Deployments → Deployment actual
2. Abrir terminal (tres puntos → Terminal)
3. Ejecutar:

```bash
php artisan key:generate --show
```

4. Copiar el key generado
5. Agregar a variables de entorno: `APP_KEY=base64:...`

### Paso 5: Ejecutar Migraciones

En la terminal del deployment:

```bash
php artisan migrate --force
php artisan db:seed --force
```

### Paso 6: Crear Servicios Adicionales

Railway necesita **3 servicios separados** para el backend:

#### A. Backend Web (Ya existe)

- Ya está configurado con el deploy inicial
- Este servicio maneja las peticiones HTTP

#### B. Queue Worker

1. En Railway, clic en "+ New" → "Empty Service"
2. Nombre: `NexusESI Queue Worker`
3. Ir a Settings → General:
   - **Service Name**: `queue-worker`
4. Ir a Settings → Deploy:
   - **Repository**: Seleccionar el mismo repo
   - **Branch**: main (o tu rama)
   - **Root Directory**: `/Backend`
   - **Custom Start Command**:
     ```bash
     bash scripts/start-queue-worker.sh
     ```
5. Variables: Copiar TODAS las variables del servicio Backend Web
6. Deploy

#### C. Scheduler

1. En Railway, clic en "+ New" → "Empty Service"
2. Nombre: `NexusESI Scheduler`
3. Ir a Settings → General:
   - **Service Name**: `scheduler`
4. Ir a Settings → Deploy:
   - **Repository**: Seleccionar el mismo repo
   - **Branch**: main (o tu rama)
   - **Root Directory**: `/Backend`
   - **Custom Start Command**:
     ```bash
     bash scripts/start-scheduler.sh
     ```
5. Variables: Copiar TODAS las variables del servicio Backend Web
6. Deploy

### Paso 7: Verificar Logs

Para cada servicio, revisar los logs:

1. **Backend Web**: Debe mostrar "Server running on..."
2. **Queue Worker**: Debe mostrar "Processing jobs..."
3. **Scheduler**: Debe ejecutarse cada minuto

## 🎨 Despliegue del Frontend

### Paso 1: Crear Servicio Frontend

1. En el mismo proyecto Railway, clic en "+ New"
2. Seleccionar "GitHub Repo"
3. Seleccionar el mismo repositorio
4. Railway detectará el Frontend

### Paso 2: Configurar Build Settings

1. Ir a Settings → Deploy:
   - **Root Directory**: `/Frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run preview -- --host 0.0.0.0 --port $PORT`

### Paso 3: Variables de Entorno del Frontend

```bash
VITE_API_URL=https://your-backend-url.railway.app
VITE_PUSHER_KEY=tu_pusher_key
VITE_PUSHER_CLUSTER=us2
VITE_PUSHER_ENCRYPTED=true
```

### Paso 4: Actualizar CORS en Backend

1. Copiar la URL del frontend desplegado
2. Ir al Backend → Variables
3. Actualizar:
   ```bash
   FRONTEND_URL=https://frontend-url.railway.app
   CORS_ALLOWED_ORIGINS=https://frontend-url.railway.app
   ```
4. Redeployar el Backend

## ✅ Verificación del Despliegue

### 1. Verificar Backend

```bash
# Health check
curl https://your-backend-url.railway.app/up

# Test API
curl https://your-backend-url.railway.app/api/health
```

### 2. Verificar Queue Worker

1. Ir a Backend → Deployments → Logs
2. Buscar mensajes de "Processing"
3. Crear una tarea en la aplicación y verificar que se procese

### 3. Verificar Scheduler

1. Ir a Scheduler → Deployments → Logs
2. Debe mostrar ejecuciones cada minuto:
   ```
   Running scheduled command: tasks:calculate-risks
   ```

### 4. Verificar WebSocket (Pusher)

1. Ir a [Pusher Debug Console](https://dashboard.pusher.com)
2. Seleccionar tu app
3. Ir a "Debug Console"
4. Realizar una acción en la app que dispare un evento
5. Verificar que aparezca en la consola

### 5. Verificar Almacenamiento S3

1. Subir un archivo en la aplicación
2. Verificar en AWS S3 Console que aparezca en el bucket
3. Intentar acceder a la URL del archivo

## 🔍 Troubleshooting

### Problema: "No application encryption key has been specified"

**Solución:**
```bash
php artisan key:generate --show
# Copiar el key y agregarlo a APP_KEY
```

### Problema: Queue no procesa jobs

**Verificaciones:**
1. Verificar logs del Queue Worker
2. Verificar tabla `jobs` en la base de datos
3. Reiniciar el servicio Queue Worker

**Solución:**
```bash
# En terminal del Queue Worker
php artisan queue:restart
```

### Problema: Scheduler no ejecuta comandos

**Verificaciones:**
1. Verificar logs del Scheduler
2. Verificar que el script tenga permisos de ejecución

**Solución:**
```bash
# Verificar permisos
chmod +x scripts/start-scheduler.sh
```

### Problema: Archivos no se suben a S3

**Verificaciones:**
1. Verificar credenciales AWS en variables de entorno
2. Verificar permisos del IAM user
3. Verificar CORS del bucket

**Solución:**
```bash
# Test en terminal del backend
php artisan tinker
Storage::disk('s3')->put('test.txt', 'Hello World');
Storage::disk('s3')->exists('test.txt'); // debe retornar true
```

### Problema: CORS errors

**Solución:**
1. Verificar que `FRONTEND_URL` esté correctamente configurado
2. Verificar que `CORS_ALLOWED_ORIGINS` incluya la URL del frontend
3. Limpiar caché:
```bash
php artisan config:cache
```

### Problema: 500 Internal Server Error

**Verificar:**
1. Logs del backend: Deployments → View Logs
2. Verificar todas las variables de entorno
3. Verificar que las migraciones se ejecutaron

**Solución:**
```bash
# Limpiar cachés
php artisan config:clear
php artisan cache:clear
php artisan route:clear

# Re-ejecutar migraciones
php artisan migrate:fresh --force
php artisan db:seed --force
```

## 📊 Monitoreo

### Logs en Railway

```bash
# Ver logs en tiempo real
# Ir a Service → Deployments → View Logs

# Filtrar por tipo
# Usar la barra de búsqueda en la interfaz
```

### Métricas

Railway proporciona métricas automáticas:
- CPU Usage
- Memory Usage
- Network I/O
- Disk Usage

Revisar regularmente para optimizar recursos.

## 💰 Costos Estimados

### Railway
- **Hobby Plan**: $5/mes de crédito gratis
- Después: ~$0.000463 por GB-hour
- Estimado: $10-20/mes para 4 servicios pequeños

### AWS S3
- Almacenamiento: $0.023 por GB/mes
- Transferencias: $0.09 por GB
- Estimado: $5-10/mes (dependiendo del uso)

### Pusher
- Free tier: 200k mensajes/día
- Si excedes: Desde $49/mes

### SendGrid
- Free tier: 100 emails/día
- Si excedes: Desde $19.95/mes

**Total estimado**: $15-30/mes (con free tiers)

## 🔐 Seguridad

### Checklist

- [ ] `APP_DEBUG=false` en producción
- [ ] JWT_SECRET único y seguro
- [ ] Credenciales AWS con permisos mínimos
- [ ] Bucket S3 con políticas restrictivas
- [ ] Variables de entorno nunca en el código
- [ ] HTTPS habilitado (Railway lo hace automáticamente)
- [ ] CORS configurado correctamente
- [ ] Logs sin información sensible

## 📚 Recursos Adicionales

- [Railway Documentation](https://docs.railway.app)
- [Laravel Deployment Best Practices](https://laravel.com/docs/deployment)
- [AWS S3 Laravel Integration](https://laravel.com/docs/filesystem#s3-driver-configuration)
- [Pusher Laravel Integration](https://pusher.com/docs/channels/getting_started/laravel)

## 🆘 Soporte

Si encuentras problemas:

1. Revisar esta guía completa
2. Verificar logs en Railway
3. Consultar la documentación técnica del proyecto
4. Abrir un issue en GitHub

---

**Última actualización**: Noviembre 2025  
**Versión**: 1.0.0

