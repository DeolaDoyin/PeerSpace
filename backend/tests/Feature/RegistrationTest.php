<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_with_valid_data()
{
    $response = $this->postJson('/api/register', [
        'name' => 'Nathan Olokpo', // Ensure this matches your RegisterRequest validation
        'email' => 'nathan@example.com',
        'password' => 'SecurePass123',
        'password_confirmation' => 'SecurePass123',
    ]);

    $response->assertStatus(201);
}

    public function test_registration_fails_with_duplicate_email()
    {
        User::factory()->create(['email' => 'nathan@example.com']);

        $response = $this->postJson('/api/register', [
            'name' => 'Nathan Two',
            'email' => 'nathan@example.com',
            'password' => 'SecurePass123',
        ]);

        $response->assertStatus(422);
    }
}