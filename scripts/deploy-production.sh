#!/bin/bash

# Script de despliegue para producción
# Uso: ./scripts/deploy-production.sh

set -e

echo "🚀 Desplegando NexusESI en producción..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que el archivo de configuración de producción existe
if [ ! -f ".env.production" ]; then
    print_error "Archivo .env.production no encontrado"
    print_status "Copia env.production.example a .env.production y configura las variables"
    exit 1
fi

# Cargar variables de entorno de producción
export $(cat .env.production | grep -v '^#' | xargs)

# Verificar que Docker esté instalado
if ! command -v docker &> /dev/null; then
    print_error "Docker no está instalado"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose no está instalado"
    exit 1
fi

# Crear directorios necesarios
print_status "Creando directorios necesarios..."
mkdir -p ssl
mkdir -p mysql/conf.d
mkdir -p nginx/conf.d

# Detener servicios existentes
print_status "Deteniendo servicios existentes..."
docker-compose -f docker-compose.prod.yml down --remove-orphans || true

# Limpiar sistema Docker
print_status "Limpiando sistema Docker..."
docker system prune -f

# Construir y levantar servicios de producción
print_status "Construyendo y levantando servicios de producción..."
docker-compose -f docker-compose.prod.yml up --build -d

# Esperar a que los servicios estén listos
print_status "Esperando a que los servicios estén listos..."
sleep 60

# Ejecutar migraciones
print_status "Ejecutando migraciones..."
docker-compose -f docker-compose.prod.yml exec backend php artisan migrate --force

# Optimizar Laravel para producción
print_status "Optimizando Laravel para producción..."
docker-compose -f docker-compose.prod.yml exec backend php artisan config:cache
docker-compose -f docker-compose.prod.yml exec backend php artisan route:cache
docker-compose -f docker-compose.prod.yml exec backend php artisan view:cache

# Verificar estado de los servicios
print_status "Verificando estado de los servicios..."
docker-compose -f docker-compose.prod.yml ps

# Verificar que los servicios estén funcionando
print_status "Verificando servicios..."

# Verificar backend
if curl -f http://localhost:8000/api/health &> /dev/null; then
    print_status "✅ Backend funcionando correctamente"
else
    print_warning "⚠️  Backend no responde"
fi

# Verificar frontend
if curl -f http://localhost:3000 &> /dev/null; then
    print_status "✅ Frontend funcionando correctamente"
else
    print_warning "⚠️  Frontend no responde"
fi

print_status "🎉 Despliegue en producción completado!"
print_status "📱 Frontend: http://localhost:3000"
print_status "🔧 Backend API: http://localhost:8000"
print_status "📊 Estado: docker-compose -f docker-compose.prod.yml ps"
print_status "📝 Logs: docker-compose -f docker-compose.prod.yml logs -f"
