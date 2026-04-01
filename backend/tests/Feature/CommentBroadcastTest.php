<?php

namespace Tests\Feature;

use App\Events\CommentCreated;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CommentBroadcastTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_comment_dispatches_comment_created_broadcast_event(): void
    {
        Event::fake([CommentCreated::class]);

        $user = User::factory()->create();
        $category = Category::create([
            'name' => 'General',
            'slug' => 'general-'.uniqid(),
            'description' => 'General discussion',
        ]);

        Sanctum::actingAs($user);

        $postResponse = $this->postJson('/api/posts', [
            'title' => 'Live thread',
            'category_id' => $category->id,
        ]);
        $postId = $postResponse->json('id');

        $this->postJson("/api/posts/{$postId}/comments", [
            'content' => 'Realtime',
        ])->assertOk();

        Event::assertDispatched(CommentCreated::class, function (CommentCreated $event) use ($postId) {
            $channel = $event->broadcastOn()[0];

            return (int) $event->comment->post_id === (int) $postId
                && $channel->name === 'presence-post.'.$postId;
        });
    }
}
