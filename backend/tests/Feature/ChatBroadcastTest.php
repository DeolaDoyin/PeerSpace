<?php

namespace Tests\Feature;

use App\Events\ChatMessageSent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ChatBroadcastTest extends TestCase
{
    use RefreshDatabase;

    public function test_sending_chat_message_dispatches_broadcast_event(): void
    {
        Event::fake([ChatMessageSent::class]);

        $a = User::factory()->create();
        $b = User::factory()->create();

        Sanctum::actingAs($a);

        // Change 'user_id' => $b->id to 'username' => $b->name
        $response = $this->postJson('/api/chats', ['username' => $b->name]);
        
        // Safety check: ensure the chat was actually created before proceeding
        $response->assertCreated(); 
        $chatId = $response->json('id');

        $this->postJson("/api/chats/{$chatId}/messages", ['body' => 'Hello over WS'])->assertCreated();

        Event::assertDispatched(ChatMessageSent::class, function (ChatMessageSent $event) use ($chatId) {
            $channel = $event->broadcastOn()[0];

            return (int) $event->message->chat_id === (int) $chatId
                && $channel->name === 'presence-chat.'.$chatId;
        });
    }
}
