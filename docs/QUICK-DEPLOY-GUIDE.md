# ⚡ Guía Rápida de Despliegue - NexusESI en Railway

> 🚀 Despliega NexusESI en Railway en ~30 minutos

## 📋 Checklist de 5 Pasos

### ✅ Paso 1: Servicios Externos (15 min)

#### AWS S3
```
1. Crear bucket: nexusesi-production
2. Configurar CORS + Bucket Policy
3. Crear usuario IAM
4. Guardar: Access Key ID + Secret Key
```
📖 [Guía detallada S3](AWS-S3-CONFIGURATION.md)

#### Pusher
```
1. Crear app en pusher.com
2. Guardar: App ID, Key, Secret, Cluster
```

#### SendGrid
```
1. Crear API Key
2. Verificar email remitente
```

### ✅ Paso 2: Railway - Backend Web (5 min)

```
1. New Project → GitHub Repo
2. Add Database → PostgreSQL
3. Variables de entorno (copiar del template abajo)
4. Deploy
5. Terminal → php artisan key:generate --show
6. Agregar APP_KEY a variables
7. Terminal → php artisan migrate --force
```

**Variables críticas:**
```bash
APP_ENV=production
APP_DEBUG=false
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=tu_key
AWS_SECRET_ACCESS_KEY=tu_secret
AWS_BUCKET=nexusesi-production
PUSHER_APP_ID=tu_id
PUSHER_APP_KEY=tu_key
PUSHER_APP_SECRET=tu_secret
SENDGRID_API_KEY=tu_key
QUEUE_CONNECTION=database
```

### ✅ Paso 3: Queue Worker (3 min)

```
1. New Service → Empty Service
2. Nombre: "Queue Worker"
3. Repo: mismo que backend
4. Root Directory: /Backend
5. Start Command: bash scripts/start-queue-worker.sh
6. Variables: COPIAR TODAS del Backend Web
7. Deploy
```

### ✅ Paso 4: Scheduler (3 min)

```
1. New Service → Empty Service
2. Nombre: "Scheduler"
3. Repo: mismo que backend
4. Root Directory: /Backend
5. Start Command: bash scripts/start-scheduler.sh
6. Variables: COPIAR TODAS del Backend Web
7. Deploy
```

### ✅ Paso 5: Frontend (4 min)

```
1. New Service → GitHub Repo
2. Root Directory: /Frontend
3. Build: npm install && npm run build
4. Start: npm run preview -- --host 0.0.0.0 --port $PORT
5. Variables:
   VITE_API_URL=https://backend-url.railway.app
   VITE_PUSHER_KEY=tu_key
   VITE_PUSHER_CLUSTER=us2
6. Deploy
```

**Actualizar URLs cruzadas:**
```
Backend → FRONTEND_URL=https://frontend-url.railway.app
Backend → CORS_ALLOWED_ORIGINS=https://frontend-url.railway.app
→ Redeploy Backend
```

## ✅ Verificación Rápida

### 1. Backend Health
```bash
curl https://backend-url.railway.app/up
# Debe responder: 200 OK
```

### 2. Queue Worker Logs
```
Railway → Queue Worker → View Logs
Debe ver: "Processing jobs..."
```

### 3. Scheduler Logs
```
Railway → Scheduler → View Logs
Debe ver (cada minuto): "Running scheduled command"
```

### 4. Test S3
```bash
# En Terminal del Backend
php artisan tinker
Storage::disk('s3')->put('test.txt', 'Hello!');
Storage::disk('s3')->exists('test.txt'); // true
```

### 5. Frontend
```
Abrir: https://frontend-url.railway.app
Login → Dashboard → Crear tarea → Subir archivo
```

## 🚨 Problemas Comunes

| Problema | Solución Rápida |
|----------|----------------|
| "No encryption key" | Generar con `php artisan key:generate --show` |
| S3 Access Denied | Verificar credenciales AWS y permisos IAM |
| CORS Error | Actualizar `CORS_ALLOWED_ORIGINS` con URL frontend |
| Queue no procesa | Verificar `QUEUE_CONNECTION=database` y logs |
| Scheduler no ejecuta | Verificar logs, debe correr cada minuto |

## 📊 Arquitectura Final

```
Railway Project
│
├── Backend Web (:8000)        → API REST
├── Queue Worker               → Procesa jobs
├── Scheduler                  → Tareas programadas
├── Frontend (:5173)           → React SPA
└── PostgreSQL                 → Base de datos

Externos
├── AWS S3                     → Archivos
├── Pusher                     → WebSocket
└── SendGrid                   → Emails
```

## 📖 Documentación Completa

- 📘 [Deployment Railway](DEPLOYMENT-RAILWAY.md) - Guía paso a paso detallada
- 📗 [Configuración S3](AWS-S3-CONFIGURATION.md) - Setup completo de AWS S3
- 📙 [Checklist Deployment](DEPLOYMENT-CHECKLIST.md) - Verificación exhaustiva

## 💰 Costos Mensuales Estimados

```
Railway (4 servicios)   $15-25
AWS S3 (20GB)           $2-5
Pusher (free tier)      $0
SendGrid (free tier)    $0
─────────────────────────────
TOTAL                   $17-30/mes
```

## ⏱️ Timeline

```
Servicios Externos      15 min
Backend Web             5 min
Queue Worker            3 min
Scheduler               3 min
Frontend                4 min
─────────────────────────────
TOTAL                   ~30 min
```

---

**¿Listo?** Comienza con el [Paso 1: Servicios Externos](#-paso-1-servicios-externos-15-min)

**¿Problemas?** Consulta la [guía completa](DEPLOYMENT-RAILWAY.md) o el [checklist](DEPLOYMENT-CHECKLIST.md)

