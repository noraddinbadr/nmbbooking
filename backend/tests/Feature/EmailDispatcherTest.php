<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Modules\Shared\Mail\EmailDispatcher;
use App\Modules\Shared\Mail\OutboundEmail;
use App\Modules\Shared\Mail\OutboundEmailMessage;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

final class EmailDispatcherTest extends TestCase
{
    public function test_platform_mail_dispatcher_uses_the_configured_mailer_without_external_delivery_in_tests(): void
    {
        Mail::fake();

        app(EmailDispatcher::class)->send(new OutboundEmail(
            recipient: 'owner@example.test',
            subject: 'Platform notification',
            html: '<p>Platform message</p>',
            text: 'Platform message',
        ));

        Mail::assertSent(OutboundEmailMessage::class, static function (OutboundEmailMessage $message): bool {
            return $message->hasTo('owner@example.test')
                && $message->email->subject === 'Platform notification';
        });
    }
}
