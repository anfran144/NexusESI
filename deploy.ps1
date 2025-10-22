# Script de PowerShell para desplegar NexusESI
# Uso: .\deploy.ps1 [environment]
# environment: development, staging, production

param(
    [string]$Environment = "production"
)

Write-Host "🚀 Iniciando despliegue de NexusESI en modo: $Environment" -ForegroundColor Green

# Verificar que Docker esté instalado
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker no está instalado. Por favor instala Docker primero." -ForegroundColor Red
    exit 1
}

if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker Compose no está instalado. Por favor instala Docker Compose primero." -ForegroundColor Red
    exit 1
}

# Crear directorios necesarios
Write-Host "📁 Creando directorios necesarios..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "ssl" | Out-Null
New-Item -ItemType Directory -Force -Path "Backend\docker" | Out-Null
New-Item -ItemType Directory -Force -Path "Frontend\docker" | Out-Null

# Configurar variables de entorno según el ambiente
if ($Environment -eq "production") {
    Write-Host "⚙️  Configurando para producción..." -ForegroundColor Yellow
    $env:COMPOSE_PROJECT_NAME = "nexusesi_prod"
    $composeFile = "docker-compose.prod.yml"
} elseif ($Environment -eq "staging") {
    Write-Host "⚙️  Configurando para staging..." -ForegroundColor Yellow
    $env:COMPOSE_PROJECT_NAME = "nexusesi_staging"
    $composeFile = "docker-compose.staging.yml"
} else {
    Write-Host "⚙️  Configurando para desarrollo..." -ForegroundColor Yellow
    $env:COMPOSE_PROJECT_NAME = "nexusesi_dev"
    $composeFile = "docker-compose.yml"
}

# Detener contenedores existentes
Write-Host "🛑 Deteniendo contenedores existentes..." -ForegroundColor Yellow
docker-compose -f $composeFile down --remove-orphans 2>$null

# Limpiar imágenes no utilizadas (solo en producción)
if ($Environment -eq "production") {
    Write-Host "🧹 Limpiando imágenes no utilizadas..." -ForegroundColor Yellow
    docker system prune -f
}

# Construir y levantar servicios
Write-Host "🔨 Construyendo y levantando servicios..." -ForegroundColor Yellow
docker-compose -f $composeFile up --build -d

# Esperar a que los servicios estén listos
Write-Host "⏳ Esperando a que los servicios estén listos..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Verificar estado de los servicios
Write-Host "📊 Verificando estado de los servicios..." -ForegroundColor Yellow
docker-compose -f $composeFile ps

# Ejecutar migraciones de base de datos
Write-Host "🗄️  Ejecutando migraciones de base de datos..." -ForegroundColor Yellow
docker-compose -f $composeFile exec backend php artisan migrate --force

# Ejecutar seeders (solo en desarrollo y staging)
if ($Environment -ne "production") {
    Write-Host "🌱 Ejecutando seeders..." -ForegroundColor Yellow
    docker-compose -f $composeFile exec backend php artisan db:seed
}

# Optimizar Laravel para producción
if ($Environment -eq "production") {
    Write-Host "⚡ Optimizando Laravel para producción..." -ForegroundColor Yellow
    docker-compose -f $composeFile exec backend php artisan config:cache
    docker-compose -f $composeFile exec backend php artisan route:cache
    docker-compose -f $composeFile exec backend php artisan view:cache
}

# Verificar que los servicios estén funcionando
Write-Host "🔍 Verificando que los servicios estén funcionando..." -ForegroundColor Yellow

# Verificar backend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Backend funcionando correctamente" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backend no responde en el puerto 8000" -ForegroundColor Yellow
}

# Verificar frontend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Frontend funcionando correctamente" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Frontend no responde en el puerto 3000" -ForegroundColor Yellow
}

Write-Host "🎉 Despliegue completado!" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 Backend API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "📊 Estado de servicios: docker-compose -f $composeFile ps" -ForegroundColor Cyan
Write-Host "📝 Logs: docker-compose -f $composeFile logs -f" -ForegroundColor Cyan
