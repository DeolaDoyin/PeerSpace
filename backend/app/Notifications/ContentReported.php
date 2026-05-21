<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class ContentReported extends Notification implements ShouldBroadcast, ShouldQueue
{
    use Queueable;

    public $reportableType;
    public $reportableId;
    public $reporter;

    public function __construct($reportableType, $reportableId, User $reporter)
    {
        $this->reportableType = $reportableType;
        $this->reportableId = $reportableId;
        $this->reporter = $reporter;
    }

    public function via($notifiable)
    {
        return ['database', 'broadcast'];
    }

    public function toDatabase($notifiable)
    {
        return [
            'type' => 'content_reported',
            'message' => "{$this->reporter->name} reported a {$this->reportableType}.",
            'reportable_type' => $this->reportableType,
            'reportable_id' => $this->reportableId,
            'link' => '/reports',
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
