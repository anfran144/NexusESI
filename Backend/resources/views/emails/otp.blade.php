<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Código de Verificación</title>
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
            margin-bottom: 30px;
            color: #555555;
        }
        .otp-container {
            background-color: #f8f9fa;
            border: 2px dashed #667eea;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
        }
        .otp-label {
            font-size: 14px;
            color: #666666;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .otp-code {
            font-size: 42px;
            font-weight: 700;
            color: #667eea;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
        }
        .expiry-notice {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .expiry-notice p {
            margin: 0;
            font-size: 14px;
            color: #856404;
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
        .footer a {
            color: #667eea;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Código de Verificación</h1>
        </div>
        
        <div class="content">
            <p class="greeting">Hola {{ $userName }},</p>
            
            <p class="message">
                Has solicitado restablecer tu contraseña en NexusESI. Utiliza el siguiente código de verificación para continuar con el proceso:
            </p>
            
            <div class="otp-container">
                <div class="otp-label">Tu código de verificación</div>
                <div class="otp-code">{{ $otp }}</div>
            </div>
            
            <div class="expiry-notice">
                <p><strong>⏱️ Validez del código:</strong> Este código expirará en {{ $expiresInMinutes }} minutos.</p>
            </div>
            
            <div class="security-notice">
                <p><strong>⚠️ Importante:</strong> Si no solicitaste este cambio de contraseña, ignora este correo electrónico y asegúrate de que tu cuenta esté segura. Nunca compartas este código con nadie.</p>
            </div>
            
            <p class="message">
                Si tienes alguna pregunta o necesitas ayuda, no dudes en contactar con nuestro equipo de soporte.
            </p>
        </div>
        
        <div class="footer">
            <p><strong>NexusESI</strong></p>
            <p>Sistema de Gestión de Semilleros de Investigación</p>
            <p>&copy; {{ date('Y') }} NexusESI. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>

