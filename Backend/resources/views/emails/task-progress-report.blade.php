<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Reporte de Progreso - {{ $task->title }}</title>
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
        .progress-box {
            background-color: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            margin: 28px 0;
            border-radius: 6px;
        }
        .progress-box h3 {
            margin: 0 0 16px 0;
            font-size: 18px;
            color: #1e40af;
            font-weight: 600;
        }
        .progress-box p {
            margin: 12px 0;
            font-size: 15px;
            color: #1e3a8a;
            line-height: 1.6;
        }
        .progress-box strong {
            color: #1e40af;
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
        .button-container {
            text-align: center;
            margin: 35px 0;
        }
        .btn {
            display: inline-block;
            padding: 14px 28px;
            background-color: #1e3a5f;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 15px;
            margin: 6px;
            transition: background-color 0.2s;
        }
        .btn:hover {
            background-color: #2c5282;
        }
        .success-box {
            background-color: #ecfdf5;
            border-left: 4px solid #10b981;
            padding: 18px 20px;
            margin: 28px 0;
            border-radius: 6px;
        }
        .success-box p {
            margin: 0;
            font-size: 14px;
            color: #065f46;
            line-height: 1.6;
        }
        .success-box strong {
            color: #047857;
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
            .btn {
                display: block;
                margin: 8px 0;
            }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="container">
            <div class="header">
                <div class="header-logo">NexusESI</div>
                <h1 class="header-title">Reporte de Progreso</h1>
                <div class="header-subtitle">Sistema de Gestión de Semilleros de Investigación</div>
            </div>
            
            <div class="content">
                <p class="greeting">Estimado/a usuario,</p>
                
                <p class="message">
                    Se ha actualizado el progreso de una tarea asignada a usted o de su interés.
                </p>
                
                <div class="progress-box">
                    <h3>Detalles del Progreso</h3>
                    <p><strong>Descripción:</strong> {{ $progress->description }}</p>
                    <p><strong>Reportado por:</strong> {{ $reporter->name }}</p>
                    <p><strong>Fecha del Reporte:</strong> {{ $progress->created_at->format('d/m/Y H:i') }}</p>
                    @if($progress->attached_files)
                        <p><strong>Archivos Adjuntos:</strong> {{ $progress->attached_files }}</p>
                    @endif
                </div>

                <div class="details-box">
                    <h3>Tarea Actualizada</h3>
                    <div class="detail-row">
                        <div class="detail-label">Título</div>
                        <div class="detail-value">{{ $task->title }}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Descripción</div>
                        <div class="detail-value">{{ $task->description }}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Fecha de Vencimiento</div>
                        <div class="detail-value">{{ $task->due_date->format('d/m/Y H:i') }}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Estado</div>
                        <div class="detail-value">{{ $task->status }}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Comité</div>
                        <div class="detail-value">{{ $committee->name }}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Evento</div>
                        <div class="detail-value">{{ $event->name }}</div>
                    </div>
                </div>

                <div class="button-container">
                    <a href="{{ config('app.frontend_url') }}/tasks/{{ $task->id }}" class="btn">
                        Ver Tarea
                    </a>
                    <a href="{{ config('app.frontend_url') }}/tasks/my-tasks" class="btn">
                        Mis Tareas
                    </a>
                </div>

                <div class="success-box">
                    <p><strong>Progreso Registrado:</strong> Se ha registrado el progreso de la tarea. 
                    Continúe monitoreando el avance para asegurar la finalización exitosa.</p>
                </div>
            </div>
            
            <div class="footer">
                <div class="footer-brand">NexusESI</div>
                <div class="footer-description">Sistema de Gestión de Semilleros de Investigación</div>
                <div class="footer-copyright">&copy; {{ date('Y') }} NexusESI. Todos los derechos reservados.</div>
                <div class="footer-copyright" style="margin-top: 8px; padding-top: 0; border-top: none;">
                    Este es un mensaje automático del sistema. Para más información, contacte al administrador.
                </div>
            </div>
        </div>
    </div>
</body>
</html>
