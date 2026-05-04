<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ChangePasswordTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_change_password()
    {
        $user = User::factory()->create([
            'password' => Hash::make('oldpassword123'),
        ]);

        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->patchJson('/api/users/' . $user->id . '/password', [
                'current_password' => 'oldpassword123',
                'password' => 'NewstrongPass1!',
                'password_confirmation' => 'NewstrongPass1!',
            ]);

        $response->assertStatus(200);
        $this->assertTrue(Hash::check('NewstrongPass1!', $user->fresh()->password));
    }

    public function test_wrong_current_password_returns_422()
    {
        $user = User::factory()->create([
            'password' => Hash::make('oldpassword123'),
        ]);

        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->patchJson('/api/users/' . $user->id . '/password', [
                'current_password' => 'wrongpass',
                'password' => 'NewstrongPass1!',
                'password_confirmation' => 'NewstrongPass1!',
            ]);

        $response->assertStatus(422);
        $this->assertTrue(Hash::check('oldpassword123', $user->fresh()->password));
    }

    public function test_validation_errors_return_422()
    {
        $user = User::factory()->create([
            'password' => Hash::make('oldpassword123'),
        ]);

        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->patchJson('/api/users/' . $user->id . '/password', [
                'current_password' => 'oldpassword123',
                'password' => 'short',
                'password_confirmation' => 'short',
            ]);

        $response->assertStatus(422);
    }
}
