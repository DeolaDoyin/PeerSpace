<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_view_another_users_profile(): void
    {
        $viewer = User::factory()->create();
        $profileUser = User::factory()->create(['name' => 'profileuser']);
        Sanctum::actingAs($viewer);

        $response = $this->getJson("/api/users/{$profileUser->id}/profile");

        $response->assertOk();
        $response->assertJsonStructure([
            'user' => ['id', 'name'],
            'posts',
            'comments',
        ]);
        $response->assertJsonPath('user.name', 'profileuser');
    }

    public function test_profile_includes_user_posts(): void
    {
        $viewer = User::factory()->create();
        $profileUser = User::factory()->create();
        $category = Category::factory()->create();
        Sanctum::actingAs($viewer);

        Post::create([
            'title' => 'User Post',
            'slug' => 'user-post-' . uniqid(),
            'body' => 'Body',
            'user_id' => $profileUser->id,
            'category_id' => $category->id,
        ]);

        $response = $this->getJson("/api/users/{$profileUser->id}/profile");

        $response->assertOk();
        $response->assertJsonCount(1, 'posts');
    }

    public function test_profile_includes_user_comments(): void
    {
        $viewer = User::factory()->create();
        $profileUser = User::factory()->create();
        $category = Category::factory()->create();
        Sanctum::actingAs($viewer);

        $post = Post::create([
            'title' => 'Some Post',
            'slug' => 'some-post-' . uniqid(),
            'body' => 'Body',
            'user_id' => $viewer->id,
            'category_id' => $category->id,
        ]);

        Comment::create([
            'post_id' => $post->id,
            'user_id' => $profileUser->id,
            'content' => 'User comment',
        ]);

        $response = $this->getJson("/api/users/{$profileUser->id}/profile");

        $response->assertOk();
        $response->assertJsonCount(1, 'comments');
    }

    public function test_profile_returns_404_for_nonexistent_user(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->getJson("/api/users/999999/profile");

        $response->assertStatus(404);
    }
}
