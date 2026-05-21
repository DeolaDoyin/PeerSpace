<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Hash;
use App\Notifications\ResetPasswordNotification;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_forgot_password_sends_reset_link(): void
    {
        Notification::fake();

        $user = User::factory()->create(['email' => 'test@example.com']);

        $response = $this->postJson('/api/forgot-password', [
            'email' => 'test@example.com',
        ]);

        $response->assertOk();
        $response->assertJson(['message' => 'We have emailed your password reset link.']);
    }

    public function test_forgot_password_validates_email(): void
    {
        $response = $this->postJson('/api/forgot-password', [
            'email' => 'not-an-email',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
    }

    public function test_forgot_password_requires_email(): void
    {
        $response = $this->postJson('/api/forgot-password', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
    }

    public function test_reset_password_with_valid_token(): void
    {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $token = \Illuminate\Support\Facades\Password::broker()->createToken($user);

        $response = $this->postJson('/api/reset-password', [
            'token' => $token,
            'email' => 'test@example.com',
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ]);

        $response->assertOk();
        $this->assertTrue(Hash::check('newpassword123', $user->fresh()->password));
    }

    public function test_reset_password_rejects_invalid_token(): void
    {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $response = $this->postJson('/api/reset-password', [
            'token' => 'invalid-token',
            'email' => 'test@example.com',
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ]);

        $response->assertStatus(422);
    }

    public function test_reset_password_validates_required_fields(): void
    {
        $response = $this->postJson('/api/reset-password', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['token', 'email', 'password']);
    }

    public function test_reset_password_validates_min_length(): void
    {
        $user = User::factory()->create(['email' => 'test@example.com']);
        $token = \Illuminate\Support\Facades\Password::broker()->createToken($user);

        $response = $this->postJson('/api/reset-password', [
            'token' => $token,
            'email' => 'test@example.com',
            'password' => 'short',
            'password_confirmation' => 'short',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['password']);
    }

    public function test_reset_password_validates_confirmation(): void
    {
        $user = User::factory()->create(['email' => 'test@example.com']);
        $token = \Illuminate\Support\Facades\Password::broker()->createToken($user);

        $response = $this->postJson('/api/reset-password', [
            'token' => $token,
            'email' => 'test@example.com',
            'password' => 'newpassword123',
            'password_confirmation' => 'differentpassword',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['password']);
    }
}
