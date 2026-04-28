<?php

namespace App\Notifications;

use App\Models\Comment;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class CommentReplyReceived extends Notification implements ShouldBroadcast
{
    use Queueable;

    public $parentComment;
    public $replier;

    public function __construct(Comment $parentComment, User $replier)
    {
        $this->parentComment = $parentComment;
        $this->replier = $replier;
    }

    public function via($notifiable)
    {
        return ['database', 'broadcast'];
    }

    public function toDatabase($notifiable)
    {
        $post = $this->parentComment->post;
        return [
            'post_id' => $post->id,
            'post_slug' => $post->slug,
            'post_title' => $post->title,
            'commenter_name' => $this->replier->name,
            'type' => 'comment_reply',
            'message' => "{$this->replier->name} replied to your comment."
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
