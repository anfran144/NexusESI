<?php

namespace App\Mail;

use App\Models\Task;
use App\Models\TaskProgress;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TaskProgressReportMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public Task $task;
    public TaskProgress $progress;

    /**
     * Create a new message instance.
     */
    public function __construct(Task $task, TaskProgress $progress)
    {
        $this->task = $task;
        $this->progress = $progress;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '📊 REPORTE DE PROGRESO - ' . $this->task->title,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $event = $this->task->event ?? $this->task->committee?->event;
        return new Content(
            view: 'emails.task-progress-report',
            with: [
                'task' => $this->task,
                'progress' => $this->progress,
                'reporter' => $this->progress->user,
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
