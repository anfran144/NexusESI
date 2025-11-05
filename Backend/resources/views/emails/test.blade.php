<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Email de Prueba</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background-color: #f3f4f6;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        .email-wrapper {
            width: 100%;
            background-color: #f3f4f6;
            padding: 40px 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .header {
            background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%);
            color: #ffffff;
            padding: 45px 35px;
            text-align: center;
        }
        .header-logo {
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }
        .header-title {
            margin: 0;
            font-size: 26px;
            font-weight: 600;
            letter-spacing: -0.5px;
        }
        .header-subtitle {
            margin-top: 8px;
            font-size: 14px;
            opacity: 0.9;
            font-weight: 400;
        }
        .content {
            padding: 45px 35px;
            background-color: #ffffff;
        }
        .message {
            font-size: 16px;
            margin-bottom: 32px;
            color: #4b5563;
            line-height: 1.7;
        }
        .success-box {
            background-color: #ecfdf5;
            border: 2px solid #10b981;
            border-radius: 8px;
            padding: 30px;
            text-align: center;
            margin: 32px 0;
        }
        .success-box h2 {
            color: #065f46;
            margin: 0 0 12px 0;
            font-size: 24px;
            font-weight: 600;
        }
        .success-box p {
            color: #047857;
            margin: 0;
            font-size: 16px;
            line-height: 1.6;
        }
        .info-box {
            background-color: #f0f9ff;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            margin: 28px 0;
            border-radius: 6px;
        }
        .info-box strong {
            color: #1e40af;
        }
        .info-box p {
            margin: 8px 0;
            font-size: 15px;
            color: #1e3a8a;
            line-height: 1.6;
        }
        .checklist {
            list-style: none;
            padding: 0;
            margin: 24px 0;
        }
        .checklist li {
            font-size: 16px;
            color: #4b5563;
            padding: 12px 0;
            border-bottom: 1px solid #e5e7eb;
            line-height: 1.6;
        }
        .checklist li:last-child {
            border-bottom: none;
        }
        .checklist li::before {
            content: '✓';
            color: #10b981;
            font-weight: 700;
            margin-right: 12px;
            font-size: 18px;
        }
        .warning-box {
            background-color: #fffbeb;
            border-left: 4px solid #f59e0b;
            padding: 18px 20px;
            margin: 28px 0;
            border-radius: 6px;
        }
        .warning-box p {
            margin: 0;
            font-size: 14px;
            color: #92400e;
            line-height: 1.6;
        }
        .warning-box strong {
            color: #78350f;
        }
        .footer {
            background-color: #f9fafb;
            padding: 35px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .footer-brand {
            font-size: 18px;
            font-weight: 700;
            color: #1e3a5f;
            margin-bottom: 8px;
            letter-spacing: 0.5px;
        }
        .footer-description {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 4px;
        }
        .footer-copyright {
            font-size: 13px;
            color: #9ca3af;
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #e5e7eb;
        }
        @media only screen and (max-width: 600px) {
            .email-wrapper {
                padding: 20px 10px;
            }
            .header, .content, .footer {
                padding: 30px 25px;
            }
            .header-title {
                font-size: 22px;
            }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="container">
            <div class="header">
                <div class="header-logo">NexusESI</div>
                <h1 class="header-title">Prueba de Configuración</h1>
                <div class="header-subtitle">Sistema de Gestión de Semilleros de Investigación</div>
            </div>
            
            <div class="content">
                <div class="success-box">
                    <h2>Configuración Exitosa</h2>
                    <p>Su integración con SendGrid está funcionando correctamente</p>
                </div>
                
                <p class="message">
                    Este es un email de prueba enviado desde <strong>{{ $app_name }}</strong> para verificar 
                    que la configuración de SendGrid está funcionando correctamente.
                </p>
                
                <div class="info-box">
                    <p><strong>Timestamp:</strong> {{ $timestamp }}</p>
                    <p><strong>Proveedor:</strong> SendGrid SMTP</p>
                    <p><strong>Framework:</strong> Laravel 11.x</p>
                    <p><strong>Aplicación:</strong> {{ $app_name }}</p>
                </div>
                
                <p class="message">
                    Si está recibiendo este correo electrónico, significa que:
                </p>
                
                <ul class="checklist">
                    <li>La API Key de SendGrid es válida</li>
                    <li>La configuración SMTP es correcta</li>
                    <li>Los templates de email funcionan</li>
                    <li>El sistema de correo está listo para producción</li>
                </ul>
                
                <div class="warning-box">
                    <p><strong>Nota:</strong> Este es un email de prueba. Puede eliminar el comando de prueba 
                    cuando termine de verificar la configuración.</p>
                </div>
            </div>
            
            <div class="footer">
                <div class="footer-brand">NexusESI</div>
                <div class="footer-description">Sistema de Gestión de Semilleros de Investigación</div>
                <div class="footer-copyright">&copy; {{ date('Y') }} NexusESI. Todos los derechos reservados.</div>
            </div>
        </div>
    </div>
</body>
</html>
