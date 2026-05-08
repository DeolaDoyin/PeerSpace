<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Illuminate\Support\Str;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    private function createNotification(User $user): string
    {
        $id = (string) Str::uuid();
        \DB::table('notifications')->insert([
            'id' => $id,
            'type' => 'App\\Notifications\\NewComment',
            'notifiable_type' => 'App\\Models\\User',
            'notifiable_id' => $user->id,
            'data' => json_encode(['message' => 'Test notification']),
            'read_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        return $id;
    }

    public function test_user_can_list_notifications(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/notifications');

        $response->assertOk();
    }

    public function test_user_can_mark_notification_as_read(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $notifId = $this->createNotification($user);

        $response = $this->postJson("/api/notifications/{$notifId}/read");

        $response->assertOk();
        $this->assertDatabaseHas('notifications', [
            'id' => $notifId,
        ]);
        $this->assertNotNull(\DB::table('notifications')->where('id', $notifId)->first()->read_at);
    }

    public function test_user_can_mark_all_notifications_as_read(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->createNotification($user);
        $this->createNotification($user);

        $response = $this->postJson('/api/notifications/mark-all-read');

        $response->assertOk();
    }

    public function test_unauthenticated_cannot_list_notifications(): void
    {
        $response = $this->getJson('/api/notifications');

        $response->assertStatus(401);
    }
}
