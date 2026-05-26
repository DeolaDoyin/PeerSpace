<?php

namespace App\Http\Controllers;

use App\Events\ChatMessageSent;
use App\Models\Chat;
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

        // 💡 1. Swap old string body requirements for incoming E2EE fields
        $data = $request->validate([
            'encrypted_payload' => ['required', 'string'],
            'iv'                => ['required', 'string'],
            'body'              => ['nullable', 'string', 'max:5000'], // Optional plain-text fallback fallback
        ]);

        // 💡 2. Map fields to the message schema creation instance
        $message = $chat->messages()->create([
            'user_id'           => $request->user()->id,
            'encrypted_payload' => $data['encrypted_payload'],
            'iv'                => $data['iv'],
            // Fallback content block placeholder if database field has NOT been made nullable yet:
            'body'              => $data['body'] ?? '[End-to-End Encrypted Content]',
        ]);

        $chat->touch();

        $message->load('sender');
        broadcast(new ChatMessageSent($message))->toOthers();

        // 💡 3. Return full parameters back to the client interface API payload pipeline
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
    }
}