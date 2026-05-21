<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ContactTest extends TestCase
{
    use RefreshDatabase;

    public function test_contact_form_sends_email(): void
    {
        $response = $this->postJson('/api/contact', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'subject' => 'General Inquiry',
            'message' => 'Hello, I need help.',
        ]);

        $response->assertOk();
        $response->assertJson(['message' => 'Thank you! Your message has been sent.']);
    }

    public function test_contact_form_validates_required_fields(): void
    {
        $response = $this->postJson('/api/contact', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name', 'email', 'subject', 'message']);
    }

    public function test_contact_form_validates_subject_enum(): void
    {
        $response = $this->postJson('/api/contact', [
            'name' => 'John',
            'email' => 'john@example.com',
            'subject' => 'Invalid Subject',
            'message' => 'Hello',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['subject']);
    }

    public function test_contact_form_validates_email_format(): void
    {
        $response = $this->postJson('/api/contact', [
            'name' => 'John',
            'email' => 'not-an-email',
            'subject' => 'General Inquiry',
            'message' => 'Hello',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
    }
}
