<?php

namespace App\Mail;

use App\Models\Alert;
use App\Models\Task;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TaskAlertMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public Alert $alert;
    public Task $task;

    /**
     * Create a new message instance.
     */
    public function __construct(Alert $alert)
    {
        $this->alert = $alert;
        $this->task = $alert->task;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subject = $this->alert->type === 'Critical' 
            ? '🚨 ALERTA CRÍTICA - ' . $this->task->title
            : '⚠️ ALERTA PREVENTIVA - ' . $this->task->title;

        return new Envelope(
            subject: $subject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $event = $this->task->event ?? $this->task->committee?->event;
        return new Content(
            view: 'emails.task-alert',
            with: [
                'alert' => $this->alert,
                'task' => $this->task,
                'user' => $this->alert->user,
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
