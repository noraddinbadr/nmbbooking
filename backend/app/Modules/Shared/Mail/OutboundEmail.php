<?php

declare(strict_types=1);

namespace App\Modules\Shared\Mail;

final readonly class OutboundEmail
{
    public function __construct(
        public string $recipient,
        public string $subject,
        public string $html,
        public ?string $text = null,
    ) {}
}
