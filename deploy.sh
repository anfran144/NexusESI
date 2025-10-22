#!/bin/bash

# Script de despliegue para NexusESI
# Uso: ./deploy.sh [environment]
# environment: development, staging, production

set -e

ENVIRONMENT=${1:-production}
PROJECT_NAME="nexusesi"

echo "🚀 Iniciando despliegue de NexusESI en modo: $ENVIRONMENT"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que Docker esté instalado
if ! command -v docker &> /dev/null; then
    print_error "Docker no está instalado. Por favor instala Docker primero."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose no está instalado. Por favor instala Docker Compose primero."
    exit 1
fi

# Crear directorios necesarios
print_status "Creando directorios necesarios..."
mkdir -p ssl
mkdir -p Backend/docker
mkdir -p Frontend/docker

# Configurar variables de entorno según el ambiente
if [ "$ENVIRONMENT" = "production" ]; then
    print_status "Configurando para producción..."
    export COMPOSE_PROJECT_NAME=${PROJECT_NAME}_prod
elif [ "$ENVIRONMENT" = "staging" ]; then
    print_status "Configurando para staging..."
    export COMPOSE_PROJECT_NAME=${PROJECT_NAME}_staging
else
    print_status "Configurando para desarrollo..."
    export COMPOSE_PROJECT_NAME=${PROJECT_NAME}_dev
fi

# Detener contenedores existentes
print_status "Deteniendo contenedores existentes..."
docker-compose down --remove-orphans || true

# Limpiar imágenes no utilizadas (solo en producción)
if [ "$ENVIRONMENT" = "production" ]; then
    print_status "Limpiando imágenes no utilizadas..."
    docker system prune -f
fi

# Construir y levantar servicios
print_status "Construyendo y levantando servicios..."
docker-compose up --build -d

# Esperar a que los servicios estén listos
print_status "Esperando a que los servicios estén listos..."
sleep 30

# Verificar estado de los servicios
print_status "Verificando estado de los servicios..."
docker-compose ps

# Ejecutar migraciones de base de datos
print_status "Ejecutando migraciones de base de datos..."
docker-compose exec backend php artisan migrate --force

# Ejecutar seeders (solo en desarrollo y staging)
if [ "$ENVIRONMENT" != "production" ]; then
    print_status "Ejecutando seeders..."
    docker-compose exec backend php artisan db:seed
fi

# Optimizar Laravel para producción
if [ "$ENVIRONMENT" = "production" ]; then
    print_status "Optimizando Laravel para producción..."
    docker-compose exec backend php artisan config:cache
    docker-compose exec backend php artisan route:cache
    docker-compose exec backend php artisan view:cache
fi

# Verificar que los servicios estén funcionando
print_status "Verificando que los servicios estén funcionando..."

# Verificar backend
if curl -f http://localhost:8000/api/health &> /dev/null; then
    print_status "✅ Backend funcionando correctamente"
else
    print_warning "⚠️  Backend no responde en el puerto 8000"
fi

# Verificar frontend
if curl -f http://localhost:3000 &> /dev/null; then
    print_status "✅ Frontend funcionando correctamente"
else
    print_warning "⚠️  Frontend no responde en el puerto 3000"
fi

print_status "🎉 Despliegue completado!"
print_status "📱 Frontend: http://localhost:3000"
print_status "🔧 Backend API: http://localhost:8000"
print_status "📊 Estado de servicios: docker-compose ps"
print_status "📝 Logs: docker-compose logs -f"
