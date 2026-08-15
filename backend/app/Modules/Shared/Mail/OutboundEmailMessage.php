<?php

declare(strict_types=1);

namespace App\Modules\Shared\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

final class OutboundEmailMessage extends Mailable
{
    use Queueable;

    public function __construct(public readonly OutboundEmail $email) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->email->subject);
    }

    public function content(): Content
    {
        return new Content(
            text: 'mail.outbound-text',
            with: ['email' => $this->email],
            htmlString: $this->email->html,
        );
    }

    /**
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
