<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use App\Notifications\VerifyEmailNotification;
use Tests\TestCase;

class ResendVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_cannot_resend()
    {
        $response = $this->postJson('/api/email/verification-notification');
        $response->assertStatus(401);
    }

    public function test_authenticated_user_receives_verification_email()
    {
        Notification::fake();

        $user = User::factory()->create([
            'email' => 'test@example.com',
            'email_verified_at' => null,
        ]);

        // Act as the user via Sanctum: create token and use header
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/email/verification-notification');

        $response->assertStatus(200);
        $response->assertJson(['message' => 'Verification email sent.']);

        Notification::assertSentTo($user, VerifyEmailNotification::class);
    }

    public function test_throttle_limits_resend_requests()
    {
        Notification::fake();

        $user = User::factory()->create([
            'email' => 'throttle@example.com',
            'email_verified_at' => null,
        ]);

        $token = $user->createToken('test')->plainTextToken;

        $tooMany = false;
        // Make 8 requests; the throttle is 6 per minute so at least some should be 429
        for ($i = 0; $i < 8; $i++) {
            $response = $this->withHeader('Authorization', 'Bearer ' . $token)
                ->postJson('/api/email/verification-notification');

            if ($response->getStatusCode() === 429) {
                $tooMany = true;
                break;
            }
        }

        $this->assertTrue($tooMany, 'Expected at least one 429 Too Many Requests response due to throttle');
    }
}
