# Documentación de NexusESI

> Documentación modular completa del Sistema de Gestión de Semilleros de Investigación

---

## 📚 Índice de Documentación

### Módulos del Sistema

| Módulo | Archivo | Descripción |
|--------|---------|-------------|
| **Autenticación y Correo** | [AUTENTICACION-Y-CORREO.md](AUTENTICACION-Y-CORREO.md) | Sistema de autenticación JWT, recuperación de contraseña y correos electrónicos con SendGrid |
| **Gestión de Usuarios** | [GESTION-USUARIOS.md](GESTION-USUARIOS.md) | Gestión de usuarios, sistema de roles y permisos con Spatie |
| **Sistema Geográfico** | [SISTEMA-GEOGRAFICO.md](SISTEMA-GEOGRAFICO.md) | Estructura jerárquica de países, estados y ciudades |
| **Gestión de Instituciones** | [GESTION-INSTITUCIONES.md](GESTION-INSTITUCIONES.md) | Administración de instituciones educativas |
| **Sistema de Eventos** | [SISTEMA-EVENTOS.md](SISTEMA-EVENTOS.md) | Gestión de eventos académicos con comités y participantes |

### Documentación Técnica

- **[DOCUMENTACION-TECNICA-COMPLETA.md](DOCUMENTACION-TECNICA-COMPLETA.md)** - Documentación técnica detallada del sistema completo

---

## 🛠️ Recursos Adicionales

### Testing y Desarrollo

- **[NexusESI-Email-API.postman_collection.json](NexusESI-Email-API.postman_collection.json)**  
  Colección de Postman con todos los endpoints de autenticación y correo

### Configuración

- **[env-email-config.example](env-email-config.example)**  
  Ejemplo de configuración completa para SendGrid en `.env`

---

## 📖 Estructura de la Documentación

Cada módulo contiene:

1. **Descripción General** - Vista general del módulo
2. **Estructura de Base de Datos** - Tablas y relaciones
3. **Modelos y Relaciones** - Código de los modelos Eloquent
4. **API Reference** - Endpoints y ejemplos
5. **Políticas y Seguridad** - Control de acceso y validaciones

---

## 🚀 Guías de Inicio Rápido

### Para Desarrolladores Backend

1. Ver [Backend/README.md](../Backend/README.md) para setup inicial
2. Leer [AUTENTICACION-Y-CORREO.md](AUTENTICACION-Y-CORREO.md) para configurar SendGrid
3. Revisar [GESTION-USUARIOS.md](GESTION-USUARIOS.md) para entender roles

### Para Desarrolladores Frontend

1. Ver [Frontend/README.md](../Frontend/README.md) para setup inicial
2. Revisar la estructura de módulos para entender el backend
3. Usar la colección de Postman para probar endpoints

### Para Administradores del Sistema

1. Leer [GESTION-USUARIOS.md](GESTION-USUARIOS.md) - Roles y permisos
2. Leer [GESTION-INSTITUCIONES.md](GESTION-INSTITUCIONES.md) - Gestión de instituciones
3. Leer [SISTEMA-EVENTOS.md](SISTEMA-EVENTOS.md) - Administración de eventos

---

## 📊 Diagramas y Esquemas

### Jerarquía del Sistema

```
Sistema NexusESI
├── Ubicaciones Geográficas
│   └── País → Estado → Ciudad
├── Instituciones
│   └── Pertenecen a una Ciudad
├── Usuarios
│   ├── Pertenecen a una Institución
│   └── Tienen Roles (Admin, Coordinator, Seedbed Leader)
└── Eventos
    ├── Pertenecen a una Institución
    ├── Tienen un Coordinador
    ├── Tienen Comités
    └── Tienen Participantes
```

### Roles y Permisos

```
Admin
├── Gestión completa de usuarios
├── Gestión de instituciones
├── Gestión de ubicaciones
└── Acceso a todos los eventos

Coordinator
├── Gestión de eventos de su institución
├── Ver reportes
└── Gestión de comités

Seedbed Leader
├── Participar en eventos
├── Ver eventos de su institución
└── Gestión de su equipo
```

---

## 🔍 Buscar en la Documentación

### Por Funcionalidad

| Busco... | Ver documento... |
|----------|------------------|
| Cómo autenticar usuarios | [AUTENTICACION-Y-CORREO.md](AUTENTICACION-Y-CORREO.md) |
| Cómo enviar emails | [AUTENTICACION-Y-CORREO.md](AUTENTICACION-Y-CORREO.md) |
| Cómo crear roles | [GESTION-USUARIOS.md](GESTION-USUARIOS.md) |
| Cómo asignar permisos | [GESTION-USUARIOS.md](GESTION-USUARIOS.md) |
| Cómo gestionar ubicaciones | [SISTEMA-GEOGRAFICO.md](SISTEMA-GEOGRAFICO.md) |
| Cómo crear instituciones | [GESTION-INSTITUCIONES.md](GESTION-INSTITUCIONES.md) |
| Cómo crear eventos | [SISTEMA-EVENTOS.md](SISTEMA-EVENTOS.md) |
| Cómo gestionar participantes | [SISTEMA-EVENTOS.md](SISTEMA-EVENTOS.md) |

### Por Tecnología

| Tecnología | Documento |
|------------|-----------|
| JWT Auth | [AUTENTICACION-Y-CORREO.md](AUTENTICACION-Y-CORREO.md) |
| SendGrid | [AUTENTICACION-Y-CORREO.md](AUTENTICACION-Y-CORREO.md) |
| Spatie Permission | [GESTION-USUARIOS.md](GESTION-USUARIOS.md) |
| Eloquent Relations | Todos los módulos |
| API Resources | [SISTEMA-EVENTOS.md](SISTEMA-EVENTOS.md) |

---

## 🔄 Actualizaciones

Esta documentación se mantiene actualizada con cada cambio en el sistema.

**Última actualización**: 21 de Octubre, 2025  
**Versión**: 1.0.0

---

## 📞 Soporte

Si tienes dudas sobre la documentación:

1. Revisa el módulo correspondiente
2. Consulta la documentación técnica completa
3. Revisa los ejemplos en la colección de Postman
4. Contacta al equipo de desarrollo

---

**NexusESI Documentation** - Sistema de Gestión de Semilleros de Investigación
