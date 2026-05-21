<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LikeApiTest extends TestCase
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

    private function makePost(User $author, Category $category): Post
    {
        return Post::create([
            'title' => 'Test Post',
            'slug' => 'test-post-' . uniqid(),
            'body' => 'Body',
            'user_id' => $author->id,
            'category_id' => $category->id,
        ]);
    }

    public function test_user_can_like_post(): void
    {
        $user = User::factory()->create();
        $category = $this->makeCategory();
        $post = $this->makePost($user, $category);
        Sanctum::actingAs($user);

        $response = $this->postJson("/api/posts/{$post->id}/like");

        $response->assertOk();
        $response->assertJson(['liked' => true]);
        $this->assertDatabaseHas('likes', [
            'user_id' => $user->id,
            'likeable_id' => $post->id,
            'likeable_type' => Post::class,
        ]);
    }

    public function test_user_can_unlike_post(): void
    {
        $user = User::factory()->create();
        $category = $this->makeCategory();
        $post = $this->makePost($user, $category);
        Sanctum::actingAs($user);

        // Like first
        $this->postJson("/api/posts/{$post->id}/like");

        // Unlike
        $response = $this->postJson("/api/posts/{$post->id}/like");

        $response->assertOk();
        $response->assertJson(['liked' => false]);
        $this->assertDatabaseMissing('likes', [
            'user_id' => $user->id,
            'likeable_id' => $post->id,
            'likeable_type' => Post::class,
        ]);
    }

    public function test_user_can_like_comment(): void
    {
        $user = User::factory()->create();
        $category = $this->makeCategory();
        $post = $this->makePost($user, $category);
        $comment = Comment::create([
            'post_id' => $post->id,
            'user_id' => $user->id,
            'content' => 'Likeable comment',
        ]);
        Sanctum::actingAs($user);

        $response = $this->postJson("/api/comments/{$comment->id}/like");

        $response->assertOk();
        $response->assertJson(['liked' => true]);
        $this->assertDatabaseHas('likes', [
            'user_id' => $user->id,
            'likeable_id' => $comment->id,
            'likeable_type' => Comment::class,
        ]);
    }

    public function test_user_can_unlike_comment(): void
    {
        $user = User::factory()->create();
        $category = $this->makeCategory();
        $post = $this->makePost($user, $category);
        $comment = Comment::create([
            'post_id' => $post->id,
            'user_id' => $user->id,
            'content' => 'Unlikeable comment',
        ]);
        Sanctum::actingAs($user);

        $this->postJson("/api/comments/{$comment->id}/like");
        $response = $this->postJson("/api/comments/{$comment->id}/like");

        $response->assertOk();
        $response->assertJson(['liked' => false]);
    }

    public function test_unauthenticated_cannot_like(): void
    {
        $category = $this->makeCategory();
        $author = User::factory()->create();
        $post = $this->makePost($author, $category);

        $response = $this->postJson("/api/posts/{$post->id}/like");

        $response->assertStatus(401);
    }
}
