<?php

namespace App\Notifications;

use App\Models\Post;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class NewCommentOnFollowedPost extends Notification implements ShouldBroadcast, ShouldQueue
{
    use Queueable;

    public $post;
    public $commenter;

    public function __construct(Post $post, User $commenter)
    {
        $this->post = $post;
        $this->commenter = $commenter;
    }

    public function via($notifiable)
    {
        return ['database', 'broadcast'];
    }

    public function toDatabase($notifiable)
    {
        return [
            'post_id' => $this->post->id,
            'post_slug' => $this->post->slug,
            'post_title' => $this->post->title,
            'commenter_name' => $this->commenter->name,
            'type' => 'followed_post_comment',
            'message' => "{$this->commenter->name} commented on a post you follow."
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
