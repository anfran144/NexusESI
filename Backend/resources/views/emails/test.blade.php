<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email de Prueba</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .header .emoji {
            font-size: 48px;
            margin-bottom: 10px;
        }
        .content {
            padding: 40px 30px;
        }
        .success-badge {
            background-color: #d4edda;
            border: 2px solid #28a745;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
        }
        .success-badge h2 {
            color: #155724;
            margin: 0 0 10px 0;
            font-size: 24px;
        }
        .success-badge p {
            color: #155724;
            margin: 0;
            font-size: 16px;
        }
        .info-box {
            background-color: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info-box strong {
            color: #667eea;
        }
        .info-box p {
            margin: 5px 0;
            font-size: 14px;
            color: #555555;
        }
        .message {
            font-size: 16px;
            margin-bottom: 20px;
            color: #555555;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        .footer p {
            margin: 5px 0;
            font-size: 14px;
            color: #666666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="emoji">✅</div>
            <h1>SendGrid Funcionando</h1>
        </div>
        
        <div class="content">
            <div class="success-badge">
                <h2>¡Configuración Exitosa!</h2>
                <p>Tu integración con SendGrid está funcionando correctamente</p>
            </div>
            
            <p class="message">
                Este es un email de prueba enviado desde <strong>{{ $app_name }}</strong> para verificar que la configuración de SendGrid está funcionando correctamente.
            </p>
            
            <div class="info-box">
                <p><strong>🕐 Timestamp:</strong> {{ $timestamp }}</p>
                <p><strong>📧 Proveedor:</strong> SendGrid SMTP</p>
                <p><strong>🚀 Framework:</strong> Laravel 11.x</p>
                <p><strong>💻 Aplicación:</strong> {{ $app_name }}</p>
            </div>
            
            <p class="message">
                Si estás recibiendo este correo electrónico, significa que:
            </p>
            
            <ul style="color: #555555; font-size: 16px; line-height: 1.8;">
                <li>✅ La API Key de SendGrid es válida</li>
                <li>✅ La configuración SMTP es correcta</li>
                <li>✅ Los templates de email funcionan</li>
                <li>✅ El sistema de correo está listo para producción</li>
            </ul>
            
            <div class="info-box" style="background-color: #fff3cd; border-left-color: #ffc107;">
                <p style="color: #856404;">
                    <strong>💡 Nota:</strong> Este es un email de prueba. Puedes eliminar el comando de prueba cuando termines de verificar la configuración.
                </p>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>{{ $app_name }}</strong></p>
            <p>Sistema de Gestión de Semilleros de Investigación</p>
            <p>&copy; {{ date('Y') }} NexusESI. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>

