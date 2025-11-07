# 🚀 Railway Deployment - Quick Reference

> Guía rápida para despliegue en Railway. Para documentación completa ver [RAILWAY-DEPLOYMENT.md](RAILWAY-DEPLOYMENT.md)

## 📦 Archivos Creados

```
NexusESI/
├── Backend/
│   ├── nixpacks.toml              ✅ Configuración PHP 8.2
│   ├── .railway-start.sh          ✅ Script de inicio
│   ├── supervisord.conf           ✅ Gestión de procesos
│   ├── env.railway.template       ✅ Template variables de entorno
│   └── config/cors.php            ✅ Actualizado para Railway
├── Frontend/
│   ├── nixpacks.toml              ✅ Configuración Node 18
│   ├── env.railway.template       ✅ Template variables de entorno
│   └── package.json               ✅ Agregado "serve" dependency
├── RAILWAY-DEPLOYMENT.md          ✅ Guía completa paso a paso
└── RAILWAY-QUICKSTART.md          📄 Este archivo
```

## ⚡ Despliegue Rápido (5 pasos)

### 1️⃣ Preparación Local

```bash
# En el directorio Backend/
php artisan key:generate --show     # Copiar resultado
php artisan jwt:secret --show       # Copiar resultado
```

### 2️⃣ Crear Proyecto Railway

1. Ir a [railway.app](https://railway.app)
2. **New Project** → **Empty Project**
3. **+ New** → **Database** → **MySQL**

### 3️⃣ Backend

1. **+ New** → **GitHub Repo** → Seleccionar NexusESI
2. **Settings** → Root Directory: `Backend`
3. **Variables** → Agregar (ver template abajo)
4. **Networking** → **Generate Domain**

**Variables mínimas requeridas:**
```bash
APP_KEY=base64:TU_CLAVE_AQUI
JWT_SECRET=TU_JWT_SECRET_AQUI
APP_URL=${{RAILWAY_PUBLIC_DOMAIN}}
FRONTEND_URL=https://tu-frontend.up.railway.app
DB_CONNECTION=mysql
DB_HOST=${{MYSQLHOST}}
DB_PORT=${{MYSQLPORT}}
DB_DATABASE=${{MYSQLDATABASE}}
DB_USERNAME=${{MYSQLUSER}}
DB_PASSWORD=${{MYSQLPASSWORD}}
SENDGRID_API_KEY=SG.tu_key_aqui
MAIL_FROM_ADDRESS=tu@email.com
PUSHER_APP_ID=tu_id
PUSHER_APP_KEY=tu_key
PUSHER_APP_SECRET=tu_secret
PUSHER_APP_CLUSTER=tu_cluster
QUEUE_CONNECTION=database
BROADCAST_CONNECTION=pusher
```

### 4️⃣ Frontend

1. **+ New** → **GitHub Repo** → Seleccionar NexusESI
2. **Settings** → Root Directory: `Frontend`
3. **Variables** → Agregar:
   ```bash
   VITE_API_URL=https://tu-backend.up.railway.app/api
   ```
4. **Networking** → **Generate Domain**

### 5️⃣ Post-Deploy

```bash
# Instalar Railway CLI (opcional)
npm i -g @railway/cli
railway login

# Ejecutar seeders (opcional)
railway run php artisan db:seed
```

## ✅ Verificación

- [ ] Backend: `https://tu-backend.up.railway.app/up` → OK
- [ ] Frontend: Abre en navegador
- [ ] Login funciona
- [ ] Ver logs: Backend → Deployments

## 🔧 Comandos Útiles

```bash
# Ver logs
railway logs

# Ejecutar comandos en backend
railway run php artisan migrate
railway run php artisan db:seed
railway run php artisan tinker

# Link a proyecto existente
railway link
```

## 📊 Arquitectura

```
┌────────────────────────────────────────┐
│         Railway Project                │
├────────────────────────────────────────┤
│  MySQL ←→ Backend (Laravel + Workers)  │
│              ↕                         │
│          Frontend (React)              │
└────────────────────────────────────────┘
         ↕                ↕
    Pusher           SendGrid
```

## 🐛 Troubleshooting Rápido

**Error: No encryption key**
```bash
# Verificar APP_KEY en Railway variables
# Debe empezar con: base64:
```

**Frontend no conecta**
```bash
# Verificar VITE_API_URL incluye /api
# Debe ser: https://backend.up.railway.app/api
# Redeploy frontend después de cambiar variable
```

**Migrations no corren**
```bash
railway run php artisan migrate --force
```

**Queue no procesa**
```bash
# Verificar QUEUE_CONNECTION=database
# Ver logs: buscar [laravel-queue-worker]
```

## 📚 Documentación Completa

Para información detallada sobre:
- Variables de entorno completas
- Troubleshooting exhaustivo
- Seguridad y mejores prácticas
- Monitoreo y mantenimiento

Ver: **[RAILWAY-DEPLOYMENT.md](RAILWAY-DEPLOYMENT.md)**

## 💰 Costos

**Railway Starter ($5/mes):**
- Backend: ~$2-3/mes
- Frontend: ~$1/mes  
- MySQL: ~$1/mes
- **Total**: ~$4-5/mes ✅

**Externos:**
- SendGrid: Free (100 emails/día)
- Pusher: Free (200k mensajes/día)

---

✅ **Deployment listo en ~15 minutos**

