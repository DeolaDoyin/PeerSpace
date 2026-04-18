<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Post;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ModerationTest extends TestCase
{
    use RefreshDatabase;

    public function test_suspended_user_cannot_login()
    {
        $user = User::factory()->create([
            'password' => bcrypt('password123'),
            'account_status' => 'suspended'
        ]);

        $response = $this->postJson('/api/login', [
            'login' => $user->email,
            'password' => 'password123'
        ]);

        $response->assertStatus(403);
        $response->assertJson(['message' => 'Your account has been suspended.']);
    }

    public function test_moderator_can_suspend_user()
    {
        $moderator = User::factory()->create(['role' => 'moderator']);
        $user = User::factory()->create(['role' => 'user', 'account_status' => 'active']);

        $response = $this->actingAs($moderator)->postJson("/api/users/{$user->id}/suspend", [
            'status' => 'suspended'
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'account_status' => 'suspended'
        ]);
    }

    public function test_moderator_can_delete_any_post()
    {
        $moderator = User::factory()->create(['role' => 'moderator']);
        $category = Category::factory()->create();
        
        $author = User::factory()->create();
        $post = Post::factory()->create([
            'user_id' => $author->id,
            'category_id' => $category->id
        ]);

        $response = $this->actingAs($moderator)->deleteJson("/api/posts/{$post->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('posts', ['id' => $post->id]);
    }

    public function test_user_can_submit_report()
    {
        $user = User::factory()->create();
        $category = Category::factory()->create();
        $post = Post::factory()->create(['user_id' => $user->id, 'category_id' => $category->id]);

        $reporter = User::factory()->create();
        
        $response = $this->actingAs($reporter)->postJson('/api/reports', [
            'reportable_id' => $post->id,
            'reportable_type' => 'post',
            'reason' => 'inappropriate content'
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('reports', [
            'reportable_id' => $post->id,
            'reason' => 'inappropriate content',
            'status' => 'pending'
        ]);
    }
}
