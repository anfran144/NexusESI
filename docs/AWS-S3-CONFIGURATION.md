# ☁️ Configuración de AWS S3 para NexusESI

Esta guía detalla cómo configurar AWS S3 para el almacenamiento de archivos en NexusESI.

## ¿Por qué S3?

Railway y otros servicios de hosting modernos tienen **almacenamiento efímero**, lo que significa que:
- Los archivos guardados en el disco se pierden al redeployar
- Cada instancia tiene su propio sistema de archivos
- No es posible persistir archivos localmente

**S3 de AWS** proporciona:
- ✅ Almacenamiento persistente
- ✅ Alta disponibilidad (99.99%)
- ✅ Escalabilidad automática
- ✅ CDN integrado con CloudFront
- ✅ Bajo costo

## 🎯 Tipos de Archivos que se Almacenan

NexusESI almacena los siguientes tipos de archivos en S3:

### 1. Documentos de Tareas
- **Ruta**: `task-documents/{task_id}/`
- **Tipos**: PDF, DOC, DOCX, XLS, XLSX
- **Ejemplo**: Entregables de tareas, reportes, presentaciones

### 2. Documentos de Eventos
- **Ruta**: `event-documents/{event_id}/`
- **Tipos**: PDF, DOC, DOCX, XLS, XLSX
- **Ejemplo**: Convocatorias, reglamentos, formatos

### 3. Archivos Exportados
- **Ruta**: `exports/`
- **Tipos**: XLSX, CSV, PDF
- **Ejemplo**: Reportes generados, exportaciones de datos

### 4. Imágenes
- **Ruta**: `images/`
- **Tipos**: JPG, PNG, WEBP
- **Ejemplo**: Logos de instituciones, fotos de perfil

## 📝 Paso a Paso: Configuración Completa

### Paso 1: Crear Cuenta AWS

1. Ir a [aws.amazon.com](https://aws.amazon.com)
2. Clic en "Crear una cuenta de AWS"
3. Completar el proceso de registro (requiere tarjeta de crédito)
4. Iniciar sesión en la [AWS Console](https://console.aws.amazon.com)

### Paso 2: Crear Bucket S3

#### 2.1. Acceder a S3

1. En la AWS Console, buscar "S3" en la barra de búsqueda
2. Clic en "S3" para abrir el servicio

#### 2.2. Crear Nuevo Bucket

1. Clic en "Create bucket"
2. Configurar:

**General Configuration:**
```
Bucket name: nexusesi-production
(debe ser único a nivel mundial)

AWS Region: us-east-1 (N. Virginia)
(seleccionar la región más cercana a tus usuarios)
```

**Object Ownership:**
```
✓ ACLs disabled (recommended)
```

**Block Public Access settings:**
```
⚠️ IMPORTANTE: Desmarcar estas opciones:
□ Block all public access

Específicamente:
□ Block public access to buckets and objects granted through new access control lists (ACLs)
□ Block public access to buckets and objects granted through any access control lists (ACLs)
□ Block public access to buckets and objects granted through new public bucket or access point policies
□ Block public and cross-account access to buckets and objects through any public bucket or access point policies
```

✓ Marcar: "I acknowledge that the current settings might result in this bucket and the objects within becoming public"

**Bucket Versioning:**
```
○ Disable (por ahora)
```

**Tags (opcional):**
```
Key: Project
Value: NexusESI

Key: Environment
Value: Production
```

**Default encryption:**
```
○ Amazon S3 managed keys (SSE-S3)
```

3. Clic en "Create bucket"

### Paso 3: Configurar CORS

El CORS permite que el frontend acceda a los archivos desde diferentes dominios.

1. Seleccionar el bucket creado
2. Ir a la pestaña "Permissions"
3. Scroll hasta "Cross-origin resource sharing (CORS)"
4. Clic en "Edit"
5. Pegar esta configuración:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "DELETE",
            "HEAD"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": [
            "ETag",
            "x-amz-meta-custom-header"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

6. Clic en "Save changes"

**Nota:** En producción, puedes restringir `AllowedOrigins` a tu dominio específico:
```json
"AllowedOrigins": [
    "https://tu-frontend.railway.app",
    "https://tudominio.com"
]
```

### Paso 4: Configurar Bucket Policy

La política del bucket controla quién puede acceder a los objetos.

1. En la pestaña "Permissions"
2. Scroll hasta "Bucket policy"
3. Clic en "Edit"
4. Pegar esta política:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::nexusesi-production/*"
        }
    ]
}
```

⚠️ **Importante**: Reemplazar `nexusesi-production` con el nombre de tu bucket.

5. Clic en "Save changes"

### Paso 5: Crear Usuario IAM

#### 5.1. Acceder a IAM

1. En la AWS Console, buscar "IAM"
2. Clic en "IAM" para abrir el servicio

#### 5.2. Crear Usuario

1. En el menú lateral, clic en "Users"
2. Clic en "Add users"
3. Configurar:

**User name:**
```
nexusesi-railway-user
```

**Access type:**
```
✓ Programmatic access
(esto generará Access Key ID y Secret Access Key)
```

4. Clic en "Next: Permissions"

#### 5.3. Configurar Permisos

**Opción 1: Permisos Completos de S3 (Más Simple)**

1. Seleccionar "Attach existing policies directly"
2. Buscar: `AmazonS3FullAccess`
3. Marcar el checkbox
4. Clic en "Next: Tags"

**Opción 2: Permisos Específicos del Bucket (Más Seguro)**

1. Seleccionar "Attach existing policies directly"
2. Clic en "Create policy"
3. Seleccionar la pestaña "JSON"
4. Pegar:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::nexusesi-production",
                "arn:aws:s3:::nexusesi-production/*"
            ]
        }
    ]
}
```

5. Clic en "Next: Tags"
6. Nombre: `NexusESI-S3-Access`
7. Clic en "Create policy"
8. Volver a la creación de usuario y seleccionar la política creada

#### 5.4. Finalizar Creación

1. Agregar tags (opcional):
```
Key: Application
Value: NexusESI
```

2. Clic en "Next: Review"
3. Clic en "Create user"

#### 5.5. Guardar Credenciales

⚠️ **MUY IMPORTANTE**: Esta es la **única vez** que verás el Secret Access Key.

```
Access key ID: AKIAIOSFODNN7EXAMPLE
Secret access key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

**Guárdalas de forma segura. Necesitarás estas credenciales para Railway.**

### Paso 6: Configurar Laravel

#### 6.1. Verificar Paquete

El proyecto ya incluye el paquete necesario en `composer.json`:

```json
"league/flysystem-aws-s3-v3": "3.0"
```

#### 6.2. Configuración en config/filesystems.php

Ya está configurado:

```php
's3' => [
    'driver' => 's3',
    'key' => env('AWS_ACCESS_KEY_ID'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'region' => env('AWS_DEFAULT_REGION'),
    'bucket' => env('AWS_BUCKET'),
    'url' => env('AWS_URL'),
    'endpoint' => env('AWS_ENDPOINT'),
    'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
    'throw' => false,
    'report' => false,
],
```

#### 6.3. Variables de Entorno

En Railway, configurar estas variables:

```bash
# Sistema de archivos
FILESYSTEM_DISK=s3

# AWS S3 Credentials
AWS_ACCESS_KEY_ID=tu_access_key_id_aqui
AWS_SECRET_ACCESS_KEY=tu_secret_access_key_aqui
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=nexusesi-production
AWS_URL=https://nexusesi-production.s3.amazonaws.com
```

**Opcional (si usas CloudFront):**
```bash
AWS_URL=https://tu-distribucion.cloudfront.net
```

### Paso 7: Probar la Configuración

#### 7.1. Test desde Tinker

Conectarse al servicio Railway y abrir terminal:

```bash
php artisan tinker
```

Ejecutar tests:

```php
// Test 1: Escribir archivo
Storage::disk('s3')->put('test/hello.txt', 'Hello from NexusESI!');

// Test 2: Verificar que existe
Storage::disk('s3')->exists('test/hello.txt'); // debe retornar true

// Test 3: Leer archivo
Storage::disk('s3')->get('test/hello.txt'); // debe retornar "Hello from NexusESI!"

// Test 4: Obtener URL
Storage::disk('s3')->url('test/hello.txt'); // debe retornar URL pública

// Test 5: Listar archivos
Storage::disk('s3')->files('test'); // debe retornar array con 'test/hello.txt'

// Test 6: Eliminar archivo
Storage::disk('s3')->delete('test/hello.txt');
```

#### 7.2. Test desde la Aplicación

1. Iniciar sesión en la aplicación
2. Crear una tarea
3. Subir un documento
4. Verificar:
   - En la BD debe guardarse la ruta: `task-documents/{task_id}/filename.pdf`
   - En S3 Console debe aparecer el archivo
   - Al hacer clic en el documento debe descargarse/abrirse

## 📂 Estructura de Carpetas en S3

```
nexusesi-production/
├── task-documents/
│   ├── 1/
│   │   ├── entregable-final.pdf
│   │   └── anexo.docx
│   ├── 2/
│   │   └── reporte.xlsx
│   └── ...
├── event-documents/
│   ├── 1/
│   │   ├── convocatoria.pdf
│   │   └── formato-inscripcion.docx
│   └── ...
├── exports/
│   ├── tareas-2024-11-07.xlsx
│   ├── eventos-reporte.pdf
│   └── ...
└── images/
    ├── instituciones/
    │   ├── logo-1.png
    │   └── logo-2.png
    └── ...
```

## 🎨 Optimizaciones Avanzadas

### 1. CloudFront CDN (Opcional)

CloudFront es un CDN que acelera la entrega de archivos:

#### Beneficios:
- ⚡ Menor latencia
- 💰 Reduce costos de transferencia S3
- 🔒 Mayor seguridad
- 🌍 Distribución global

#### Configuración:

1. Ir a CloudFront en AWS Console
2. Clic en "Create distribution"
3. Configurar:
   - **Origin domain**: Seleccionar tu bucket S3
   - **Origin path**: dejar vacío
   - **Name**: nexusesi-s3
   - **Origin access**: Legacy access identities → Create new OAI
   - **Bucket policy**: Yes, update the bucket policy
   - **Viewer protocol policy**: Redirect HTTP to HTTPS
   - **Allowed HTTP methods**: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
   - **Cache policy**: CachingOptimized
4. Crear distribución
5. Copiar el domain name (ej: `d111111abcdef8.cloudfront.net`)
6. Actualizar en Railway:
   ```bash
   AWS_URL=https://d111111abcdef8.cloudfront.net
   ```

### 2. Lifecycle Policies

Para archivos temporales (exports), configurar eliminación automática:

1. Bucket → Management → Create lifecycle rule
2. Configurar:
   - **Name**: delete-exports-after-7-days
   - **Prefix**: exports/
   - **Expire current versions**: 7 days
3. Crear regla

### 3. Versionado (Opcional)

Para recuperar archivos eliminados:

1. Bucket → Properties
2. Bucket Versioning → Edit
3. Enable
4. Save changes

## 💰 Costos Estimados

### Almacenamiento
```
Primeros 50 TB/mes: $0.023 por GB
```

**Ejemplo:**
- 10 GB almacenados = $0.23/mes
- 100 GB almacenados = $2.30/mes

### Transferencia de Datos
```
Primeros 10 TB/mes: $0.09 por GB
```

**Ejemplo:**
- 5 GB transferidos = $0.45/mes
- 50 GB transferidos = $4.50/mes

### Solicitudes
```
PUT/POST: $0.005 por 1,000 solicitudes
GET/SELECT: $0.0004 por 1,000 solicitudes
```

**Ejemplo:**
- 10,000 uploads = $0.05/mes
- 100,000 downloads = $0.04/mes

### Total Estimado (Uso Moderado)
```
Almacenamiento: 20 GB         = $0.46/mes
Transferencia: 10 GB          = $0.90/mes
Solicitudes: 20,000 total     = $0.10/mes
─────────────────────────────────────────
TOTAL                         ≈ $1.50/mes
```

## 🔒 Seguridad Best Practices

### ✅ Checklist

- [ ] Bucket no es completamente público (solo objetos)
- [ ] Usuario IAM tiene permisos mínimos necesarios
- [ ] Access keys nunca en el código fuente
- [ ] Bucket encryption habilitado
- [ ] Lifecycle policies para datos temporales
- [ ] Monitoring habilitado (CloudWatch)
- [ ] MFA delete habilitado (para producción crítica)
- [ ] Logs de acceso habilitados

### Habilitar Logs de Acceso

1. Bucket → Properties → Server access logging
2. Enable
3. Target bucket: Crear bucket separado para logs
4. Save changes

### Habilitar MFA Delete

Para evitar eliminaciones accidentales:

```bash
aws s3api put-bucket-versioning \
  --bucket nexusesi-production \
  --versioning-configuration Status=Enabled,MFADelete=Enabled \
  --mfa "arn:aws:iam::ACCOUNT-ID:mfa/USER TOKENCODE"
```

## 🐛 Troubleshooting

### Problema: "Access Denied" al subir archivo

**Causas comunes:**
1. IAM user sin permisos
2. Bucket policy incorrecta
3. Credenciales incorrectas

**Solución:**
```bash
# Verificar credenciales en Railway
# Verificar permisos del usuario IAM
# Revisar bucket policy
```

### Problema: "403 Forbidden" al acceder a archivo

**Causa:** Bucket policy no permite lectura pública

**Solución:**
Verificar que la bucket policy incluya:
```json
{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::BUCKET-NAME/*"
}
```

### Problema: CORS error

**Solución:**
1. Verificar configuración CORS del bucket
2. Incluir `AllowedOrigins` con tu dominio
3. Incluir métodos necesarios: GET, PUT, POST, DELETE

### Problema: Archivos no aparecen en S3

**Verificar:**
```php
// En tinker
config('filesystems.default'); // debe ser 's3'
config('filesystems.disks.s3.bucket'); // debe ser el nombre correcto
```

## 📚 Recursos Adicionales

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [Laravel Filesystem Documentation](https://laravel.com/docs/filesystem)
- [Flysystem AWS S3 Adapter](https://flysystem.thephpleague.com/docs/adapter/aws-s3-v3/)
- [AWS S3 Pricing Calculator](https://calculator.aws/)

## ✅ Checklist Final

Antes de ir a producción:

- [ ] Bucket creado y configurado
- [ ] CORS configurado correctamente
- [ ] Bucket policy permite lectura pública
- [ ] Usuario IAM creado con permisos adecuados
- [ ] Credenciales guardadas de forma segura
- [ ] Variables de entorno configuradas en Railway
- [ ] Tests ejecutados exitosamente
- [ ] CloudFront configurado (opcional)
- [ ] Lifecycle policies configuradas (opcional)
- [ ] Logs habilitados
- [ ] Backup strategy definida

---

**Última actualización**: Noviembre 2025  
**Autor**: Equipo NexusESI

