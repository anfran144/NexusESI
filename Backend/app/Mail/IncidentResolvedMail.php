<?php

namespace App\Mail;

use App\Models\Incident;
use App\Models\Task;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class IncidentResolvedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public Incident $incident;
    public Task $task;

    /**
     * Create a new message instance.
     */
    public function __construct(Incident $incident)
    {
        // Cargar relaciones necesarias si no están cargadas
        if (!$incident->relationLoaded('task')) {
            $incident->load('task.event', 'task.committee.event', 'reportedBy');
        }
        if (!$incident->relationLoaded('reportedBy')) {
            $incident->load('reportedBy');
        }
        if ($incident->task && !$incident->task->relationLoaded('committee')) {
            $incident->task->load('committee.event', 'event');
        }
        
        $this->incident = $incident;
        $this->task = $incident->task;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '✅ INCIDENCIA RESUELTA - ' . $this->task->title,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $event = $this->task->event ?? $this->task->committee?->event;
        return new Content(
            view: 'emails.incident-resolved',
            with: [
                'incident' => $this->incident,
                'task' => $this->task,
                'reporter' => $this->incident->reportedBy,
                'committee' => $this->task->committee,
                'event' => $event,
            ]
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}

