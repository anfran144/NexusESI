# 🚀 Deployment Guide - NexusESI Backend

> Guía rápida de referencia para despliegue en Railway

## ⚡ Quick Links

- 📘 [Guía Completa Railway](../docs/DEPLOYMENT-RAILWAY.md)
- ⚡ [Quick Deploy (30 min)](../docs/QUICK-DEPLOY-GUIDE.md)
- ☁️ [Configuración S3](../docs/AWS-S3-CONFIGURATION.md)
- ✅ [Checklist](../docs/DEPLOYMENT-CHECKLIST.md)
- 🏗️ [Arquitectura](../docs/DEPLOYMENT-ARCHITECTURE.md)

## 📋 Servicios Requeridos

### En Railway (4 servicios)
1. **Backend Web** - API REST
2. **Queue Worker** - Procesa jobs
3. **Scheduler** - Tareas programadas
4. **PostgreSQL** - Base de datos

### Externos (3 servicios)
1. **AWS S3** - Almacenamiento de archivos
2. **Pusher** - WebSocket
3. **SendGrid** - Emails

## 🔑 Variables de Entorno Críticas

```bash
# Application
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:... # Generar con: php artisan key:generate --show

# Database (Auto-inyectado por Railway)
DB_CONNECTION=pgsql

# Storage (S3)
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=tu_key
AWS_SECRET_ACCESS_KEY=tu_secret
AWS_BUCKET=nexusesi-production

# Queue
QUEUE_CONNECTION=database

# WebSocket (Pusher)
PUSHER_APP_ID=tu_id
PUSHER_APP_KEY=tu_key
PUSHER_APP_SECRET=tu_secret

# Email (SendGrid)
SENDGRID_API_KEY=tu_key
```

## 🛠️ Comandos Post-Deploy

```bash
# 1. Generar APP_KEY
php artisan key:generate --show

# 2. Ejecutar migraciones
php artisan migrate --force

# 3. (Opcional) Seeders
php artisan db:seed --force

# 4. Limpiar cachés
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## 🎯 Start Commands

### Backend Web
```bash
php artisan serve --host=0.0.0.0 --port=$PORT
```

### Queue Worker
```bash
bash scripts/start-queue-worker.sh
```

### Scheduler
```bash
bash scripts/start-scheduler.sh
```

## 🧪 Verificación

```bash
# Health check
curl https://your-backend.railway.app/up

# Test S3
php artisan tinker
Storage::disk('s3')->put('test.txt', 'Hello!');
Storage::disk('s3')->exists('test.txt'); # debe ser true
```

## 🚨 Troubleshooting Rápido

| Problema | Solución |
|----------|----------|
| "No encryption key" | `php artisan key:generate --show` |
| Queue no procesa | Verificar `QUEUE_CONNECTION=database` |
| S3 Access Denied | Verificar credenciales AWS |
| CORS Error | Actualizar `CORS_ALLOWED_ORIGINS` |

## 📊 Arquitectura

```
Backend Web (:8000)
    ↓
PostgreSQL
    ↑
Queue Worker + Scheduler
    ↓
AWS S3 + Pusher + SendGrid
```

---

Para más detalles, ver la [documentación completa](../docs/DEPLOYMENT-RAILWAY.md).

