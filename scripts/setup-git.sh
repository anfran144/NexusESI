#!/bin/bash

# Script para configurar Git y subir el proyecto
# Uso: ./scripts/setup-git.sh [repository-url]

set -e

REPO_URL=${1:-""}

echo "🔧 Configurando Git para NexusESI..."

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

# Verificar que Git esté instalado
if ! command -v git &> /dev/null; then
    print_error "Git no está instalado. Por favor instala Git primero."
    exit 1
fi

# Inicializar repositorio Git si no existe
if [ ! -d ".git" ]; then
    print_status "Inicializando repositorio Git..."
    git init
else
    print_status "Repositorio Git ya existe"
fi

# Configurar Git si no está configurado
if [ -z "$(git config user.name)" ]; then
    print_warning "Git no está configurado. Configurando..."
    read -p "Ingresa tu nombre: " USER_NAME
    read -p "Ingresa tu email: " USER_EMAIL
    git config user.name "$USER_NAME"
    git config user.email "$USER_EMAIL"
fi

# Agregar archivos al staging
print_status "Agregando archivos al staging..."
git add .

# Hacer commit inicial
print_status "Creando commit inicial..."
git commit -m "Initial commit: NexusESI - Sistema de Gestión de Semilleros de Investigación

- Backend Laravel 11 con JWT Auth
- Frontend React 18 con TypeScript
- Sistema de roles y permisos
- Integración con SendGrid
- Configuración Docker para despliegue
- Documentación completa"

# Configurar repositorio remoto si se proporciona URL
if [ -n "$REPO_URL" ]; then
    print_status "Configurando repositorio remoto: $REPO_URL"
    git remote add origin "$REPO_URL"
    
    # Subir al repositorio remoto
    print_status "Subiendo al repositorio remoto..."
    git branch -M main
    git push -u origin main
    
    print_status "✅ Proyecto subido exitosamente a: $REPO_URL"
else
    print_warning "No se proporcionó URL del repositorio remoto"
    print_status "Para subir a un repositorio remoto, ejecuta:"
    print_status "git remote add origin <URL_DEL_REPOSITORIO>"
    print_status "git branch -M main"
    print_status "git push -u origin main"
fi

print_status "🎉 Configuración de Git completada!"
print_status "📝 Para ver el estado: git status"
print_status "📋 Para ver los commits: git log --oneline"
