<?php

namespace Tests\Feature;

use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use App\Models\User;
use Tests\TestCase;

class CategoryApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_anyone_can_list_categories(): void
    {
        Category::create(['name' => 'General', 'slug' => 'general', 'description' => 'General']);
        Category::create(['name' => 'Support', 'slug' => 'support', 'description' => 'Support']);

        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/categories');

        $response->assertOk();
        $response->assertJsonCount(2);
    }

    public function test_admin_can_create_category(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/categories', [
            'name' => 'New Category',
            'slug' => 'new-category',
            'description' => 'A new category',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('categories', ['name' => 'New Category', 'slug' => 'new-category']);
    }

    public function test_non_admin_cannot_create_category(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/categories', [
            'name' => 'New Category',
            'slug' => 'new-category',
        ]);

        $response->assertStatus(403);
    }

    public function test_category_posts_can_be_filtered(): void
    {
        $user = User::factory()->create();
        $category = Category::create(['name' => 'Tech', 'slug' => 'tech', 'description' => 'Tech']);
        Sanctum::actingAs($user);

        $this->postJson('/api/posts', [
            'title' => 'Tech Post',
            'category_id' => $category->id,
        ]);

        $response = $this->getJson("/api/categories/{$category->id}/posts");

        $response->assertOk();
    }
}
