<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Incidencia Resuelta</title>
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
        .success-box {
            background-color: #ecfdf5;
            border-left: 4px solid #10b981;
            padding: 20px;
            margin: 28px 0;
            border-radius: 6px;
        }
        .success-box h3 {
            margin: 0 0 12px 0;
            font-size: 18px;
            color: #065f46;
            font-weight: 600;
        }
        .success-box p {
            margin: 0;
            font-size: 15px;
            color: #047857;
            line-height: 1.6;
        }
        .details-box {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 25px;
            margin: 28px 0;
        }
        .details-box h3 {
            margin: 0 0 20px 0;
            font-size: 18px;
            color: #1e3a5f;
            font-weight: 600;
        }
        .detail-row {
            margin-bottom: 16px;
            padding-bottom: 16px;
            border-bottom: 1px solid #e5e7eb;
        }
        .detail-row:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
            border-bottom: none;
        }
        .detail-label {
            font-size: 13px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
            margin-bottom: 4px;
        }
        .detail-value {
            font-size: 16px;
            color: #1f2937;
            font-weight: 500;
        }
        .incident-description {
            background-color: #f3f4f6;
            padding: 16px;
            border-radius: 6px;
            margin-top: 8px;
            font-size: 15px;
            color: #4b5563;
            line-height: 1.6;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 13px;
            font-weight: 600;
        }
        .status-in-progress {
            background-color: #dbeafe;
            color: #1e40af;
        }
        .status-delayed {
            background-color: #fee2e2;
            color: #991b1b;
        }
        .status-completed {
            background-color: #d1fae5;
            color: #065f46;
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
                <h1 class="header-title">Incidencia Resuelta</h1>
                <div class="header-subtitle">Sistema de Gestión de Semilleros de Investigación</div>
            </div>
            
            <div class="content">
                <p class="greeting">Estimado/a {{ $reporter->name }},</p>
                
                <p class="message">
                    Nos complace informarle que su incidencia ha sido resuelta y puede continuar con su tarea.
                </p>
                
                <div class="success-box">
                    <h3>Incidencia Resuelta</h3>
                    <p>Su incidencia ha sido procesada y resuelta exitosamente.</p>
                </div>
                
                <div class="details-box">
                    <h3>Detalles de la Incidencia</h3>
                    <div class="detail-row">
                        <div class="detail-label">Tarea</div>
                        <div class="detail-value">{{ $task->title }}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Descripción de la Incidencia</div>
                        <div class="incident-description">{{ $incident->description }}</div>
                    </div>
                    @if($committee)
                    <div class="detail-row">
                        <div class="detail-label">Comité</div>
                        <div class="detail-value">{{ $committee->name }}</div>
                    </div>
                    @endif
                    @if($event)
                    <div class="detail-row">
                        <div class="detail-label">Evento</div>
                        <div class="detail-value">{{ $event->name }}</div>
                    </div>
                    @endif
                    <div class="detail-row">
                        <div class="detail-label">Estado de la Tarea</div>
                        <div class="detail-value">
                            @if($task->status === 'InProgress')
                                <span class="status-badge status-in-progress">En Progreso</span>
                            @elseif($task->status === 'Delayed')
                                <span class="status-badge status-delayed">Retrasada</span>
                            @elseif($task->status === 'Completed')
                                <span class="status-badge status-completed">Completada</span>
                            @else
                                {{ $task->status }}
                            @endif
                        </div>
                    </div>
                </div>
                
                <p class="message">
                    Su tarea ahora está lista para continuar. Por favor, acceda al sistema para revisar los detalles 
                    y continuar con su trabajo.
                </p>
                
                <p class="message">
                    Si tiene alguna pregunta adicional, no dude en contactarnos.
                </p>
            </div>
            
            <div class="footer">
                <div class="footer-brand">NexusESI</div>
                <div class="footer-description">Sistema de Gestión de Semilleros de Investigación</div>
                <div class="footer-copyright">&copy; {{ date('Y') }} NexusESI. Todos los derechos reservados.</div>
                <div class="footer-copyright" style="margin-top: 8px; padding-top: 0; border-top: none;">
                    Este es un correo automático, por favor no responder a este mensaje.
                </div>
            </div>
        </div>
    </div>
</body>
</html>
