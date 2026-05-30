<?php

namespace App\Notifications;

use App\Models\ChatMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewMessageNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public ChatMessage $message)
    {
        //
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via($notifiable): array // 💡 Fixed this method name!
    {
        // Saves the notification to the database table and broadcasts it dynamically
        return ['database', 'broadcast'];
    }

    /**
     * Get the array representation of the notification for local storage systems.
     *
     * @return array<string, mixed>
     */
    public function toArray($notifiable): array
    {
        return [
            'chat_id'           => $this->message->chat_id,
            'message_id'        => $this->message->id,
            'sender_name'       => $this->message->sender?->name ?? 'An Anonymous Peer',
            'encrypted_payload' => $this->message->encrypted_payload, 
            'iv'                => $this->message->iv,
        ];
    }
}