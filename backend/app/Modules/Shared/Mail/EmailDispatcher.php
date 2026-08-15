<?php

declare(strict_types=1);

namespace App\Modules\Shared\Mail;

interface EmailDispatcher
{
    public function send(OutboundEmail $email): void;
}
