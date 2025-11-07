# 🚂 Guía de Despliegue en Railway - NexusESI

> Guía completa paso a paso para desplegar NexusESI en Railway con arquitectura de dos servicios

[![Railway](https://img.shields.io/badge/Railway-Deploy-0B0D0E?logo=railway&logoColor=white)](https://railway.app)
[![Laravel](https://img.shields.io/badge/Laravel-12.x-FF2D20?logo=laravel&logoColor=white)](https://laravel.com)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=black)](https://reactjs.org)

---

## 📋 Tabla de Contenidos

- [Arquitectura de Despliegue](#-arquitectura-de-despliegue)
- [Prerequisitos](#-prerequisitos)
- [Parte 1: Configuración Inicial](#parte-1-configuración-inicial)
- [Parte 2: Desplegar Backend](#parte-2-desplegar-backend)
- [Parte 3: Desplegar Frontend](#parte-3-desplegar-frontend)
- [Parte 4: Configuración Post-Despliegue](#parte-4-configuración-post-despliegue)
- [Verificaciones](#-verificaciones)
- [Troubleshooting](#-troubleshooting)
- [Mantenimiento](#-mantenimiento)

---

## 🏗️ Arquitectura de Despliegue

```
┌─────────────────────────────────────────────────────────────┐
│                      Railway Project                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────┐ │
│  │   MySQL          │  │   Backend API    │  │  Frontend │ │
│  │   Database       │◄─┤   Laravel 12     │◄─┤  React    │ │
│  │                  │  │   PHP 8.2        │  │  Vite     │ │
│  │  - Migraciones   │  │   + Nginx        │  │  Static   │ │
│  │  - Seeders       │  │   + PHP-FPM      │  │           │ │
│  │  - Auto-backup   │  │   + Queue Worker │  │           │ │
│  └──────────────────┘  │   + Scheduler    │  └───────────┘ │
│                        └──────────────────┘                 │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   Servicios Externos                                 │   │
│  │   - Pusher (WebSockets)                             │   │
│  │   - SendGrid (Email)                                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Características:**
- ✅ Dos servicios independientes (Backend + Frontend)
- ✅ MySQL provisionado por Railway
- ✅ Queue workers para jobs en background
- ✅ Scheduler para tareas automáticas cada 24h
- ✅ HTTPS automático
- ✅ Dominios auto-generados (.up.railway.app)
- ✅ Logs en tiempo real
- ✅ Auto-deployments desde Git

---

## ✅ Prerequisitos

### 1. Cuenta Railway
- Crear cuenta en [railway.app](https://railway.app)
- Plan Starter ($5/mes) o Developer ($20/mes) recomendado
- Método de pago configurado

### 2. Servicios Externos

#### SendGrid (Email)
1. Cuenta en [sendgrid.com](https://sendgrid.com)
2. API Key con permisos "Mail Send"
3. Email verificado en Sender Authentication
4. Obtener: `SENDGRID_API_KEY`

#### Pusher (WebSockets)
1. Cuenta en [pusher.com](https://pusher.com)
2. Crear app de Channels
3. Obtener: `PUSHER_APP_ID`, `PUSHER_APP_KEY`, `PUSHER_APP_SECRET`, `PUSHER_APP_CLUSTER`

### 3. Claves de Seguridad

Generar localmente antes de desplegar:

```bash
# En tu máquina local, en el directorio Backend/

# Generar APP_KEY
php artisan key:generate --show

# Generar JWT_SECRET
php artisan jwt:secret --show
```

**⚠️ IMPORTANTE**: Guarda estas claves en un lugar seguro. Las necesitarás en Railway.

---

## Parte 1: Configuración Inicial

### 1.1. Crear Proyecto en Railway

1. Ir a [railway.app/new](https://railway.app/new)
2. Click en **"New Project"**
3. Seleccionar **"Empty Project"**
4. Nombrar proyecto: `nexusesi-production` (o el nombre que prefieras)

### 1.2. Conectar Repositorio Git

**Opción A: Desde GitHub**
1. Conectar cuenta GitHub a Railway
2. Seleccionar repositorio de NexusESI
3. Railway detectará automáticamente el monorepo

**Opción B: Deploy desde CLI** (alternativa)
```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Vincular proyecto
railway link
```

---

## Parte 2: Desplegar Backend

### 2.1. Agregar MySQL

1. En tu proyecto Railway, click **"+ New"**
2. Seleccionar **"Database"** → **"MySQL"**
3. Railway provisionará automáticamente y expondrá variables:
   - `MYSQLHOST`
   - `MYSQLPORT`
   - `MYSQLDATABASE`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`

### 2.2. Crear Servicio Backend

1. Click **"+ New"** → **"GitHub Repo"** (o "Empty Service" si usas CLI)
2. Seleccionar el repositorio NexusESI
3. Railway detectará el proyecto

### 2.3. Configurar Root Directory

Railway necesita saber dónde está el backend:

1. Ir a **Settings** del servicio Backend
2. En **"Root Directory"** escribir: `Backend`
3. Guardar cambios

### 2.4. Configurar Variables de Entorno

Ve a **Variables** del servicio Backend y agrega:

```bash
# Application
APP_NAME=NexusESI
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:TU_CLAVE_GENERADA_AQUI
APP_URL=${{RAILWAY_PUBLIC_DOMAIN}}
FRONTEND_URL=https://TU-FRONTEND-DOMAIN.up.railway.app

# Database (usar variables de Railway MySQL)
DB_CONNECTION=mysql
DB_HOST=${{MYSQLHOST}}
DB_PORT=${{MYSQLPORT}}
DB_DATABASE=${{MYSQLDATABASE}}
DB_USERNAME=${{MYSQLUSER}}
DB_PASSWORD=${{MYSQLPASSWORD}}

# JWT
JWT_SECRET=TU_JWT_SECRET_GENERADO_AQUI
JWT_TTL=60
JWT_REFRESH_TTL=20160
JWT_BLACKLIST_ENABLED=true
JWT_SHOW_BLACKLIST_EXCEPTION=true

# SendGrid
MAIL_MAILER=sendgrid
SENDGRID_API_KEY=SG.tu_api_key_aqui
MAIL_FROM_ADDRESS=noreply@tudominio.com
MAIL_FROM_NAME=NexusESI

# Pusher
PUSHER_APP_ID=tu_app_id
PUSHER_APP_KEY=tu_app_key
PUSHER_APP_SECRET=tu_app_secret
PUSHER_APP_CLUSTER=tu_cluster
BROADCAST_CONNECTION=pusher

# Queue & Cache
QUEUE_CONNECTION=database
CACHE_DRIVER=file
SESSION_DRIVER=cookie
SESSION_LIFETIME=120

# Logging
LOG_CHANNEL=stack
LOG_LEVEL=info
```

**💡 Tip**: Railway soporta referencias a variables con `${{VARIABLE_NAME}}`

### 2.5. Generar Dominio Público

1. En **Settings** del Backend
2. En **Networking** → **"Generate Domain"**
3. Railway generará: `backend-production-xxxx.up.railway.app`
4. **Copia esta URL** - la necesitarás para el frontend

### 2.6. Desplegar

Railway automáticamente desplegará cuando:
- Se detecten los archivos `nixpacks.toml`, `.railway-start.sh`, `supervisord.conf`
- Ejecutará: Build → Migrations → Start supervisor

**Monitorear el deploy:**
1. Click en el servicio Backend
2. Ver logs en tiempo real en la pestaña **"Deployments"**
3. Buscar mensajes como:
   ```
   ✅ Running database migrations...
   ✅ Optimizing application...
   ✅ Starting Supervisor...
   🚀 Backend started successfully
   ```

---

## Parte 3: Desplegar Frontend

### 3.1. Crear Servicio Frontend

1. En el mismo proyecto Railway, click **"+ New"** → **"GitHub Repo"**
2. Seleccionar mismo repositorio (NexusESI)
3. Railway creará otro servicio

### 3.2. Configurar Root Directory

1. Ir a **Settings** del servicio Frontend
2. En **"Root Directory"** escribir: `Frontend`
3. Guardar cambios

### 3.3. Configurar Variables de Entorno

Ve a **Variables** del servicio Frontend y agrega:

```bash
# ÚNICA variable necesaria para el frontend
VITE_API_URL=https://TU-BACKEND-DOMAIN.up.railway.app/api
```

**⚠️ IMPORTANTE**: 
- Usa la URL del backend que copiaste en el paso 2.5
- Debe incluir `/api` al final
- Debe usar `https://`

### 3.4. Agregar Dependencia de Serve

El frontend necesita un servidor estático. Asegúrate que `Frontend/package.json` incluya:

```json
{
  "dependencies": {
    "serve": "^14.2.0"
  }
}
```

Si no está, agrégalo localmente y haz commit.

### 3.5. Generar Dominio Público

1. En **Settings** del Frontend
2. En **Networking** → **"Generate Domain"**
3. Railway generará: `frontend-production-xxxx.up.railway.app`
4. **Copia esta URL**

### 3.6. Actualizar FRONTEND_URL en Backend

1. Volver al servicio Backend
2. En **Variables**, actualizar:
   ```bash
   FRONTEND_URL=https://TU-FRONTEND-DOMAIN.up.railway.app
   ```
3. Guardar (esto redesplegará el backend automáticamente)

---

## Parte 4: Configuración Post-Despliegue

### 4.1. Ejecutar Seeders (Opcional)

Si deseas datos iniciales (roles, permisos, usuarios de prueba):

**Opción A: Desde Railway CLI**
```bash
railway run php artisan db:seed
```

**Opción B: Desde la consola web**
1. En el servicio Backend, ir a **"Deployments"**
2. Click en el deployment activo
3. En la terminal ejecutar:
   ```bash
   php artisan db:seed
   ```

### 4.2. Crear Usuario Admin

**Método 1: Usar Seeder**
```bash
railway run php artisan db:seed --class=UserSeeder
```

**Método 2: Manualmente con Tinker**
```bash
railway run php artisan tinker

# Dentro de tinker:
$user = User::create([
    'nombre' => 'Admin',
    'apellido' => 'Sistema',
    'email' => 'admin@nexusesi.com',
    'password' => bcrypt('password123'),
    'estado' => 'active',
]);
$user->assignRole('admin');
```

### 4.3. Verificar CORS

El backend debe aceptar requests desde el frontend. Verificar `Backend/config/cors.php`:

```php
'allowed_origins' => [
    env('FRONTEND_URL', 'http://localhost:5173'),
    'https://*.up.railway.app', // Permite todos los subdominios de Railway
],
```

Si necesitas actualizar esto, modificar localmente y hacer push a Git.

---

## ✅ Verificaciones

### 1. Health Check Backend

Visitar en el navegador:
```
https://tu-backend.up.railway.app/up
```

Debería responder: `{"status": "ok"}` o similar

### 2. API Endpoints

Probar endpoint público:
```bash
curl https://tu-backend.up.railway.app/api/paises
```

Debería devolver lista de países en JSON.

### 3. Frontend

1. Abrir: `https://tu-frontend.up.railway.app`
2. Debería cargar la página de login
3. Intentar login con usuario creado

### 4. Verificar Queue Worker

En logs del Backend, buscar:
```
[laravel-queue-worker] Processing: ...
```

### 5. Verificar Scheduler

En logs del Backend (después de 24h), buscar:
```
[laravel-scheduler] Running scheduled command: tasks:calculate-risks
```

### 6. Verificar Pusher (WebSockets)

1. Login en el frontend
2. En consola del navegador (F12), buscar:
   ```
   Pusher: Connection established
   ```

---

## 🔧 Troubleshooting

### Error: "No application encryption key has been specified"

**Solución:**
```bash
# Generar localmente
php artisan key:generate --show

# Copiar resultado y agregarlo en Railway Variables:
APP_KEY=base64:resultado_aqui
```

### Error: "could not find driver"

**Causa**: Falta extensión MySQL para PHP

**Solución**: Verificar `Backend/nixpacks.toml` incluye:
```toml
nixPkgs = [..., "php82Extensions.pdo_mysql", ...]
```

### Error: "SQLSTATE[HY000] [2002] Connection refused"

**Causa**: Variables de base de datos incorrectas

**Solución**:
1. Verificar que MySQL está corriendo en Railway
2. Verificar variables DB_* en Backend
3. Usar las variables de Railway: `${{MYSQLHOST}}`, etc.

### Frontend no conecta con Backend

**Síntomas**: Error CORS o network error

**Solución**:
1. Verificar `VITE_API_URL` en Frontend variables
2. Debe incluir `/api` al final
3. Debe usar `https://`
4. Verificar `Backend/config/cors.php` permite el origen del frontend
5. **Redeploy del frontend** después de cambiar `VITE_API_URL`

### Migrations no se ejecutan

**Solución**:
```bash
# Desde Railway CLI
railway run php artisan migrate --force
```

O verificar logs de deploy - deben mostrar:
```
Running database migrations...
```

### Queue jobs no se procesan

**Síntomas**: Jobs se quedan en estado "pending"

**Solución**:
1. Verificar `QUEUE_CONNECTION=database` en variables
2. Verificar tabla `jobs` existe (migration)
3. Ver logs del worker en Railway
4. Manualmente: `railway run php artisan queue:work`

### Scheduler no ejecuta

**Síntomas**: Tareas programadas no corren

**Solución**:
1. Verificar `supervisord.conf` incluye `laravel-scheduler`
2. Ver logs: buscar `[laravel-scheduler]`
3. Verificar `Backend/bootstrap/app.php` tiene configuración del scheduler

---

## 🔒 Seguridad

### Variables Sensibles

✅ **HACER:**
- Usar variables de entorno de Railway
- Rotar claves periódicamente
- Usar contraseñas fuertes para usuarios

❌ **NO HACER:**
- Commitear archivos `.env` con valores reales
- Usar `APP_DEBUG=true` en producción
- Exponer `APP_KEY` o `JWT_SECRET` públicamente

### HTTPS

Railway provee HTTPS automáticamente. **No deshabilitar.**

### Rate Limiting

Laravel incluye rate limiting. Verificar está activo:
- Login: 5 intentos/minuto
- Password reset: 3 intentos/minuto

---

## 🔄 Mantenimiento

### Actualizar Código

**Auto-deployment (recomendado):**
1. Hacer push a Git
2. Railway detecta y redespliega automáticamente

**Manual:**
```bash
railway up
```

### Ejecutar Migrations Nuevas

```bash
railway run php artisan migrate --force
```

### Ver Logs

**Railway Dashboard:**
1. Click en servicio
2. Tab **"Deployments"**
3. Ver logs en tiempo real

**Railway CLI:**
```bash
railway logs
```

### Rollback a Deploy Anterior

1. Railway Dashboard → Deployments
2. Click en deploy anterior exitoso
3. Click **"Redeploy"**

### Backup de Base de Datos

Railway hace backups automáticos. Para manual:

```bash
# Desde CLI
railway run mysqldump > backup.sql
```

### Monitoreo

**Métricas incluidas en Railway:**
- CPU usage
- Memory usage
- Network traffic
- Response times

**Logs estructurados:**
- Ver en tiempo real en Railway
- Filtrar por nivel: info, error, warning

---

## 💰 Costos Estimados

### Railway

**Plan Starter ($5/mes):**
- $5 de crédito mensual
- Servicios incluidos: 3
- Estimado de uso:
  - Backend: ~$2-3/mes
  - Frontend: ~$1/mes
  - MySQL: ~$1/mes
- **Total**: ~$4-5/mes (dentro del crédito)

**Plan Developer ($20/mes):**
- $20 de crédito mensual
- Servicios ilimitados
- Mejor performance

### Servicios Externos

- **SendGrid**: Free tier (100 emails/día) o $19.95/mes (40k emails)
- **Pusher**: Free tier (200k mensajes/día) o $49/mes

**Total estimado**: $5-10/mes para desarrollo/pruebas

---

## 📚 Recursos Adicionales

- **Railway Docs**: https://docs.railway.app
- **Laravel Deployment**: https://laravel.com/docs/deployment
- **Nixpacks**: https://nixpacks.com
- **Supervisor**: http://supervisord.org

---

## 🆘 Soporte

**Documentación del proyecto:**
- Ver `/docs` para documentación técnica completa
- `README.md` para overview general

**Issues:**
- Crear issue en el repositorio de Git

**Railway Community:**
- Discord: https://discord.gg/railway
- Forum: https://help.railway.app

---

## ✅ Checklist de Despliegue

Usa esto para verificar que completaste todos los pasos:

### Pre-Deploy
- [ ] Cuenta Railway creada y verificada
- [ ] SendGrid API Key obtenida
- [ ] Pusher credenciales obtenidas
- [ ] `APP_KEY` generado localmente
- [ ] `JWT_SECRET` generado localmente

### Backend
- [ ] Servicio Backend creado en Railway
- [ ] Root directory configurado a `Backend`
- [ ] MySQL agregado y conectado
- [ ] Todas las variables de entorno configuradas
- [ ] Dominio público generado
- [ ] Deploy exitoso (verificar logs)
- [ ] Health check funciona (`/up`)

### Frontend
- [ ] Servicio Frontend creado en Railway
- [ ] Root directory configurado a `Frontend`
- [ ] `VITE_API_URL` configurado correctamente
- [ ] Dominio público generado
- [ ] `FRONTEND_URL` actualizado en Backend
- [ ] Deploy exitoso (verificar logs)
- [ ] Página carga correctamente

### Post-Deploy
- [ ] Seeders ejecutados (si aplica)
- [ ] Usuario admin creado
- [ ] Login funciona desde frontend
- [ ] Queue worker procesando jobs
- [ ] Scheduler configurado
- [ ] Pusher conectado
- [ ] CORS configurado correctamente

---

**NexusESI en Railway** 🚂  
Despliegue completado exitosamente | Railway Platform  
Última actualización: Noviembre 2025

