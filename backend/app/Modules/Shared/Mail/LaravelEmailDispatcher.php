<?php

declare(strict_types=1);

namespace App\Modules\Shared\Mail;

use Illuminate\Contracts\Mail\Mailer;

final readonly class LaravelEmailDispatcher implements EmailDispatcher
{
    public function __construct(private Mailer $mailer) {}

    public function send(OutboundEmail $email): void
    {
        $this->mailer->to($email->recipient)->send(new OutboundEmailMessage($email));
    }
}
