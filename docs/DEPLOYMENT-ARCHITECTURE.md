# 🏗️ Arquitectura de Despliegue - NexusESI

## 📊 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────────┐
│                         RAILWAY PROJECT                              │
│                                                                      │
│  ┌────────────────────┐  ┌────────────────────┐  ┌───────────────┐│
│  │   Backend Web      │  │   Queue Worker     │  │   Scheduler   ││
│  │                    │  │                    │  │               ││
│  │ - Laravel 11       │  │ - Procesa Jobs     │  │ - Cron Tasks  ││
│  │ - API REST         │  │ - Emails           │  │ - Riesgos     ││
│  │ - JWT Auth         │  │ - Notificaciones   │  │ - Transiciones││
│  │ - WebSocket Server │  │                    │  │               ││
│  │                    │  │                    │  │               ││
│  │ Port: 8000         │  │ Comando:           │  │ Comando:      ││
│  │                    │  │ queue:work         │  │ schedule:run  ││
│  └────────┬───────────┘  └──────────┬─────────┘  └───────┬───────┘│
│           │                         │                     │        │
│           └────────────┬────────────┴─────────────────────┘        │
│                        │                                            │
│                        ▼                                            │
│           ┌────────────────────────┐                               │
│           │   PostgreSQL Database   │                               │
│           │                         │                               │
│           │ - Users                 │                               │
│           │ - Events                │                               │
│           │ - Tasks                 │                               │
│           │ - Jobs Queue            │                               │
│           │ - Sessions              │                               │
│           └─────────────────────────┘                               │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │                         Frontend                                ││
│  │                                                                 ││
│  │ - React 18 + TypeScript                                        ││
│  │ - TanStack Router                                              ││
│  │ - Shadcn UI                                                    ││
│  │ - Pusher Client                                                ││
│  │                                                                 ││
│  │ Port: 5173 (preview)                                           ││
│  └────────────────────────────────────────────────────────────────┘│
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                │ Conexiones Externas
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐      ┌────────────────┐     ┌────────────────┐
│   AWS S3      │      │    Pusher      │     │   SendGrid     │
│               │      │                │     │                │
│ - Archivos    │      │ - WebSocket    │     │ - Emails       │
│ - Documentos  │      │ - Broadcasting │     │ - OTP          │
│ - Exports     │      │ - Real-time    │     │ - Notif        │
│               │      │                │     │                │
│ Region:       │      │ Cluster: us2   │     │ API Key        │
│ us-east-1     │      │                │     │                │
└───────────────┘      └────────────────┘     └────────────────┘
```

## 🔄 Flujo de Datos

### 1. Autenticación
```
Usuario → Frontend → Backend API → JWT Token → Frontend Storage → Requests con Bearer Token
```

### 2. Subida de Archivos
```
Usuario → Frontend → Backend API → Validación → AWS S3 Upload → Guardar ruta en DB → Response
                                                      │
                                                      └→ URL: https://bucket.s3.amazonaws.com/path
```

### 3. Notificaciones en Tiempo Real
```
Backend Event → Queue Job → Pusher Broadcast → Frontend Listener → UI Update
```

### 4. Jobs Asíncronos
```
Backend Action → Dispatch Job → DB Queue Table → Queue Worker → Process → Notification
                                                       │
                                                       └→ Retry on failure (3x)
```

### 5. Scheduler
```
Cron (cada minuto) → Schedule:run → Check scheduled commands
                                           │
                                           ├→ tasks:calculate-risks (daily)
                                           └→ events:check-status-transitions (daily)
```

## 🎯 Componentes del Sistema

### Backend Web (Laravel)

**Responsabilidades:**
- Servir API REST
- Autenticación JWT
- Validación de requests
- Autorización (permisos)
- Dispatch de jobs
- Broadcasting events

**Endpoints principales:**
- `/api/auth/*` - Autenticación
- `/api/users/*` - Gestión de usuarios
- `/api/events/*` - Eventos
- `/api/tasks/*` - Tareas
- `/api/alerts/*` - Alertas

**Recursos:**
- CPU: ~0.5 vCPU
- RAM: ~512 MB
- Storage: Efímero (logs temporales)

### Queue Worker

**Responsabilidades:**
- Procesar jobs en background
- Enviar emails
- Broadcast de notificaciones
- Exportación de reportes
- Cálculos pesados

**Jobs principales:**
- `SendEmailJob`
- `BroadcastNotificationJob`
- `ExportReportJob`
- `CalculateTaskRisksJob`

**Configuración:**
- Tries: 3
- Timeout: 60 segundos
- Max jobs: 1000 (restart)
- Max time: 1 hora (restart)

**Recursos:**
- CPU: ~0.3 vCPU
- RAM: ~256 MB
- No requiere storage persistente

### Scheduler

**Responsabilidades:**
- Ejecutar comandos programados
- Cálculo automático de riesgos
- Verificación de transiciones de estado
- Limpieza de datos temporales

**Comandos programados:**
- `tasks:calculate-risks` - Diario
- `events:check-status-transitions` - Diario

**Funcionamiento:**
```bash
while true; do
    php artisan schedule:run
    sleep 60
done
```

**Recursos:**
- CPU: ~0.1 vCPU (muy bajo uso)
- RAM: ~128 MB
- Ejecuta cada minuto, trabaja según schedule

### PostgreSQL

**Características:**
- Managed by Railway
- Backups automáticos
- Conexión encriptada
- Variables auto-inyectadas

**Tablas principales:**
- `users` - Usuarios del sistema
- `events` - Eventos académicos
- `committees` - Comités de trabajo
- `tasks` - Tareas asignadas
- `jobs` - Cola de trabajos
- `failed_jobs` - Trabajos fallidos
- `sessions` - Sesiones de usuario

**Estimado de almacenamiento:**
- Inicial: ~50 MB
- Por evento: ~5-10 MB
- Por año: ~500 MB - 1 GB

### Frontend (React)

**Responsabilidades:**
- Interfaz de usuario
- Autenticación cliente
- Llamadas a API
- Escuchar eventos WebSocket
- Gestión de estado

**Rutas principales:**
- `/login` - Autenticación
- `/admin` - Dashboard admin
- `/coordinator` - Dashboard coordinador
- `/seedbed-leader` - Dashboard líder

**Build:**
- Vite optimiza el bundle
- Code splitting automático
- Assets en `/dist`

**Recursos:**
- CPU: ~0.2 vCPU
- RAM: ~256 MB
- Storage: ~50 MB (build)

## 🌐 Servicios Externos

### AWS S3

**Propósito:** Almacenamiento persistente de archivos

**Por qué S3:**
- Railway tiene storage efímero
- Archivos se pierden al redeploy
- S3 proporciona persistencia + CDN

**Estructura de archivos:**
```
nexusesi-production/
├── task-documents/
│   └── {task_id}/
│       └── archivo.pdf
├── event-documents/
│   └── {event_id}/
│       └── documento.docx
├── exports/
│   └── reporte-2024-11-07.xlsx
└── images/
    └── logo-institucion.png
```

**Configuración crítica:**
- CORS habilitado
- Bucket policy: lectura pública
- Usuario IAM: permisos S3
- Encryption: SSE-S3

**Costos:**
- Storage: $0.023/GB/mes
- Transfers: $0.09/GB
- Estimado: $2-5/mes

### Pusher

**Propósito:** WebSocket para tiempo real

**Eventos principales:**
- `notification.created` - Nueva notificación
- `task.updated` - Tarea actualizada
- `alert.created` - Nueva alerta
- `event.status-changed` - Cambio de estado

**Channels:**
- `private-user.{user_id}` - Canal privado por usuario
- `presence-event.{event_id}` - Canal de presencia por evento

**Configuración:**
- Cluster: us2 (o el más cercano)
- Encryption: TLS habilitado
- Auth endpoint: `/api/broadcasting/auth`

**Costos:**
- Free tier: 200k mensajes/día
- Estimado: $0/mes (dentro de free tier)

### SendGrid

**Propósito:** Envío de correos electrónicos

**Emails enviados:**
- OTP recuperación de contraseña
- OTP verificación de email
- Confirmación de cambio de contraseña
- Notificaciones de tareas
- Alertas de riesgo

**Configuración:**
- API Key con Full Access
- Email remitente verificado
- Templates en Laravel Blade
- Rate limit: respetado automáticamente

**Costos:**
- Free tier: 100 emails/día
- Estimado: $0/mes (dentro de free tier)

## 🔐 Seguridad

### Capas de Seguridad

1. **Transport Layer**
   - HTTPS en todos los servicios (Railway automático)
   - TLS 1.3 para conexiones
   - Certificados SSL auto-renovados

2. **Authentication**
   - JWT tokens con expiración
   - Refresh tokens
   - Blacklist de tokens revocados
   - Rate limiting en login

3. **Authorization**
   - Permission-based access control
   - Policies por recurso
   - Middleware en todas las rutas
   - Verificación de ownership

4. **Data Protection**
   - Passwords hasheados (bcrypt)
   - JWT secrets únicos por ambiente
   - API keys en variables de entorno
   - No secrets en código

5. **Storage Security**
   - S3: IAM user con permisos mínimos
   - S3: Bucket policy restrictiva
   - S3: Encryption at rest (SSE-S3)
   - DB: Conexiones encriptadas

6. **CORS**
   - Solo frontend autorizado
   - Credenciales permitidas
   - Headers específicos

## 📊 Monitoreo y Observabilidad

### Railway Metrics

**Backend Web:**
- Request rate
- Response time
- Error rate
- CPU usage
- Memory usage

**Queue Worker:**
- Jobs processed/minute
- Failed jobs
- Retry attempts
- CPU/Memory usage

**Scheduler:**
- Command execution logs
- Success/failure rate
- Execution time

### Application Logs

**Ubicación:** Railway Dashboard → Service → Deployments → View Logs

**Niveles:**
- `emergency` - Sistema no usable
- `alert` - Acción inmediata requerida
- `critical` - Condiciones críticas
- `error` - Errores que no detienen la app
- `warning` - Advertencias
- `notice` - Eventos normales pero significativos
- `info` - Eventos informativos
- `debug` - Información detallada de debug

**Producción:** LOG_LEVEL=info

### External Services Monitoring

**Pusher Dashboard:**
- Messages sent/received
- Concurrent connections
- Error rate

**SendGrid Dashboard:**
- Delivery rate
- Bounce rate
- Spam reports
- Block rate

**AWS CloudWatch (opcional):**
- S3 request metrics
- Data transfer
- Error rate

## 💰 Análisis de Costos

### Railway

| Servicio | vCPU | RAM | Costo Estimado |
|----------|------|-----|----------------|
| Backend Web | 0.5 | 512 MB | $8-12/mes |
| Queue Worker | 0.3 | 256 MB | $4-6/mes |
| Scheduler | 0.1 | 128 MB | $2-3/mes |
| PostgreSQL | - | 256 MB | $5/mes |
| Frontend | 0.2 | 256 MB | $3-5/mes |
| **TOTAL** | | | **$22-31/mes** |

### Servicios Externos

| Servicio | Uso Estimado | Costo |
|----------|--------------|-------|
| AWS S3 | 20 GB storage + 10 GB transfer | $2-5/mes |
| Pusher | 100k mensajes/día (free tier) | $0/mes |
| SendGrid | 50 emails/día (free tier) | $0/mes |
| **TOTAL** | | **$2-5/mes** |

### Costo Total Mensual

```
Railway:            $22-31
Servicios Externos:  $2-5
────────────────────────
TOTAL:             $24-36/mes
```

**Nota:** Railway ofrece $5 de crédito gratis mensual

## 🚀 Escalabilidad

### Horizontal Scaling

**Queue Workers:**
```
Bajo carga alta:
→ Agregar más workers (2-3 instancias)
→ Railway los distribuirá automáticamente
→ Costo adicional: ~$5-8 por worker
```

**Backend Web:**
```
Bajo carga alta:
→ Railway puede auto-scale
→ O agregar replicas manualmente
→ Load balancing automático
```

### Vertical Scaling

```
Si un servicio necesita más recursos:
→ Railway Dashboard → Service → Settings
→ Ajustar recursos (CPU/RAM)
→ Costo proporcional al uso
```

### Database Scaling

```
PostgreSQL:
→ Railway ofrece planes más grandes
→ O migrar a PostgreSQL externo (AWS RDS)
→ Connection pooling para optimizar
```

## 🔄 CI/CD Pipeline

```
Developer → Git Push → GitHub
                          │
                          ├→ Railway detecta cambio
                          │
                          ├→ Build automático
                          │   - Backend: composer install
                          │   - Frontend: npm install && build
                          │
                          ├→ Deploy automático
                          │   - Zero downtime
                          │   - Health checks
                          │   - Rollback automático si falla
                          │
                          └→ Post-deploy hooks
                              - Migrations
                              - Cache clear
                              - Config cache
```

### Rollback Strategy

```
Si algo falla:
1. Railway mantiene deployment anterior
2. Dashboard → Deployments → View Previous
3. Clic en deployment anterior → Redeploy
4. Rollback instantáneo
```

## 📚 Referencias

- [Railway Documentation](https://docs.railway.app)
- [Laravel Deployment](https://laravel.com/docs/deployment)
- [AWS S3 Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/best-practices.html)
- [Pusher Documentation](https://pusher.com/docs)

---

**Última actualización**: Noviembre 2025  
**Versión**: 1.0.0

