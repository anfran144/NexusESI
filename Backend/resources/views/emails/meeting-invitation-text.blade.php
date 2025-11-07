Invitación a Reunión - NexusESI

Estimado/a {{ $userName }},

Has sido invitado a una reunión del evento {{ $event->name }}.

DETALLES DE LA REUNIÓN:
- Título: {{ $meeting->title }}
- Tipo: {{ $meetingTypeLabel }}
- Fecha y Hora: {{ $meeting->scheduled_at->format('l, d \d\e F \d\e Y \a \l\a\s H:i') }}
@if($meeting->location)
- Ubicación: {{ $meeting->location }}
@endif
@if($meeting->description)
- Descripción: {{ $meeting->description }}
@endif

Por favor, confirma tu asistencia ingresando al sistema NexusESI.

Si tienes alguna pregunta o no puedes asistir, contacta al coordinador del evento.

---
NexusESI - Sistema de Gestión de Semilleros de Investigación
© {{ date('Y') }} NexusESI. Todos los derechos reservados.

