<?php

namespace App\Events;

use App\Models\Comment;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CommentCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Comment $comment) {}

    /**
     * Forum discussion = Post; clients subscribe to presence channel post.{posts.id}.
     */
    public function broadcastOn(): array
    {
        return [
            new PresenceChannel('post.' . $this->comment->post_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'comment.created';
    }

    public function broadcastWith(): array
    {
        $this->comment->loadMissing('user');

        return [
            'comment' => [
                'id' => $this->comment->id,
                'post_id' => $this->comment->post_id,
                'content' => $this->comment->content,
                'created_at' => $this->comment->created_at?->toIso8601String(),
                'user' => [
                    'id' => $this->comment->user->id,
                    'name' => $this->comment->user->name,
                ],
            ],
        ];
    }
}
