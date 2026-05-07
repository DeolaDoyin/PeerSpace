<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class ContactController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'subject' => 'required|string|in:General Inquiry,Technical Support',
            'message' => 'required|string|max:5000',
        ]);

        try {
            Mail::raw(
                "Name: {$validated['name']}\nEmail: {$validated['email']}\nSubject: {$validated['subject']}\n\nMessage:\n{$validated['message']}",
                function ($mail) use ($validated) {
                    $mail->to(config('mail.from.address', 'support@peerspace.com'))
                        ->subject("Contact: {$validated['subject']}")
                        ->from($validated['email'], $validated['name']);
                }
            );

            return response()->json(['message' => 'Thank you! Your message has been sent.']);
        } catch (\Exception $e) {
            \Log::error('Contact form submission failed', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to send message. Please try again later.'], 500);
        }
    }
}
