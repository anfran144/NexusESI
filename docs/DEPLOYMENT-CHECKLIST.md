# ✅ Checklist de Despliegue - NexusESI

Esta lista verifica que todo esté configurado correctamente antes y después del despliegue.

## 📋 Pre-Despliegue

### 1. Servicios Externos Configurados

#### AWS S3
- [ ] Bucket S3 creado
- [ ] Nombre del bucket anotado
- [ ] CORS configurado correctamente
- [ ] Bucket policy configurada (lectura pública)
- [ ] Usuario IAM creado
- [ ] Access Key ID y Secret Key guardados
- [ ] Permisos correctos asignados al usuario

#### Pusher
- [ ] App creada en Pusher Dashboard
- [ ] App ID anotado
- [ ] App Key anotado
- [ ] App Secret anotado
- [ ] Cluster anotado

#### SendGrid
- [ ] Cuenta creada
- [ ] API Key generado y guardado
- [ ] Email de remitente verificado
- [ ] Dominio verificado (opcional pero recomendado)

#### Railway
- [ ] Cuenta creada
- [ ] Método de pago configurado
- [ ] Repositorio GitHub accesible

### 2. Repositorio Git

- [ ] Código subido a GitHub/GitLab
- [ ] Rama principal actualizada
- [ ] `.env` NO incluido en el repositorio
- [ ] `.gitignore` configurado correctamente
- [ ] Archivos de configuración Railway incluidos:
  - [ ] `Backend/Procfile`
  - [ ] `Backend/railway.toml`
  - [ ] `Backend/nixpacks.toml`
  - [ ] `Backend/scripts/` con permisos correctos

### 3. Documentación

- [ ] README.md actualizado
- [ ] Variables de entorno documentadas
- [ ] Guía de deployment disponible
- [ ] Configuración de S3 documentada

## 🚂 Durante el Despliegue en Railway

### Paso 1: Backend - Servicio Web

- [ ] Proyecto creado en Railway
- [ ] Repositorio conectado
- [ ] Service creado para Backend
- [ ] Root directory configurado: `/Backend`
- [ ] PostgreSQL agregado al proyecto
- [ ] Variables de entorno configuradas:
  - [ ] `APP_NAME`
  - [ ] `APP_ENV=production`
  - [ ] `APP_DEBUG=false`
  - [ ] `APP_URL` (actualizar después del deploy)
  - [ ] `FRONTEND_URL` (actualizar después)
  - [ ] `DB_CONNECTION=pgsql`
  - [ ] AWS S3 credentials
  - [ ] `FILESYSTEM_DISK=s3`
  - [ ] Pusher credentials
  - [ ] SendGrid API key
  - [ ] `QUEUE_CONNECTION=database`
- [ ] Primer deploy ejecutado
- [ ] APP_KEY generado:
  ```bash
  php artisan key:generate --show
  ```
- [ ] APP_KEY agregado a variables de entorno
- [ ] Migraciones ejecutadas:
  ```bash
  php artisan migrate --force
  ```
- [ ] Seeders ejecutados (si aplica):
  ```bash
  php artisan db:seed --force
  ```
- [ ] URL del servicio anotada

### Paso 2: Queue Worker

- [ ] Servicio "Queue Worker" creado
- [ ] Mismo repositorio conectado
- [ ] Root directory: `/Backend`
- [ ] Custom Start Command configurado:
  ```bash
  bash scripts/start-queue-worker.sh
  ```
- [ ] Todas las variables copiadas del servicio Web
- [ ] Service desplegado
- [ ] Logs verificados (debe mostrar "Processing")

### Paso 3: Scheduler

- [ ] Servicio "Scheduler" creado
- [ ] Mismo repositorio conectado
- [ ] Root directory: `/Backend`
- [ ] Custom Start Command configurado:
  ```bash
  bash scripts/start-scheduler.sh
  ```
- [ ] Todas las variables copiadas del servicio Web
- [ ] Service desplegado
- [ ] Logs verificados (debe ejecutarse cada minuto)

### Paso 4: Frontend

- [ ] Servicio "Frontend" creado
- [ ] Mismo repositorio conectado
- [ ] Root directory: `/Frontend`
- [ ] Build Command:
  ```bash
  npm install && npm run build
  ```
- [ ] Start Command:
  ```bash
  npm run preview -- --host 0.0.0.0 --port $PORT
  ```
- [ ] Variables de entorno configuradas:
  - [ ] `VITE_API_URL` (URL del backend)
  - [ ] `VITE_PUSHER_KEY`
  - [ ] `VITE_PUSHER_CLUSTER`
  - [ ] `VITE_PUSHER_ENCRYPTED=true`
- [ ] Service desplegado
- [ ] URL del servicio anotada

### Paso 5: Actualizar URLs Cruzadas

- [ ] Frontend URL copiada
- [ ] Backend actualizado con `FRONTEND_URL`
- [ ] Backend actualizado con `CORS_ALLOWED_ORIGINS`
- [ ] Backend redesplegado
- [ ] Frontend actualizado con `VITE_API_URL`
- [ ] Frontend redesplegado

## ✅ Post-Despliegue - Verificación

### 1. Backend Web

#### Health Check
- [ ] Acceder a: `https://backend-url.railway.app/up`
- [ ] Respuesta: 200 OK

#### API Test
```bash
curl https://backend-url.railway.app/api/health
```
- [ ] Respuesta exitosa

#### Base de Datos
- [ ] Conectarse a Railway Dashboard → PostgreSQL
- [ ] Verificar que existen las tablas
- [ ] Verificar que hay datos (si se ejecutaron seeders)

#### Logs
- [ ] No hay errores críticos
- [ ] Server iniciado correctamente

### 2. Queue Worker

#### Verificar Logs
- [ ] Railway → Queue Worker → View Logs
- [ ] Mensaje: "Processing jobs..."
- [ ] No hay errores de conexión a BD

#### Test Funcional
- [ ] Crear una tarea en la aplicación
- [ ] Verificar en logs que se procesa el job
- [ ] Verificar que se envía notificación (si aplica)

### 3. Scheduler

#### Verificar Logs
- [ ] Railway → Scheduler → View Logs
- [ ] Mensaje cada minuto: "Running scheduled command"
- [ ] Comandos programados se ejecutan:
  - [ ] `tasks:calculate-risks`
  - [ ] `events:check-status-transitions`

### 4. Almacenamiento S3

#### Test Manual
Conectarse al Backend Terminal:
```bash
php artisan tinker
```

```php
// Test escribir
Storage::disk('s3')->put('test/hello.txt', 'Hello from Railway!');

// Test leer
Storage::disk('s3')->get('test/hello.txt');

// Test URL
Storage::disk('s3')->url('test/hello.txt');

// Test eliminar
Storage::disk('s3')->delete('test/hello.txt');
```

- [ ] Todos los tests pasaron
- [ ] Archivo visible en AWS S3 Console

#### Test en Aplicación
- [ ] Iniciar sesión en la aplicación
- [ ] Crear una tarea
- [ ] Subir un documento
- [ ] Verificar que aparece en S3
- [ ] Descargar el documento
- [ ] Verificar que se descarga correctamente

### 5. WebSocket (Pusher)

#### Pusher Debug Console
- [ ] Ir a [Pusher Dashboard](https://dashboard.pusher.com)
- [ ] Seleccionar tu app
- [ ] Ir a "Debug Console"

#### Test en Aplicación
- [ ] Abrir dos ventanas del frontend
- [ ] Iniciar sesión en ambas (usuarios diferentes)
- [ ] Realizar una acción que genere notificación
- [ ] Verificar que aparece en tiempo real
- [ ] Verificar en Pusher Console que se envió el evento

### 6. Correo Electrónico

#### Test de Recuperación de Contraseña
- [ ] Ir a "Forgot Password"
- [ ] Ingresar email válido
- [ ] Verificar que llega el correo
- [ ] Verificar que el código OTP funciona
- [ ] Cambiar contraseña exitosamente
- [ ] Verificar correo de confirmación

#### Verificar SendGrid Dashboard
- [ ] Ir a [SendGrid Dashboard](https://app.sendgrid.com)
- [ ] Activity → Ver emails enviados
- [ ] Verificar estado de entrega

### 7. Frontend

#### Navegación
- [ ] Página de login carga correctamente
- [ ] Iniciar sesión funciona
- [ ] Dashboard carga correctamente
- [ ] Todas las rutas accesibles

#### Funcionalidades Clave
- [ ] Crear evento
- [ ] Crear comité
- [ ] Crear tarea
- [ ] Subir archivo
- [ ] Recibir notificación en tiempo real
- [ ] Ver alertas de riesgo

#### Responsive
- [ ] Desktop funciona correctamente
- [ ] Tablet funciona correctamente
- [ ] Mobile funciona correctamente

### 8. Performance

#### Tiempos de Respuesta
- [ ] API responde en < 500ms (promedio)
- [ ] Frontend carga en < 3s
- [ ] Imágenes/archivos S3 cargan rápido

#### Railway Metrics
- [ ] CPU usage < 80%
- [ ] Memory usage < 80%
- [ ] No hay crashes/restarts frecuentes

## 🔒 Seguridad

### Variables de Entorno
- [ ] `APP_DEBUG=false`
- [ ] `APP_ENV=production`
- [ ] JWT_SECRET único y seguro
- [ ] Credenciales AWS correctas (solo S3)
- [ ] API Keys no expuestas en frontend

### CORS
- [ ] CORS configurado correctamente
- [ ] Solo frontend autorizado puede acceder
- [ ] No hay errores de CORS en consola

### HTTPS
- [ ] Backend usa HTTPS (Railway automático)
- [ ] Frontend usa HTTPS (Railway automático)
- [ ] Mixed content warnings resueltos

### S3 Bucket
- [ ] Solo objetos son públicos, no el bucket
- [ ] Bucket policy restrictiva
- [ ] Usuario IAM con permisos mínimos

## 📊 Monitoreo

### Railway
- [ ] Configurar alertas de downtime
- [ ] Revisar logs regularmente
- [ ] Monitorear uso de recursos

### Pusher
- [ ] Revisar uso de mensajes
- [ ] Configurar alertas de límite

### SendGrid
- [ ] Revisar tasa de entrega
- [ ] Configurar alertas de bounce

### AWS
- [ ] Configurar CloudWatch (opcional)
- [ ] Revisar costos mensualmente

## 📝 Documentación Post-Deploy

- [ ] URLs de producción documentadas
- [ ] Credenciales guardadas en gestor seguro (1Password, LastPass)
- [ ] Diagrama de arquitectura actualizado
- [ ] Procedimientos de rollback documentados
- [ ] Contactos de soporte anotados

## 🎉 Lanzamiento

- [ ] Todos los checkboxes anteriores marcados
- [ ] Equipo notificado
- [ ] Usuarios de prueba verificados
- [ ] Backup de base de datos realizado
- [ ] Plan de rollback listo

## 🚨 En Caso de Problemas

### Backend no inicia
1. Revisar logs en Railway
2. Verificar variables de entorno
3. Verificar conexión a PostgreSQL
4. Ejecutar `php artisan config:clear` en terminal

### Queue Worker no procesa jobs
1. Verificar logs del worker
2. Verificar tabla `jobs` en BD
3. Reiniciar servicio
4. Verificar variable `QUEUE_CONNECTION=database`

### Scheduler no ejecuta comandos
1. Verificar logs del scheduler
2. Verificar permisos del script
3. Revisar `bootstrap/app.php` schedule configuration

### Archivos no se suben a S3
1. Verificar credenciales AWS
2. Test manual con tinker
3. Revisar permisos IAM
4. Verificar CORS del bucket

### WebSocket no funciona
1. Verificar credenciales Pusher
2. Revisar Pusher Debug Console
3. Verificar que frontend tiene las keys correctas
4. Check browser console for errors

### Emails no llegan
1. Verificar SendGrid API Key
2. Revisar SendGrid Activity
3. Check spam folder
4. Verificar email remitente verificado

## 📞 Contactos de Soporte

- **Railway**: [railway.app/help](https://railway.app/help)
- **AWS**: Consola de soporte
- **Pusher**: [support.pusher.com](https://support.pusher.com)
- **SendGrid**: [support.sendgrid.com](https://support.sendgrid.com)

---

**Última actualización**: Noviembre 2025  
**Versión**: 1.0.0

¡Felicidades por el despliegue exitoso! 🎉

