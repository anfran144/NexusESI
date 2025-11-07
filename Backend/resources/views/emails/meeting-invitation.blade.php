<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Invitación a Reunión</title>
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
        .meeting-card {
            background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 30px;
            margin: 35px 0;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }
        .meeting-title {
            font-size: 22px;
            font-weight: 700;
            color: #1e3a5f;
            margin-bottom: 20px;
            line-height: 1.3;
        }
        .meeting-detail {
            margin-bottom: 16px;
            display: flex;
            align-items: flex-start;
        }
        .meeting-detail-icon {
            width: 20px;
            height: 20px;
            margin-right: 12px;
            margin-top: 2px;
            flex-shrink: 0;
        }
        .meeting-detail-label {
            font-size: 13px;
            color: #6b7280;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }
        .meeting-detail-value {
            font-size: 16px;
            color: #1f2937;
            font-weight: 500;
        }
        .meeting-description {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 15px;
            color: #4b5563;
            line-height: 1.6;
        }
        .badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
        }
        .badge-planning {
            background-color: #f3e8ff;
            color: #7c3aed;
        }
        .badge-coordination {
            background-color: #d1fae5;
            color: #059669;
        }
        .badge-committee {
            background-color: #fed7aa;
            color: #d97706;
        }
        .badge-general {
            background-color: #dbeafe;
            color: #2563eb;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%);
            color: #ffffff;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 24px 0;
            text-align: center;
            transition: opacity 0.2s;
        }
        .cta-button:hover {
            opacity: 0.9;
        }
        .info-notice {
            background-color: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 18px 20px;
            margin: 28px 0;
            border-radius: 6px;
        }
        .info-notice p {
            margin: 0;
            font-size: 14px;
            color: #1e40af;
            line-height: 1.6;
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
            .meeting-card {
                padding: 20px;
            }
            .meeting-title {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="container">
            <div class="header">
                <div class="header-logo">NexusESI</div>
                <h1 class="header-title">Invitación a Reunión</h1>
                <div class="header-subtitle">Sistema de Gestión de Semilleros de Investigación</div>
            </div>
            
            <div class="content">
                <p class="greeting">Estimado/a {{ $userName }},</p>
                
                <p class="message">
                    Has sido invitado a una reunión del evento <strong>{{ $event->name }}</strong>. 
                    Por favor, revisa los detalles a continuación.
                </p>
                
                <div class="meeting-card">
                    <div class="badge badge-{{ $meeting->meeting_type }}">
                        {{ $meetingTypeLabel }}
                    </div>
                    <h2 class="meeting-title">{{ $meeting->title }}</h2>
                    
                    <div class="meeting-detail">
                        <div style="flex: 1;">
                            <div class="meeting-detail-label">📅 Fecha y Hora</div>
                            <div class="meeting-detail-value">
                                {{ $meeting->scheduled_at->format('l, d \d\e F \d\e Y') }}<br>
                                {{ $meeting->scheduled_at->format('H:i') }} horas
                            </div>
                        </div>
                    </div>
                    
                    @if($meeting->location)
                    <div class="meeting-detail">
                        <div style="flex: 1;">
                            <div class="meeting-detail-label">📍 Ubicación</div>
                            <div class="meeting-detail-value">{{ $meeting->location }}</div>
                        </div>
                    </div>
                    @endif
                    
                    @if($meeting->description)
                    <div class="meeting-description">
                        <strong>Descripción:</strong><br>
                        {{ $meeting->description }}
                    </div>
                    @endif
                </div>
                
                @if($checkInUrl)
                <div class="info-notice">
                    <p>
                        <strong>💡 Recordatorio:</strong> Podrás registrar tu asistencia escaneando el código QR 
                        que estará disponible en la reunión o accediendo al enlace de check-in.
                    </p>
                </div>
                @endif
                
                <p class="message">
                    Por favor, confirma tu asistencia ingresando al sistema NexusESI. 
                    Si tienes alguna pregunta o no puedes asistir, contacta al coordinador del evento.
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

