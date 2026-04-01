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

        $data = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
        ]);

        $message = $chat->messages()->create([
            'user_id' => $request->user()->id,
            'body' => $data['body'],
        ]);

        $chat->touch();

        $message->load('sender');
        broadcast(new ChatMessageSent($message))->toOthers();

        return response()->json([
            'id' => $message->id,
            'chat_id' => $message->chat_id,
            'user_id' => $message->user_id,
            'body' => $message->body,
            'created_at' => $message->created_at,
            'sender' => $message->sender ? [
                'id' => $message->sender->id,
                'name' => $message->sender->name,
            ] : null,
        ], 201);
    }
}
