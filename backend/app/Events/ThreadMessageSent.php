<?php
namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ThreadMessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    // We pass the Message model here so the frontend gets the text and the sender name
    public function __construct(public Message $message) {}

    public function broadcastOn(): array
    {
        // This targets a specific thread. 
        // Example: Only people looking at Thread #5 will hear this event.
        return [
            new PresenceChannel('thread.' . $this->message->thread_id),
        ];
    }
}
