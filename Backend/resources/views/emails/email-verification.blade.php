<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Verifica tu Correo Electrónico</title>
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
        .greeting {
            font-size: 18px;
            margin-bottom: 24px;
            color: #1f2937;
            font-weight: 500;
        }
        .message {
            font-size: 16px;
            margin-bottom: 32px;
            color: #4b5563;
            line-height: 1.7;
        }
        .otp-container {
            background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 40px 30px;
            text-align: center;
            margin: 35px 0;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }
        .otp-label {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 16px;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            font-weight: 600;
        }
        .otp-code {
            font-size: 48px;
            font-weight: 700;
            color: #1e3a5f;
            letter-spacing: 12px;
            font-family: 'Courier New', 'Consolas', monospace;
            line-height: 1.2;
        }
        .expiry-notice {
            background-color: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 18px 20px;
            margin: 28px 0;
            border-radius: 6px;
        }
        .expiry-notice p {
            margin: 0;
            font-size: 14px;
            color: #1e40af;
            line-height: 1.6;
        }
        .expiry-notice strong {
            color: #1e3a5f;
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
            .otp-code {
                font-size: 36px;
                letter-spacing: 8px;
            }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="container">
            <div class="header">
                <div class="header-logo">NexusESI</div>
                <h1 class="header-title">Verificación de Correo Electrónico</h1>
                <div class="header-subtitle">Sistema de Gestión de Semilleros de Investigación</div>
            </div>
            
            <div class="content">
                <p class="greeting">Estimado/a {{ $userName }},</p>
                
                <p class="message">
                    Le damos la bienvenida a NexusESI. Para completar su registro y activar su cuenta, 
                    por favor verifique su correo electrónico utilizando el siguiente código de verificación.
                </p>
                
                <div class="otp-container">
                    <div class="otp-label">Código de Verificación</div>
                    <div class="otp-code">{{ $otp }}</div>
                </div>
                
                <div class="expiry-notice">
                    <p><strong>Validez del código:</strong> Este código expirará en {{ $expiresInMinutes }} minutos.</p>
                </div>
                
                <p class="message">
                    Una vez verificado su correo electrónico, podrá acceder a todas las funcionalidades 
                    del sistema NexusESI.
                </p>
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

