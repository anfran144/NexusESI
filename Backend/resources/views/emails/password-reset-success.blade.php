<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contraseña Restablecida</title>
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
            background: linear-gradient(135deg, #56ab2f 0%, #a8e063 100%);
            color: #ffffff;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #333333;
        }
        .message {
            font-size: 16px;
            margin-bottom: 20px;
            color: #555555;
        }
        .info-box {
            background-color: #d4edda;
            border-left: 4px solid #28a745;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info-box p {
            margin: 0;
            font-size: 14px;
            color: #155724;
        }
        .security-notice {
            background-color: #f8d7da;
            border-left: 4px solid #dc3545;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .security-notice p {
            margin: 0;
            font-size: 14px;
            color: #721c24;
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
            <h1>✅ Contraseña Restablecida</h1>
        </div>
        
        <div class="content">
            <p class="greeting">Hola {{ $userName }},</p>
            
            <p class="message">
                Te confirmamos que tu contraseña ha sido restablecida exitosamente.
            </p>
            
            <div class="info-box">
                <p><strong>📅 Fecha y hora del cambio:</strong> {{ $resetDateTime }}</p>
            </div>
            
            <p class="message">
                Ya puedes iniciar sesión en NexusESI utilizando tu nueva contraseña.
            </p>
            
            <div class="security-notice">
                <p><strong>⚠️ ¿No fuiste tú?</strong> Si no realizaste este cambio, contacta inmediatamente con nuestro equipo de soporte para asegurar tu cuenta.</p>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>NexusESI</strong></p>
            <p>Sistema de Gestión de Semilleros de Investigación</p>
            <p>&copy; {{ date('Y') }} NexusESI. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>

