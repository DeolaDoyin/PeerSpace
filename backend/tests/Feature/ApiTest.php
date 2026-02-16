<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_api_workflow()
    {
        // 1. Setup User and Category
        $user = User::factory()->create();
        $category = Category::create([
            'name' => 'General',
            'slug' => 'general',
            'description' => 'General discussion',
        ]);

        Sanctum::actingAs($user);

        // 2. Create a Post
        $postResponse = $this->postJson('/api/posts', [
            'title' => 'Hello World',
            'category_id' => $category->id,
        ]);

        $postResponse->assertCreated();
        $postId = $postResponse->json('id');
        $this->assertNotNull($postId);
        $slug = $postResponse->json('slug');

        // 3. Get the Post (Show)
        if ($slug) {
            $showResponse = $this->getJson("/api/posts/{$slug}");
            $showResponse->assertOk();
            $showResponse->assertJsonStructure(['creator', 'category', 'comments_count']);
        }

        // 4. Create a Comment
        $commentResponse = $this->postJson("/api/posts/{$postId}/comments", [
            'content' => 'This is a test comment.',
        ]);
        
        $commentResponse->assertStatus(200);

        // 5. List Comments
        $commentsResponse = $this->getJson("/api/posts/{$postId}/comments");
        
        $commentsResponse->assertOk();
        $commentsResponse->assertJsonCount(1);
        $commentsResponse->assertJsonFragment(['content' => 'This is a test comment.']);
    }
}
