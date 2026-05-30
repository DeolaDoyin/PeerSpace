<?php

namespace App\Http\Controllers;

use App\Events\ChatMessageSent;
use App\Models\Chat;
use App\Notifications\NewMessageNotification; // 💡 Import your notification class
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatMessageController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request, Chat $chat): JsonResponse
    {
        $this->authorize('view', $chat);

        $perPage = min(100, max(1, (int) $request->query('per_page', 50)));

        $messages = $chat->messages()
            ->with('sender')
            ->orderBy('created_at', 'asc')
            ->paginate($perPage);

        return response()->json($messages);
    }

    public function store(Request $request, Chat $chat): JsonResponse
    {
        $this->authorize('sendMessage', $chat);

        $data = $request->validate([
            'encrypted_payload' => ['required', 'string'],
            'iv'                => ['required', 'string'],
            'body'              => ['nullable', 'string', 'max:5000'], 
        ]);

        $message = $chat->messages()->create([
            'user_id'           => $request->user()->id,
            'encrypted_payload' => $data['encrypted_payload'],
            'iv'                => $data['iv'],
            'body'              => $data['body'] ?? '[End-to-End Encrypted Content]',
        ]);

        $chat->touch();
        $message->load('sender');
        
        // Broadcast the real-time event
        broadcast(new ChatMessageSent($message))->toOthers();

        // 💡 SAFE RECIPIENT LOOKUP: Try common relationship styles dynamically
        $authId = $request->user()->id;
        $recipient = null;

        if (method_exists($chat, 'users')) {
            $recipient = $chat->users()->where('users.id', '!=', $authId)->first();
        } elseif (method_exists($chat, 'participants')) {
            $recipient = $chat->participants()->where('users.id', '!=', $authId)->first();
        } else {
            // Fallback: If it's a direct conversation table with explicit user IDs
            $recipientId = ($chat->user_one_id == $authId) ? $chat->user_two_id : $chat->user_one_id;
            if ($recipientId) {
                $recipient = \App\Models\User::find($recipientId);
            }
        }

        // Only notify if we successfully located a valid peer model record
        if ($recipient) {
            try {
                $recipient->notify(new NewMessageNotification($message));
            } catch (\Exception $e) {
                // Log notification errors silently so it doesn't break the actual message delivery payload
                \Log::error('E2EE Notification Failed: ' . $e->getMessage());
            }
        }

        return response()->json([
            'id'                => $message->id,
            'chat_id'           => $message->chat_id,
            'user_id'           => $message->user_id,
            'body'              => $message->body,
            'encrypted_payload' => $message->encrypted_payload,
            'iv'                => $message->iv,
            'created_at'        => $message->created_at,
            'sender'            => $message->sender ? [
                'id'   => $message->sender->id,
                'name' => $message->sender->name,
            ] : null,
        ], 201);
        \Log::info('RAW', [
    'iv_len' => strlen($data['iv']),
    'payload_len' => strlen($data['encrypted_payload']),
    'iv' => $data['iv'],
    'payload' => substr($data['encrypted_payload'], 0, 60),
]);
    }
}