<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class ContentDeleted extends Notification implements ShouldBroadcast, ShouldQueue
{
    use Queueable;

    public $contentType;

    public function __construct($contentType)
    {
        $this->contentType = $contentType;
    }

    public function via($notifiable)
    {
        return ['database', 'broadcast'];
    }

    public function toDatabase($notifiable)
    {
        return [
            'type' => 'content_deleted',
            'message' => "Your {$this->contentType} was removed by a moderator for violating community guidelines.",
        ];
    }

    public function toBroadcast($notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'id' => $this->id,
            'type' => static::class,
            'data' => $this->toDatabase($notifiable),
            'created_at' => now()->toIso8601String(),
        ]);
    }
}
