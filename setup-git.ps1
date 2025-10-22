# Script de PowerShell para configurar Git y subir el proyecto
# Uso: .\setup-git.ps1 [repository-url]

param(
    [string]$RepoUrl = ""
)

Write-Host "🔧 Configurando Git para NexusESI..." -ForegroundColor Green

# Verificar que Git esté instalado
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git no está instalado. Por favor instala Git primero." -ForegroundColor Red
    exit 1
}

# Inicializar repositorio Git si no existe
if (-not (Test-Path ".git")) {
    Write-Host "📁 Inicializando repositorio Git..." -ForegroundColor Yellow
    git init
} else {
    Write-Host "✅ Repositorio Git ya existe" -ForegroundColor Green
}

# Configurar Git si no está configurado
$userName = git config user.name
$userEmail = git config user.email

if (-not $userName) {
    Write-Host "⚠️  Git no está configurado. Configurando..." -ForegroundColor Yellow
    $inputName = Read-Host "Ingresa tu nombre"
    $inputEmail = Read-Host "Ingresa tu email"
    git config user.name $inputName
    git config user.email $inputEmail
}

# Agregar archivos al staging
Write-Host "📝 Agregando archivos al staging..." -ForegroundColor Yellow
git add .

# Hacer commit inicial
Write-Host "💾 Creando commit inicial..." -ForegroundColor Yellow
$commitMessage = @"
Initial commit: NexusESI - Sistema de Gestión de Semilleros de Investigación

- Backend Laravel 11 con JWT Auth
- Frontend React 18 con TypeScript  
- Sistema de roles y permisos
- Integración con SendGrid
- Configuración Docker para despliegue
- Documentación completa
"@

git commit -m $commitMessage

# Configurar repositorio remoto si se proporciona URL
if ($RepoUrl) {
    Write-Host "🔗 Configurando repositorio remoto: $RepoUrl" -ForegroundColor Yellow
    git remote add origin $RepoUrl
    
    # Subir al repositorio remoto
    Write-Host "⬆️  Subiendo al repositorio remoto..." -ForegroundColor Yellow
    git branch -M main
    git push -u origin main
    
    Write-Host "✅ Proyecto subido exitosamente a: $RepoUrl" -ForegroundColor Green
} else {
    Write-Host "⚠️  No se proporcionó URL del repositorio remoto" -ForegroundColor Yellow
    Write-Host "Para subir a un repositorio remoto, ejecuta:" -ForegroundColor Cyan
    Write-Host "git remote add origin <URL_DEL_REPOSITORIO>" -ForegroundColor White
    Write-Host "git branch -M main" -ForegroundColor White
    Write-Host "git push -u origin main" -ForegroundColor White
}

Write-Host "🎉 Configuración de Git completada!" -ForegroundColor Green
Write-Host "📝 Para ver el estado: git status" -ForegroundColor Cyan
Write-Host "📋 Para ver los commits: git log --oneline" -ForegroundColor Cyan
