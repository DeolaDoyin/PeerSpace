<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class VerifyEmailNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        $verificationUrl = $this->verificationUrl($notifiable);

        return (new MailMessage)
            ->subject('Verify Your PeerSpace Account')
            ->greeting('Hello, Future Peer!')
            ->line('Welcome to PeerSpace. Please click the button below to verify your email and join our community.')
            ->action('Verify Email Address', $verificationUrl)
            ->line('If you did not create an account, no further action is required.')
            ->salutation('Warmly, The PeerSpace Team');
    }

    protected function verificationUrl($notifiable): string
    {
        $frontendUrl = config('app.frontend_url', 'http://127.0.0.1:5173');

        $signedUrl = \Illuminate\Support\Facades\URL::temporarySignedRoute(
            'verification.verify',
            \Illuminate\Support\Carbon::now()->addMinutes(
                \Illuminate\Support\Facades\Config::get('auth.verification.expire', 60)
            ),
            [
                'id' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ]
        );

        $parsedUrl = parse_url($signedUrl);
        $query = $parsedUrl['query'] ?? '';

        return $frontendUrl . '/verify-email/confirm?id=' . $notifiable->getKey()
            . '&hash=' . sha1($notifiable->getEmailForVerification())
            . '&' . $query;
    }
}
