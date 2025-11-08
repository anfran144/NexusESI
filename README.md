# NexusESI

> Sistema de Gestión de Semilleros de Investigación - Plataforma Multi-Institucional

[![Laravel](https://img.shields.io/badge/Laravel-11.x-FF2D20?logo=laravel&logoColor=white)](https://laravel.com)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Status](https://img.shields.io/badge/Status-100%25_Completo-success)]()

---

## 📋 Descripción

NexusESI es una plataforma completa para la gestión colaborativa de eventos académicos en semilleros de investigación. El sistema se encarga de la **fase de planificación** de eventos, proporcionando herramientas para la coordinación, asignación de tareas, y seguimiento de progreso.

### ✨ Características Principales

- 🔐 **Autenticación Segura** - JWT con recuperación de contraseña vía email (SendGrid)
- 👥 **Gestión de Usuarios** - Sistema de roles y permisos granulares
- 🏛️ **Instituciones** - Gestión de instituciones educativas con ubicación geográfica
- 🌎 **Sistema Geográfico** - Jerarquía completa de países, estados y ciudades
- 📅 **Eventos y Comités** - Sistema completo de eventos con comités de trabajo
- ✅ **Sistema de Tareas** - Gestión de tareas con cálculo automático de riesgos
- 🚨 **Sistema de Alertas** - Notificaciones automáticas preventivas y críticas
- 📧 **Correo Electrónico** - Integración con SendGrid para notificaciones
- 🔔 **Tiempo Real** - Notificaciones instantáneas vía WebSockets (Pusher)
- ⏰ **Scheduler Automático** - Cálculo automático de riesgos cada 24 horas

---

## 🏗️ Arquitectura

```
NexusESI/
├── Backend/              # API REST con Laravel 12
│   ├── app/
│   ├── routes/
│   ├── database/
│   ├── railway/          # Scripts para despliegue en Railway (app/worker/cron)
│   └── config/
├── Frontend/             # SPA con React + TypeScript
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── hooks/
│   └── public/
└── docs/                 # Documentación
    ├── api/              # Documentación de API
    ├── legacy/           # Documentos históricos
    └── changelogs/       # Registro de cambios
```

### Despliegue en Railway (Majestic Monolith)

```
Railway Project: NexusESI
├── App Service      # HTTP + Web API (usa railway/init-app.sh como pre-deploy)
├── Worker Service   # Procesa trabajos de cola (railway/run-worker.sh)
├── Cron Service     # Scheduler cada minuto (railway/run-cron.sh)
└── MySQL Service    # Base de datos gestionada por Railway
```

Cada servicio comparte el mismo repositorio (directorio raíz `Backend/`) y las mismas variables de entorno de producción. Los scripts en `Backend/railway/` encapsulan las tareas necesarias para cada rol, siguiendo la guía oficial de Railway para Laravel.

### Stack Tecnológico

#### Backend
- **Laravel 11.x** - Framework PHP
- **JWT Auth** - Autenticación stateless
- **Spatie Permission** - Roles y permisos granulares
- **SendGrid** - Servicio de correo electrónico
- **Pusher** - WebSockets para tiempo real
- **MySQL** - Base de datos

#### Frontend
- **React 18.x** - Biblioteca UI
- **TypeScript** - Tipado estático
- **TanStack Router** - Enrutamiento
- **TanStack Query** - Estado del servidor
- **Zustand** - Gestión de estado
- **Shadcn/UI** - Componentes UI
- **Tailwind CSS** - Estilos
- **Pusher-js** - Cliente WebSockets

---

## 🚀 Inicio Rápido

### Prerequisitos

- PHP 8.2+
- Composer 2.x
- Node.js 18+
- MySQL 8.0+
- SendGrid API Key
- Pusher Account (opcional)

### 1. Clonar Repositorio

```bash
git clone https://github.com/tu-usuario/NexusESI.git
cd NexusESI
```

### 2. Configurar Backend

```bash
cd Backend
composer install
cp .env.example .env
php artisan key:generate
php artisan jwt:secret

# Configurar base de datos en .env
php artisan migrate --seed
php artisan serve
```

**📖 Detalles**: Ver [Backend/README.md](Backend/README.md)

### 3. Configurar Frontend

```bash
cd Frontend
npm install
npm run dev
```

**📖 Detalles**: Ver [Frontend/README.md](Frontend/README.md)

### 4. Acceder a la Aplicación

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api

---

## 👥 Roles del Sistema

### 🔴 Admin
- Gestión completa de usuarios e instituciones
- Aprobación de nuevos usuarios
- Dashboard: `/admin`

### 🟡 Coordinator (Coordinador)
- Gestión de eventos de su institución
- Creación de comités y asignación de tareas
- Supervisión de progreso y resolución de incidencias
- Dashboard: `/coordinator`

### 🟢 Seedbed Leader (Líder de Semillero)
- Visualización de tareas asignadas
- Reporte de progreso y avances
- Reporte de incidencias
- Dashboard: `/seedbed-leader`

---

## 📚 Documentación

### 📖 Documentación Principal

| Documento | Descripción |
|-----------|-------------|
| **[NexusEsi.md](NexusEsi.md)** | Contexto y arquitectura del sistema |
| **[ImplementacionNexusEsi.md](ImplementacionNexusEsi.md)** | Estado real de implementación (100% completo) |
| **[DEVELOPMENT-GUIDELINES.md](DEVELOPMENT-GUIDELINES.md)** | Guía para desarrollar nuevas funcionalidades |
| **[docs/API-DOCUMENTATION-FRONTEND.md](docs/API-DOCUMENTATION-FRONTEND.md)** | Documentación completa de API para frontend |

### 📁 Módulos Específicos (en `/docs`)

| Módulo | Archivo | Descripción |
|--------|---------|-------------|
| **Autenticación** | [AUTENTICACION-Y-CORREO.md](docs/AUTENTICACION-Y-CORREO.md) | JWT, recuperación de contraseña y emails |
| **Usuarios** | [GESTION-USUARIOS.md](docs/GESTION-USUARIOS.md) | Roles, permisos y gestión de usuarios |
| **Geografía** | [SISTEMA-GEOGRAFICO.md](docs/SISTEMA-GEOGRAFICO.md) | Países, estados y ciudades |
| **Instituciones** | [GESTION-INSTITUCIONES.md](docs/GESTION-INSTITUCIONES.md) | Administración de instituciones |
| **Eventos** | [SISTEMA-EVENTOS.md](docs/SISTEMA-EVENTOS.md) | Eventos, comités y participantes |
| **Técnica Completa** | [DOCUMENTACION-TECNICA-COMPLETA.md](docs/DOCUMENTACION-TECNICA-COMPLETA.md) | Documentación técnica detallada |

### 🔧 Recursos Adicionales

- **Colección Postman**: [docs/NexusESI-Email-API.postman_collection.json](docs/NexusESI-Email-API.postman_collection.json)
- **Configuración Email**: [docs/env-email-config.example](docs/env-email-config.example)
- **Testing Guide**: [Frontend/TESTING-GUIDE.md](Frontend/TESTING-GUIDE.md)

---

## 🔒 Seguridad

### Autenticación
- **JWT Tokens** con expiración configurable (60 minutos)
- **Refresh Tokens** para renovación automática
- **Rate Limiting** en endpoints críticos

### Recuperación de Contraseña
- Códigos OTP de 6 dígitos
- Expiración de 15 minutos
- Máximo 5 intentos por código
- Envío seguro vía SendGrid

### Autorización (Permission-First)
- Control de acceso basado en permisos granulares
- Políticas por recurso y por institución
- Middleware de autorización en todos los endpoints

---

## 🧪 Testing

### Backend
```bash
cd Backend
php artisan test
```

### Frontend
```bash
cd Frontend
npm run test
```

**📖 Detalles**: Ver [Frontend/TESTING-GUIDE.md](Frontend/TESTING-GUIDE.md)

---

## 🚢 Despliegue

### Railway (Recomendado) 🚂

NexusESI está configurado para despliegue en Railway siguiendo el enfoque **Majestic Monolith** oficial de Laravel. El proyecto se ejecuta mediante cuatro servicios coordinados:

| Servicio | Rol | Script asociado |
|----------|-----|-----------------|
| **App Service** | Endpoints HTTP y Web API | `railway/init-app.sh` (pre-deploy) |
| **Worker Service** | Procesa la cola (`queue:work`) | `railway/run-worker.sh` |
| **Cron Service** | Ejecuta el scheduler (`schedule:run`) cada minuto | `railway/run-cron.sh` |
| **MySQL** | Base de datos gestionada por Railway | n/a |

**Guías de despliegue:**
- 📖 **[RAILWAY-QUICKSTART.md](RAILWAY-QUICKSTART.md)** - Guía rápida (15 min)
- 📚 **[RAILWAY-DEPLOYMENT.md](RAILWAY-DEPLOYMENT.md)** - Documentación completa

**Características:**
- ✅ Despliegue automático desde Git
- ✅ Servicios separados para HTTP, workers y cron (escalan de forma independiente)
- ✅ MySQL y HTTPS incluidos en Railway
- ✅ Logs estructurados vía `LOG_CHANNEL=stderr`
- ✅ Coste aproximado: ~$6-7/mes en plan Starter (3 servicios + MySQL)

**Variables de entorno clave (compartidas entre servicios):**
```
APP_NAME, APP_ENV, APP_DEBUG, APP_KEY, APP_URL, FRONTEND_URL
DB_CONNECTION, DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD
JWT_SECRET, JWT_TTL, JWT_REFRESH_TTL
MAIL_MAILER, SENDGRID_API_KEY, MAIL_FROM_ADDRESS, MAIL_FROM_NAME
PUSHER_APP_ID, PUSHER_APP_KEY, PUSHER_APP_SECRET, PUSHER_APP_CLUSTER
QUEUE_CONNECTION=database
LOG_CHANNEL=stderr
LOG_STDERR_FORMATTER=\Monolog\Formatter\JsonFormatter
```

Los servicios Worker y Cron comparten exactamente las mismas variables que el App Service. Railway permite copiarlas mediante el editor RAW de variables.

### Manual (Alternativo)

#### Backend (Producción)
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan migrate --force
composer install --optimize-autoloader --no-dev
```

#### Frontend (Producción)
```bash
npm run build
# Archivos compilados en dist/
```

---

## 📊 Estado del Proyecto

### ✅ Completitud: 100%

| Módulo | Backend | Frontend | Integración | Estado |
|--------|---------|----------|-------------|--------|
| Autenticación | ✅ 100% | ✅ 100% | ✅ 100% | 🟢 |
| Usuarios | ✅ 100% | ✅ 100% | ✅ 100% | 🟢 |
| Eventos | ✅ 100% | ✅ 100% | ✅ 100% | 🟢 |
| Comités | ✅ 100% | ✅ 100% | ✅ 100% | 🟢 |
| Tareas | ✅ 100% | ✅ 100% | ✅ 100% | 🟢 |
| Alertas | ✅ 100% | ✅ 100% | ✅ 100% | 🟢 |
| Incidencias | ✅ 100% | ✅ 100% | ✅ 100% | 🟢 |
| Scheduler | ✅ 100% | N/A | ✅ 100% | 🟢 |
| Notificaciones | ✅ 100% | ✅ 100% | ✅ 100% | 🟢 |

---

## 🗺️ Roadmap

### ✅ Completado (Fase 1-3)
- Sistema de autenticación y correo
- Gestión de usuarios e instituciones
- Sistema de eventos y comités
- Sistema de tareas con cálculo automático de riesgos
- Scheduler automático
- Sistema de alertas e incidencias
- Notificaciones en tiempo real

### 🔄 Próximas Funcionalidades Opcionales
- [ ] Dashboard de estadísticas avanzado
- [ ] Exportación de reportes (PDF, Excel)
- [ ] Integración con calendarios
- [ ] Aplicación móvil
- [ ] Sistema de mensajería interna

---

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

**📖 Guía de Desarrollo**: Ver [DEVELOPMENT-GUIDELINES.md](DEVELOPMENT-GUIDELINES.md)

---

## 📄 Licencia

Este proyecto es privado y de uso exclusivo para la institución.

---

## 📞 Soporte

- **Documentación**: Revisar la carpeta `/docs`
- **Issues**: Crear un issue en el repositorio
- **Email**: soporte@nexusesi.com

---

**NexusESI** - Sistema de Gestión de Semilleros de Investigación  
Versión 2.0 | Octubre 2025 | ✅ 100% Completado - Listo para Producción
