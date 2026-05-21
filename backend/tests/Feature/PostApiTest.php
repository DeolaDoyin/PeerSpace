<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PostApiTest extends TestCase
{
    use RefreshDatabase;

    private function makeCategory(): Category
    {
        return Category::create([
            'name' => 'General',
            'slug' => 'general-' . uniqid(),
            'description' => 'General discussion',
        ]);
    }

    public function test_user_can_create_post(): void
    {
        $user = User::factory()->create();
        $category = $this->makeCategory();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/posts', [
            'title' => 'My Test Post',
            'body' => 'This is the body.',
            'category_id' => $category->id,
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('posts', [
            'title' => 'My Test Post',
            'user_id' => $user->id,
            'category_id' => $category->id,
        ]);
    }

    public function test_post_slug_is_auto_generated(): void
    {
        $user = User::factory()->create();
        $category = $this->makeCategory();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/posts', [
            'title' => 'Hello World Post',
            'category_id' => $category->id,
        ]);

        $response->assertCreated();
        $this->assertNotNull($response->json('slug'));
        $this->assertStringContainsString('hello-world', $response->json('slug'));
    }

    public function test_create_post_validates_required_fields(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/posts', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['title', 'category_id']);
    }

    public function test_create_post_requires_valid_category(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/posts', [
            'title' => 'Test Post',
            'category_id' => 99999,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['category_id']);
    }

    public function test_unauthenticated_cannot_create_post(): void
    {
        $category = $this->makeCategory();

        $response = $this->postJson('/api/posts', [
            'title' => 'Test Post',
            'category_id' => $category->id,
        ]);

        $response->assertStatus(401);
    }

    public function test_user_can_view_post_by_slug(): void
    {
        $user = User::factory()->create();
        $category = $this->makeCategory();
        Sanctum::actingAs($user);

        $createResponse = $this->postJson('/api/posts', [
            'title' => 'Viewable Post',
            'body' => 'Post body here.',
            'category_id' => $category->id,
        ]);

        $slug = $createResponse->json('slug');

        $response = $this->getJson("/api/posts/{$slug}");

        $response->assertOk();
        $response->assertJsonStructure([
            'id', 'title', 'slug', 'body',
            'creator', 'category', 'comments_count',
        ]);
    }

    public function test_user_can_update_own_post(): void
    {
        $user = User::factory()->create();
        $category = $this->makeCategory();
        Sanctum::actingAs($user);

        $createResponse = $this->postJson('/api/posts', [
            'title' => 'Original Title',
            'category_id' => $category->id,
        ]);

        $postId = $createResponse->json('id');

        $response = $this->putJson("/api/posts/{$postId}", [
            'title' => 'Updated Title',
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('posts', ['id' => $postId, 'title' => 'Updated Title']);
    }

    public function test_user_cannot_update_others_post(): void
    {
        $author = User::factory()->create();
        $intruder = User::factory()->create();
        $category = $this->makeCategory();

        Sanctum::actingAs($author);
        $createResponse = $this->postJson('/api/posts', [
            'title' => 'Authors Post',
            'category_id' => $category->id,
        ]);
        $postId = $createResponse->json('id');

        Sanctum::actingAs($intruder);
        $response = $this->putJson("/api/posts/{$postId}", [
            'title' => 'Hijacked Title',
        ]);

        $response->assertForbidden();
    }

    public function test_user_can_delete_own_post(): void
    {
        $user = User::factory()->create();
        $category = $this->makeCategory();
        Sanctum::actingAs($user);

        $createResponse = $this->postJson('/api/posts', [
            'title' => 'Delete Me',
            'category_id' => $category->id,
        ]);
        $postId = $createResponse->json('id');

        $response = $this->deleteJson("/api/posts/{$postId}");

        $response->assertOk();
        $this->assertDatabaseMissing('posts', ['id' => $postId]);
    }

    public function test_user_can_save_and_unsave_post(): void
    {
        $user = User::factory()->create();
        $category = $this->makeCategory();
        Sanctum::actingAs($user);

        $createResponse = $this->postJson('/api/posts', [
            'title' => 'Saveable Post',
            'category_id' => $category->id,
        ]);
        $postId = $createResponse->json('id');

        // Save
        $saveResponse = $this->postJson("/api/posts/{$postId}/save");
        $saveResponse->assertOk();
        $saveResponse->assertJson(['is_saved' => true]);

        // Unsave
        $unsaveResponse = $this->postJson("/api/posts/{$postId}/save");
        $unsaveResponse->assertOk();
        $unsaveResponse->assertJson(['is_saved' => false]);
    }

    public function test_user_can_hide_and_unhide_post(): void
    {
        $user = User::factory()->create();
        $category = $this->makeCategory();
        Sanctum::actingAs($user);

        $createResponse = $this->postJson('/api/posts', [
            'title' => 'Hideable Post',
            'category_id' => $category->id,
        ]);
        $postId = $createResponse->json('id');

        // Hide
        $hideResponse = $this->postJson("/api/posts/{$postId}/hide");
        $hideResponse->assertOk();
        $hideResponse->assertJson(['is_hidden' => true]);

        // Unhide
        $unhideResponse = $this->postJson("/api/posts/{$postId}/hide");
        $unhideResponse->assertOk();
        $unhideResponse->assertJson(['is_hidden' => false]);
    }

    public function test_user_can_follow_and_unfollow_post(): void
    {
        $user = User::factory()->create();
        $category = $this->makeCategory();
        Sanctum::actingAs($user);

        $createResponse = $this->postJson('/api/posts', [
            'title' => 'Followable Post',
            'category_id' => $category->id,
        ]);
        $postId = $createResponse->json('id');

        // Follow
        $followResponse = $this->postJson("/api/posts/{$postId}/follow");
        $followResponse->assertOk();
        $followResponse->assertJson(['is_followed' => true]);

        // Unfollow
        $unfollowResponse = $this->postJson("/api/posts/{$postId}/follow");
        $unfollowResponse->assertOk();
        $unfollowResponse->assertJson(['is_followed' => false]);
    }

    public function test_moderator_can_pin_post(): void
    {
        $moderator = User::factory()->create(['role' => 'moderator']);
        $category = $this->makeCategory();
        $author = User::factory()->create();

        Sanctum::actingAs($author);
        $createResponse = $this->postJson('/api/posts', [
            'title' => 'Pinnable Post',
            'category_id' => $category->id,
        ]);
        $postId = $createResponse->json('id');

        Sanctum::actingAs($moderator);
        $response = $this->patchJson("/api/posts/{$postId}/pin");

        $response->assertOk();
        $this->assertDatabaseHas('posts', ['id' => $postId, 'is_pinned' => true]);
    }

    public function test_regular_user_cannot_pin_post(): void
    {
        $user = User::factory()->create();
        $category = $this->makeCategory();
        Sanctum::actingAs($user);

        $createResponse = $this->postJson('/api/posts', [
            'title' => 'Post',
            'category_id' => $category->id,
        ]);
        $postId = $createResponse->json('id');

        $response = $this->patchJson("/api/posts/{$postId}/pin");

        $response->assertStatus(403);
    }

    public function test_posts_index_is_paginated(): void
    {
        $user = User::factory()->create();
        $category = $this->makeCategory();
        Sanctum::actingAs($user);

        for ($i = 0; $i < 20; $i++) {
            Post::create([
                'title' => "Post $i",
                'slug' => "post-$i-" . uniqid(),
                'body' => 'Body',
                'user_id' => $user->id,
                'category_id' => $category->id,
            ]);
        }

        $response = $this->getJson('/api/posts');

        $response->assertOk();
        $response->assertJsonPath('total', 20);
        $response->assertJsonCount(15, 'data');
    }

    public function test_user_can_view_saved_posts(): void
    {
        $user = User::factory()->create();
        $category = $this->makeCategory();
        Sanctum::actingAs($user);

        $createResponse = $this->postJson('/api/posts', [
            'title' => 'Saved Post',
            'category_id' => $category->id,
        ]);
        $postId = $createResponse->json('id');

        $this->postJson("/api/posts/{$postId}/save");

        $response = $this->getJson('/api/posts/saved');

        $response->assertOk();
    }

    public function test_hidden_posts_excluded_from_index(): void
    {
        $user = User::factory()->create();
        $category = $this->makeCategory();
        Sanctum::actingAs($user);

        $createResponse = $this->postJson('/api/posts', [
            'title' => 'Hidden Post',
            'category_id' => $category->id,
        ]);
        $postId = $createResponse->json('id');

        $this->postJson("/api/posts/{$postId}/hide");

        $response = $this->getJson('/api/posts');

        $response->assertOk();
        $posts = collect($response->json('data'));
        $this->assertTrue($posts->every(fn($p) => $p['id'] !== $postId));
    }
}
