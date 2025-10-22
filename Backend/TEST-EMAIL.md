# 📧 Guía de Prueba de Email con SendGrid

> Comando para verificar que la configuración de SendGrid está funcionando correctamente

---

## 🚀 Uso Rápido

### Opción 1: Enviar a adiazciro@gmail.com (por defecto)

```bash
cd Backend
php artisan email:test
```

### Opción 2: Enviar a otro email

```bash
php artisan email:test otro@email.com
```

---

## ✅ Qué Hace el Comando

1. ✅ Verifica la configuración de SendGrid
2. ✅ Envía un email de prueba con template HTML y texto plano
3. ✅ Muestra información detallada de la configuración
4. ✅ Reporta errores con sugerencias si algo falla

---

## 📋 Antes de Ejecutar

### 1. Verifica tu configuración en `.env`

**NexusESI usa SendGrid Web API:**

```env
MAIL_MAILER=sendgrid
SENDGRID_API_KEY=SG.tu_sendgrid_api_key_aqui
MAIL_FROM_ADDRESS=andersonf.diaz212@umariana.edu.co
MAIL_FROM_NAME="NexusESI"
```

**Alternativa SMTP:**

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=tu_sendgrid_api_key_aqui
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@nexusesi.com
MAIL_FROM_NAME="NexusESI"
```

### 2. Limpia la caché

```bash
php artisan config:clear
```

---

## 📊 Ejemplo de Salida Exitosa

```
🚀 Enviando email de prueba...

📧 Destinatario: adiazciro@gmail.com
⚙️  Mailer: smtp
🌐 Host: smtp.sendgrid.net

✅ Email enviado exitosamente!

Verifica tu bandeja de entrada (o spam) en: adiazciro@gmail.com

📊 Detalles de la configuración:
+-------------------+-------------------------+
| Configuración     | Valor                   |
+-------------------+-------------------------+
| MAIL_MAILER       | smtp                    |
| MAIL_HOST         | smtp.sendgrid.net       |
| MAIL_PORT         | 587                     |
| MAIL_ENCRYPTION   | tls                     |
| MAIL_FROM_ADDRESS | noreply@nexusesi.com    |
| MAIL_FROM_NAME    | NexusESI                |
+-------------------+-------------------------+
```

---

## ❌ Si Hay Errores

El comando mostrará:
- ✅ Mensaje de error específico
- ✅ Sugerencias de configuración
- ✅ Stack trace (si `APP_DEBUG=true`)

### Errores Comunes

#### 1. "Failed to authenticate"
**Problema**: API Key incorrecta

**Solución**:
```env
# Verifica que tu API Key sea correcta
MAIL_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### 2. "Could not resolve host"
**Problema**: Sin conexión a internet o DNS

**Solución**:
- Verifica tu conexión a internet
- Prueba: `telnet smtp.sendgrid.net 587`

#### 3. "Connection refused"
**Problema**: Puerto bloqueado

**Solución**:
- Verifica firewall
- Intenta con puerto 465 (SSL):
  ```env
  MAIL_PORT=465
  MAIL_ENCRYPTION=ssl
  ```

---

## 📁 Archivos Creados

### 1. Comando
- `app/Console/Commands/SendTestEmail.php`

### 2. Mailable
- `app/Mail/TestMail.php`

### 3. Templates
- `resources/views/emails/test.blade.php` (HTML)
- `resources/views/emails/test-text.blade.php` (Texto plano)

---

## 🧹 Limpieza (Opcional)

Si quieres eliminar estos archivos después de probar:

```bash
# Eliminar comando
rm app/Console/Commands/SendTestEmail.php

# Eliminar Mailable
rm app/Mail/TestMail.php

# Eliminar templates
rm resources/views/emails/test.blade.php
rm resources/views/emails/test-text.blade.php

# Eliminar esta guía
rm TEST-EMAIL.md
```

---

## 📧 Contenido del Email de Prueba

El email incluye:
- ✅ Diseño responsive moderno
- ✅ Badge de éxito
- ✅ Información del sistema
- ✅ Timestamp del envío
- ✅ Lista de verificaciones
- ✅ Versiones HTML y texto plano

---

## 🔍 Verificación en SendGrid Dashboard

1. Inicia sesión en [SendGrid](https://app.sendgrid.com)
2. Ve a **Activity Feed**
3. Busca el email reciente
4. Verifica el estado: "Delivered" ✅

---

## 💡 Tips

### En Desarrollo
```env
# Para ver emails en logs en lugar de enviarlos
MAIL_MAILER=log

# Los emails se guardan en:
# storage/logs/laravel.log
```

### En Producción
```env
# Usar SendGrid SMTP
MAIL_MAILER=smtp
MAIL_HOST=smtp.sendgrid.net
```

---

## 📞 Soporte

Si tienes problemas:

1. Revisa esta guía
2. Consulta [docs/AUTENTICACION-Y-CORREO.md](../docs/AUTENTICACION-Y-CORREO.md)
3. Revisa [SendGrid Documentation](https://docs.sendgrid.com)

---

**Comando creado**: 21 de Octubre, 2025  
**Propósito**: Verificación de configuración de SendGrid  
**Destinatario por defecto**: adiazciro@gmail.com

