<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

use Laravel\Sanctum\Sanctum;
use App\Models\Category;

class DbTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_creation()
    {
        $user = User::factory()->create();
        $this->assertNotNull($user->id);

        $category = Category::create([
            'name' => 'General',
            'slug' => 'general',
            'description' => 'General discussion',
        ]);
        $this->assertNotNull($category->id);

        Sanctum::actingAs($user);
        $this->assertTrue(true);
    }
}
