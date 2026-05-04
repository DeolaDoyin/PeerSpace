<?php

namespace App\Notifications;

use App\Models\Comment;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class CommentLiked extends Notification implements ShouldBroadcast, ShouldQueue
{
    use Queueable;

    public $comment;
    public $liker;

    public function __construct(Comment $comment, User $liker)
    {
        $this->comment = $comment;
        $this->liker = $liker;
    }

    public function via($notifiable)
    {
        return ['database', 'broadcast'];
    }

    public function toDatabase($notifiable)
    {
        $post = $this->comment->post;
        return [
            'post_id' => $post->id,
            'post_slug' => $post->slug,
            'post_title' => $post->title,
            'liker_name' => $this->liker->name,
            'type' => 'comment_like',
            'message' => "{$this->liker->name} liked your comment."
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
