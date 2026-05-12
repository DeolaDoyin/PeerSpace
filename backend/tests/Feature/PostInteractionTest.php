<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Post;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PostInteractionTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_create_forum_post()
    {
        $user = User::factory()->create();
        $category = Category::create(['name' => 'General', 'slug' => 'general']);
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/posts', [
            'category_id' => $category->id,
            'title' => 'Sample Peer Support Post',
            'body' => 'Is anyone else feeling the pressure of finals?',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('posts', ['title' => 'Sample Peer Support Post']);
    }

   

}