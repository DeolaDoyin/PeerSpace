<?php

namespace Tests\Feature;

use App\Models\Chat;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ChatApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_creates_direct_chat_and_is_idempotent(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create();

        Sanctum::actingAs($a);

        $first = $this->postJson('/api/chats', ['user_id' => $b->id]);
        $first->assertCreated();
        $first->assertJsonPath('type', 'direct');
        $first->assertJsonPath('peer.id', $b->id);
        $chatId = $first->json('id');
        $this->assertIsInt($chatId);

        $second = $this->postJson('/api/chats', ['user_id' => $b->id]);
        $second->assertOk();
        $this->assertSame($chatId, $second->json('id'));
    }

    public function test_store_rejects_self_and_invalid_user(): void
    {
        $a = User::factory()->create();
        Sanctum::actingAs($a);

        $this->postJson('/api/chats', ['user_id' => $a->id])->assertStatus(422);
        $this->postJson('/api/chats', ['user_id' => 999_999])->assertUnprocessable();
    }

    public function test_index_lists_chats_for_member_only(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create();
        Sanctum::actingAs($a);
        $this->postJson('/api/chats', ['user_id' => $b->id])->assertCreated();

        $list = $this->getJson('/api/chats');
        $list->assertOk();
        $list->assertJsonCount(1);
        $list->assertJsonFragment(['peer' => ['id' => $b->id, 'name' => $b->name]]);
    }

    public function test_non_member_cannot_list_or_read_messages(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create();
        $c = User::factory()->create();

        Sanctum::actingAs($a);
        $chatId = $this->postJson('/api/chats', ['user_id' => $b->id])->json('id');

        Sanctum::actingAs($c);
        $this->getJson("/api/chats/{$chatId}/messages")->assertForbidden();
        $this->postJson("/api/chats/{$chatId}/messages", ['body' => 'Hi'])->assertForbidden();
    }

    public function test_messages_paginate_and_send_updates_chat(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create();
        Sanctum::actingAs($a);
        $chatId = $this->postJson('/api/chats', ['user_id' => $b->id])->json('id');

        $this->postJson("/api/chats/{$chatId}/messages", ['body' => 'Hello'])->assertCreated();
        $this->postJson("/api/chats/{$chatId}/messages", ['body' => 'World'])->assertCreated();

        $page = $this->getJson("/api/chats/{$chatId}/messages?per_page=1")->assertOk();
        $page->assertJsonPath('total', 2);
        $page->assertJsonCount(1, 'data');

        $updated = Chat::query()->findOrFail($chatId);
        $this->assertNotNull($updated->updated_at);
    }
}
