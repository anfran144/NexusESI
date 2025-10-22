# 🚀 Guía de Despliegue - NexusESI

Esta guía te ayudará a desplegar NexusESI en diferentes entornos.

## 📋 Prerequisitos

### Software Requerido
- **Docker** 20.10+
- **Docker Compose** 2.0+
- **Git** 2.30+
- **Node.js** 18+ (para desarrollo local)
- **PHP** 8.2+ (para desarrollo local)
- **Composer** 2.0+ (para desarrollo local)

### Servicios Externos
- **SendGrid** - Para envío de correos electrónicos
- **Base de datos MySQL** (incluida en Docker)
- **Dominio** (opcional, para producción)

## 🏗️ Arquitectura de Despliegue

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │    │    Frontend     │    │     Backend     │
│   (Proxy)       │◄───┤   (React)       │◄───┤   (Laravel)     │
│   Port: 80/443  │    │   Port: 3000    │    │   Port: 8000    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │     MySQL       │
                    │   Port: 3306    │
                    └─────────────────┘
```

## 🚀 Despliegue Rápido

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/NexusESI.git
cd NexusESI
```

### 2. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp env.production.example .env.production

# Editar variables de entorno
nano .env.production
```

**Variables importantes a configurar:**
- `DB_PASSWORD` - Contraseña segura para MySQL
- `JWT_SECRET` - Clave secreta para JWT
- `SENDGRID_API_KEY` - API Key de SendGrid
- `MAIL_FROM_ADDRESS` - Email de envío

### 3. Desplegar con Docker

```bash
# Dar permisos de ejecución
chmod +x scripts/*.sh

# Desplegar en producción
./scripts/deploy-production.sh
```

### 4. Verificar Despliegue

```bash
# Ver estado de servicios
docker-compose -f docker-compose.prod.yml ps

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Verificar endpoints
curl http://localhost:8000/api/health  # Backend
curl http://localhost:3000             # Frontend
```

## 🔧 Configuración por Entornos

### Desarrollo Local

```bash
# Usar docker-compose.yml (configuración básica)
docker-compose up --build -d

# O ejecutar localmente
cd Backend && composer install && php artisan serve
cd Frontend && npm install && npm run dev
```

### Staging

```bash
# Usar configuración de staging
docker-compose -f docker-compose.staging.yml up --build -d
```

### Producción

```bash
# Usar configuración de producción
docker-compose -f docker-compose.prod.yml up --build -d
```

## 🌐 Configuración de Dominio

### 1. Configurar DNS

Apuntar tu dominio a la IP del servidor:
```
A    nexusesi.com        -> IP_DEL_SERVIDOR
A    api.nexusesi.com    -> IP_DEL_SERVIDOR
```

### 2. Configurar SSL

```bash
# Generar certificados SSL (usando Let's Encrypt)
certbot certonly --standalone -d nexusesi.com -d api.nexusesi.com

# Copiar certificados
cp /etc/letsencrypt/live/nexusesi.com/fullchain.pem ssl/cert.pem
cp /etc/letsencrypt/live/nexusesi.com/privkey.pem ssl/key.pem
```

### 3. Actualizar Nginx

```bash
# Editar configuración de Nginx
nano nginx/nginx.prod.conf

# Reiniciar servicios
docker-compose -f docker-compose.prod.yml restart nginx
```

## 📊 Monitoreo y Mantenimiento

### Comandos Útiles

```bash
# Ver estado de servicios
docker-compose -f docker-compose.prod.yml ps

# Ver logs en tiempo real
docker-compose -f docker-compose.prod.yml logs -f

# Ver logs de un servicio específico
docker-compose -f docker-compose.prod.yml logs -f backend

# Reiniciar un servicio
docker-compose -f docker-compose.prod.yml restart backend

# Actualizar servicios
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up --build -d
```

### Backup de Base de Datos

```bash
# Crear backup
docker-compose -f docker-compose.prod.yml exec mysql mysqldump -u root -p nexusesi_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
docker-compose -f docker-compose.prod.yml exec -T mysql mysql -u root -p nexusesi_prod < backup_file.sql
```

### Actualización de Código

```bash
# 1. Hacer backup
./scripts/backup.sh

# 2. Actualizar código
git pull origin main

# 3. Reconstruir servicios
docker-compose -f docker-compose.prod.yml up --build -d

# 4. Ejecutar migraciones
docker-compose -f docker-compose.prod.yml exec backend php artisan migrate --force
```

## 🔒 Seguridad

### Configuraciones de Seguridad

1. **Firewall**: Configurar reglas de firewall
2. **SSL**: Usar certificados SSL válidos
3. **Variables de entorno**: Nunca commitear archivos `.env`
4. **Base de datos**: Usar contraseñas seguras
5. **JWT**: Usar claves secretas fuertes

### Checklist de Seguridad

- [ ] Variables de entorno configuradas
- [ ] SSL configurado
- [ ] Firewall configurado
- [ ] Backup automático configurado
- [ ] Monitoreo configurado
- [ ] Logs configurados

## 🐛 Solución de Problemas

### Problemas Comunes

#### 1. Error de Conexión a Base de Datos

```bash
# Verificar que MySQL esté corriendo
docker-compose -f docker-compose.prod.yml ps mysql

# Ver logs de MySQL
docker-compose -f docker-compose.prod.yml logs mysql
```

#### 2. Error 500 en Backend

```bash
# Ver logs de Laravel
docker-compose -f docker-compose.prod.yml logs backend

# Verificar permisos
docker-compose -f docker-compose.prod.yml exec backend ls -la storage/
```

#### 3. Frontend No Carga

```bash
# Verificar que el frontend esté construido
docker-compose -f docker-compose.prod.yml exec frontend ls -la /usr/share/nginx/html

# Ver logs de Nginx
docker-compose -f docker-compose.prod.yml logs nginx
```

### Logs Importantes

```bash
# Logs de aplicación Laravel
docker-compose -f docker-compose.prod.yml exec backend tail -f storage/logs/laravel.log

# Logs de Nginx
docker-compose -f docker-compose.prod.yml logs nginx

# Logs de MySQL
docker-compose -f docker-compose.prod.yml logs mysql
```

## 📞 Soporte

Si encuentras problemas durante el despliegue:

1. **Revisar logs**: `docker-compose logs -f`
2. **Verificar configuración**: Revisar archivos `.env`
3. **Consultar documentación**: Revisar `/docs`
4. **Crear issue**: En el repositorio de GitHub

---

**NexusESI** - Sistema de Gestión de Semilleros de Investigación  
Versión 1.0.0 | Octubre 2025
