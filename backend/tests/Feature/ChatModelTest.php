<?php

namespace Tests\Feature;

use App\Models\Chat;
use App\Models\ChatMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChatModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_chat_membership_and_messages_persist(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create();

        $chat = Chat::create(['type' => 'direct']);
        $chat->users()->attach([$a->id => [], $b->id => []]);

        $this->assertTrue($chat->hasMember($a));
        $this->assertTrue($chat->hasMember($b));

        $message = $chat->messages()->create([
            'user_id' => $a->id,
            'body' => 'Hello',
        ]);

        $this->assertInstanceOf(ChatMessage::class, $message);
        $this->assertSame($chat->id, $message->chat_id);
        $this->assertSame('Hello', $message->body);

        $this->assertCount(1, $a->chats);
        $this->assertCount(1, $a->chatMessages);
    }
}
