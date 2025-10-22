# 🔧 Configuración de Variables de Entorno

## Variables Críticas a Configurar

### 1. **Base de Datos**
```bash
DB_DATABASE=nexusesi_prod
DB_ROOT_PASSWORD=tu_contraseña_segura_aqui
DB_USERNAME=nexusesi_user
DB_PASSWORD=tu_contraseña_segura_aqui
```

### 2. **JWT (Autenticación)**
```bash
JWT_SECRET=tu_clave_jwt_muy_segura_aqui
```

### 3. **SendGrid (Correos)**
```bash
SENDGRID_API_KEY=SG.tu_api_key_de_sendgrid_aqui
MAIL_FROM_ADDRESS=noreply@nexusesi.com
MAIL_FROM_NAME=NexusESI
```

### 4. **URLs de Producción**
```bash
APP_URL=https://nexusesi.com
```

## 🔐 Generar Claves Seguras

### Para JWT_SECRET:
```bash
# Generar clave JWT segura
php -r "echo bin2hex(random_bytes(32));"
```

### Para contraseñas de base de datos:
- Usa al menos 16 caracteres
- Incluye mayúsculas, minúsculas, números y símbolos
- Ejemplo: `MySecureDB2024!@#`

## 📧 Configurar SendGrid

1. Ve a [SendGrid](https://sendgrid.com)
2. Crea una cuenta o inicia sesión
3. Ve a Settings > API Keys
4. Crea una nueva API Key con permisos de "Mail Send"
5. Copia la clave y pégala en `SENDGRID_API_KEY`

## ✅ Verificar Configuración

Después de configurar, verifica que:
- [ ] Todas las contraseñas son seguras
- [ ] JWT_SECRET está configurado
- [ ] SendGrid API Key es válida
- [ ] URLs apuntan a tu dominio
