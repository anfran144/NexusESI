# NexusESI

> Sistema de Gestión de Semilleros de Investigación

[![Laravel](https://img.shields.io/badge/Laravel-11.x-FF2D20?logo=laravel&logoColor=white)](https://laravel.com)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)

---

## 📋 Descripción

NexusESI es un sistema completo de gestión de semilleros de investigación que permite administrar instituciones educativas, usuarios con diferentes roles, eventos académicos y más.

### Características Principales

- 🔐 **Autenticación Segura** - JWT con recuperación de contraseña vía email (SendGrid)
- 👥 **Gestión de Usuarios** - Sistema de roles y permisos con Spatie
- 🏛️ **Instituciones** - Gestión de instituciones educativas
- 🌎 **Sistema Geográfico** - Jerarquía de países, estados y ciudades
- 📅 **Eventos** - Sistema completo de eventos con comités y participantes
- 📧 **Correo Electrónico** - Integración con SendGrid para emails transaccionales

---

## 🏗️ Arquitectura

```
NexusESI/
├── Backend/          # API REST con Laravel 11
├── Frontend/         # SPA con React + TypeScript
└── docs/             # Documentación modular del proyecto
```

### Stack Tecnológico

#### Backend
- **Laravel 11.x** - Framework PHP
- **JWT Auth** - Autenticación stateless
- **Spatie Permission** - Roles y permisos
- **SendGrid** - Servicio de correo electrónico
- **MySQL** - Base de datos

#### Frontend
- **React 18.x** - Biblioteca UI
- **TypeScript** - Tipado estático
- **TanStack Router** - Enrutamiento
- **TanStack Query** - Estado del servidor
- **Shadcn/UI** - Componentes UI
- **Tailwind CSS** - Estilos

---

## 🚀 Inicio Rápido

### Prerequisitos

- PHP 8.2+
- Composer
- Node.js 18+
- MySQL 8.0+
- SendGrid API Key (para correos)

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
# Configurar SendGrid en .env

php artisan migrate --seed
php artisan serve
```

**Detalles**: Ver [Backend/README.md](Backend/README.md)

### 3. Configurar Frontend

```bash
cd Frontend
npm install
npm run dev
```

**Detalles**: Ver [Frontend/README.md](Frontend/README.md)

### 4. Acceder a la Aplicación

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000

---

## 📚 Documentación

La documentación está organizada por módulos en la carpeta `/docs`:

### Módulos del Sistema

| Módulo | Archivo | Descripción |
|--------|---------|-------------|
| **Autenticación y Correo** | [AUTENTICACION-Y-CORREO.md](docs/AUTENTICACION-Y-CORREO.md) | Sistema de autenticación JWT, recuperación de contraseña y emails |
| **Gestión de Usuarios** | [GESTION-USUARIOS.md](docs/GESTION-USUARIOS.md) | Usuarios, roles y permisos con Spatie |
| **Sistema Geográfico** | [SISTEMA-GEOGRAFICO.md](docs/SISTEMA-GEOGRAFICO.md) | Países, estados y ciudades |
| **Gestión de Instituciones** | [GESTION-INSTITUCIONES.md](docs/GESTION-INSTITUCIONES.md) | Administración de instituciones educativas |
| **Sistema de Eventos** | [SISTEMA-EVENTOS.md](docs/SISTEMA-EVENTOS.md) | Eventos, comités y participantes |

### Recursos Adicionales

- **Colección Postman**: [docs/NexusESI-Email-API.postman_collection.json](docs/NexusESI-Email-API.postman_collection.json)
- **Configuración Email**: [docs/env-email-config.example](docs/env-email-config.example)
- **Documentación Técnica Completa**: [docs/DOCUMENTACION-TECNICA-COMPLETA.md](docs/DOCUMENTACION-TECNICA-COMPLETA.md)

---

## 👥 Roles del Sistema

### Admin
- Acceso completo al sistema
- Gestión de usuarios e instituciones
- Aprobación de nuevos usuarios
- **Dashboard**: `/admin`

### Coordinator (Coordinador)
- Gestión de eventos de su institución
- Supervisión de semilleros
- **Dashboard**: `/coordinator`

### Seedbed Leader (Líder de Semillero)
- Gestión de su equipo
- Participación en eventos
- **Dashboard**: `/seedbed-leader`

---

## 🔒 Seguridad

### Autenticación
- **JWT Tokens** con expiración configurable
- **Refresh Tokens** para sesiones prolongadas
- **Rate Limiting** en endpoints críticos

### Recuperación de Contraseña
- Códigos OTP de 6 dígitos
- Expiración de 15 minutos
- Máximo 5 intentos por código
- Envío seguro vía SendGrid

### Autorización
- Control de acceso basado en roles (RBAC)
- Políticas granulares por recurso
- Middleware de autorización

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

---

## 🚢 Despliegue

### Backend (Producción)

```bash
# Optimizar configuración
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Ejecutar migraciones
php artisan migrate --force

# Optimizar composer
composer install --optimize-autoloader --no-dev
```

### Frontend (Producción)

```bash
npm run build
# Los archivos compilados estarán en dist/
```

---

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto es privado y de uso exclusivo para la institución.

---

## 📞 Soporte

Para soporte técnico o consultas:

- **Documentación**: Revisar la carpeta `/docs`
- **Issues**: Crear un issue en el repositorio
- **Email**: soporte@nexusesi.com

---

## 🗺️ Roadmap

### En Desarrollo
- [ ] Dashboard de estadísticas
- [ ] Notificaciones en tiempo real
- [ ] Exportación de reportes
- [ ] Sistema de archivos y documentos

### Futuro
- [ ] Aplicación móvil
- [ ] Integración con Microsoft Teams
- [ ] Sistema de mensajería interna
- [ ] Gamificación

---

**NexusESI** - Sistema de Gestión de Semilleros de Investigación  
Versión 1.0.0 | Octubre 2025
