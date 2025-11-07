<?php

declare(strict_types=1);

namespace App\Mail;

use App\Models\Meeting;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Mailable para envío de invitación a reunión
 */
final class MeetingInvitationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public readonly Meeting $meeting,
        public readonly User $user
    ) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $meetingTypeLabels = [
            'planning' => 'Planificación',
            'coordination' => 'Coordinación',
            'committee' => 'Comité',
            'general' => 'General',
        ];

        $typeLabel = $meetingTypeLabels[$this->meeting->meeting_type] ?? 'Reunión';

        return new Envelope(
            from: new Address(
                config('mail.from.address'),
                config('mail.from.name')
            ),
            subject: "Invitación a Reunión: {$this->meeting->title} - {$typeLabel}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $meetingTypeLabels = [
            'planning' => 'Planificación',
            'coordination' => 'Coordinación',
            'committee' => 'Comité',
            'general' => 'General',
        ];

        return new Content(
            view: 'emails.meeting-invitation',
            text: 'emails.meeting-invitation-text',
            with: [
                'userName' => $this->user->name,
                'meeting' => $this->meeting,
                'meetingTypeLabel' => $meetingTypeLabels[$this->meeting->meeting_type] ?? 'Reunión',
                'event' => $this->meeting->event,
                'checkInUrl' => $this->meeting->getCheckInUrl(),
            ],
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

