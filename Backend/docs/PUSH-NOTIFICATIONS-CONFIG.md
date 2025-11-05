# Configuración de Push Notifications

Este documento explica cómo configurar y cambiar entre diferentes proveedores de push notifications en NexusESI.

## Drivers Disponibles

El sistema soporta múltiples drivers para push notifications:

- **Pusher**: Servicio cloud de WebSockets (requiere cuenta)
- **Redis**: Solución self-hosted usando Redis Pub/Sub (requiere Redis)
- **Log**: Solo para desarrollo/testing (guarda en logs)
- **Null**: Desactiva las notificaciones push
- **Ably**: Alternativa a Pusher (requiere cuenta)

## Cambiar el Driver

Para cambiar el driver, simplemente modifica la variable de entorno en tu archivo `.env`:

```env
# Usar Pusher (por defecto)
BROADCAST_CONNECTION=pusher

# Usar Redis (alternativa temporal recomendada)
BROADCAST_CONNECTION=redis

# Usar Log (solo para desarrollo)
BROADCAST_CONNECTION=log

# Desactivar push notifications
BROADCAST_CONNECTION=null
```

Después de cambiar, limpia la caché:

```bash
php artisan config:clear
php artisan cache:clear
```

## Configuración por Driver

### Pusher

Requiere configuración en `.env`:

```env
BROADCAST_CONNECTION=pusher
PUSHER_APP_KEY=tu_key
PUSHER_APP_SECRET=tu_secret
PUSHER_APP_ID=tu_app_id
PUSHER_APP_CLUSTER=us2
```

**Ventajas:**
- ✅ Fácil de usar
- ✅ Plan gratuito: 200k mensajes/día
- ✅ WebSockets confiables

**Desventajas:**
- ❌ Requiere cuenta en Pusher
- ❌ Límites en plan gratuito

### Redis (Recomendado como Alternativa Temporal)

Requiere Redis instalado y configurado en `.env`:

```env
BROADCAST_CONNECTION=redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=null
REDIS_DB=0
```

**Instalación de Redis:**

**Windows:**
```bash
# Usando Chocolatey
choco install redis-64

# O descarga desde: https://github.com/microsoftarchive/redis/releases
```

**Linux/Mac:**
```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis
```

**Iniciar Redis:**
```bash
# Windows (si instalaste como servicio, se inicia automáticamente)
redis-server

# Linux/Mac
sudo systemctl start redis
# O
redis-server
```

**Ventajas:**
- ✅ Gratis (solo necesitas Redis)
- ✅ Sin límites
- ✅ Control total
- ✅ Sin dependencias externas

**Desventajas:**
- ❌ Requiere instalar y mantener Redis
- ❌ Necesitas configurar cliente en frontend para Redis

**Nota:** Redis Pub/Sub funciona diferente a Pusher. El frontend necesita estar configurado para escuchar Redis en lugar de Pusher. Esto requiere cambios en el cliente frontend.

### Log (Solo Desarrollo)

```env
BROADCAST_CONNECTION=log
```

**Uso:**
- Solo guarda las notificaciones en los logs
- Útil para debugging
- No envía notificaciones reales

### Null (Desactivar)

```env
BROADCAST_CONNECTION=null
```

**Uso:**
- Desactiva completamente las notificaciones push
- No genera logs
- Útil para testing o si no necesitas push notifications

## Recomendación para Desarrollo

Para desarrollo local sin configuración externa:

```env
BROADCAST_CONNECTION=log
```

Esto te permitirá ver las notificaciones en los logs sin necesidad de servicios externos.

## Recomendación Temporal

Si no quieres usar Pusher por ahora:

1. **Instala Redis** (ver arriba)
2. **Configura en `.env`:**
   ```env
   BROADCAST_CONNECTION=redis
   REDIS_HOST=127.0.0.1
   REDIS_PORT=6379
   ```
3. **Inicia Redis:**
   ```bash
   redis-server
   ```
4. **Limpia caché:**
   ```bash
   php artisan config:clear
   ```

**Nota Importante:** Si usas Redis, necesitarás actualizar el frontend para escuchar Redis en lugar de Pusher. Por ahora, el backend enviará las notificaciones, pero el frontend necesitará cambios adicionales.

## Verificación

Puedes verificar qué driver está activo en los logs:

```bash
# Los logs mostrarán:
# "Broadcasting enabled with driver: redis" (o el driver configurado)
```

O verifica la configuración:

```bash
php artisan tinker
>>> config('broadcasting.default')
```

## Troubleshooting

### Redis no se conecta
- Verifica que Redis esté corriendo: `redis-cli ping` (debe responder `PONG`)
- Verifica las credenciales en `.env`
- Revisa los logs: `storage/logs/laravel.log`

### Pusher no funciona
- Verifica que las credenciales estén correctas en `.env`
- Verifica que el cluster sea correcto
- Revisa los logs para errores específicos

### No se reciben notificaciones
- Verifica que el driver esté correctamente configurado
- Revisa los logs para ver si se están enviando
- Verifica que el frontend esté configurado para el driver correcto

