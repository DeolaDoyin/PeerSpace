<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ChatInitiationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_initiate_chat_session()
    {
        $sender = User::factory()->create();
        $receiver = User::factory()->create();
        Sanctum::actingAs($sender);

        // Fixed: sending 'username' as per your backend requirement
        $response = $this->postJson('/api/chats', ['username' => $receiver->name]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('chats', ['type' => 'direct']);
    }
}