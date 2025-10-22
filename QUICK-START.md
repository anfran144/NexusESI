# 🚀 Inicio Rápido - NexusESI

Guía rápida para subir tu proyecto a Git y desplegarlo.

## 📋 Pasos Rápidos

### 1. Subir a Git

#### Opción A: Usando PowerShell (Windows)
```powershell
# Configurar Git y subir
.\setup-git.ps1 "https://github.com/tu-usuario/NexusESI.git"
```

#### Opción B: Usando Git directamente
```bash
# Inicializar Git
git init

# Agregar archivos
git add .

# Commit inicial
git commit -m "Initial commit: NexusESI - Sistema de Gestión de Semilleros"

# Agregar repositorio remoto
git remote add origin https://github.com/tu-usuario/NexusESI.git

# Subir al repositorio
git branch -M main
git push -u origin main
```

### 2. Desplegar Localmente

#### Opción A: Usando PowerShell (Windows)
```powershell
# Desplegar en desarrollo
.\deploy.ps1 development

# Desplegar en producción
.\deploy.ps1 production
```

#### Opción B: Usando Docker Compose
```bash
# Desarrollo
docker-compose up --build -d

# Producción
docker-compose -f docker-compose.prod.yml up --build -d
```

### 3. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp env.production.example .env.production

# Editar variables importantes
nano .env.production
```

**Variables críticas:**
- `DB_PASSWORD` - Contraseña segura para MySQL
- `JWT_SECRET` - Clave secreta para JWT
- `SENDGRID_API_KEY` - API Key de SendGrid

### 4. Verificar Despliegue

```bash
# Ver estado de servicios
docker-compose ps

# Ver logs
docker-compose logs -f

# Verificar endpoints
curl http://localhost:8000/api/health  # Backend
curl http://localhost:3000             # Frontend
```

## 🌐 Despliegue en Servidor

### 1. Preparar Servidor

```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Clonar y Desplegar

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/NexusESI.git
cd NexusESI

# Configurar variables de entorno
cp env.production.example .env.production
nano .env.production

# Desplegar
./scripts/deploy-production.sh
```

### 3. Configurar Dominio (Opcional)

```bash
# Configurar DNS
# A    nexusesi.com        -> IP_DEL_SERVIDOR
# A    api.nexusesi.com    -> IP_DEL_SERVIDOR

# Configurar SSL con Let's Encrypt
certbot certonly --standalone -d nexusesi.com -d api.nexusesi.com
```

## 🔧 Comandos Útiles

### Gestión de Servicios
```bash
# Ver estado
docker-compose ps

# Ver logs
docker-compose logs -f

# Reiniciar servicio
docker-compose restart backend

# Actualizar servicios
docker-compose pull
docker-compose up --build -d
```

### Base de Datos
```bash
# Backup
docker-compose exec mysql mysqldump -u root -p nexusesi > backup.sql

# Restaurar
docker-compose exec -T mysql mysql -u root -p nexusesi < backup.sql
```

### Laravel
```bash
# Ejecutar migraciones
docker-compose exec backend php artisan migrate

# Limpiar cache
docker-compose exec backend php artisan cache:clear

# Ver logs de Laravel
docker-compose exec backend tail -f storage/logs/laravel.log
```

## 🐛 Solución de Problemas

### Error de Conexión a Base de Datos
```bash
# Verificar que MySQL esté corriendo
docker-compose ps mysql

# Ver logs de MySQL
docker-compose logs mysql
```

### Error 500 en Backend
```bash
# Ver logs de Laravel
docker-compose logs backend

# Verificar permisos
docker-compose exec backend ls -la storage/
```

### Frontend No Carga
```bash
# Verificar que el frontend esté construido
docker-compose exec frontend ls -la /usr/share/nginx/html

# Ver logs de Nginx
docker-compose logs nginx
```

## 📞 Soporte

Si tienes problemas:

1. **Revisar logs**: `docker-compose logs -f`
2. **Verificar configuración**: Revisar archivos `.env`
3. **Consultar documentación**: Revisar `/docs`
4. **Crear issue**: En el repositorio de GitHub

---

**¡Listo!** Tu proyecto NexusESI está configurado y listo para desplegar. 🎉
