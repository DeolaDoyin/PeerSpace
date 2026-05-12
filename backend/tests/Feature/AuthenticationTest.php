<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_authentication_flow()
{
    $user = User::factory()->create(['password' => bcrypt('secret')]);

    // Valid Login - Use 'login' as the key to match your frontend/validator
    $this->postJson('/api/login', [
        'login' => $user->name, 
        'password' => 'secret'
    ])->assertOk()->assertJsonStructure(['token']);
}

    
}