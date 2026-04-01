<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Services\ChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $chats = $user->chats()
            ->with(['latestMessage.sender', 'users'])
            ->orderByDesc('chats.updated_at')
            ->get();

        $payload = $chats->map(function (Chat $chat) use ($user) {
            $peer = $chat->type === 'direct'
                ? $chat->users->firstWhere('id', '!=', $user->id)
                : null;

            $last = $chat->latestMessage;

            return [
                'id' => $chat->id,
                'type' => $chat->type,
                'updated_at' => $chat->updated_at,
                'peer' => $peer ? [
                    'id' => $peer->id,
                    'name' => $peer->name,
                ] : null,
                'last_message' => $last ? [
                    'id' => $last->id,
                    'body' => $last->body,
                    'created_at' => $last->created_at,
                    'user_id' => $last->user_id,
                    'sender' => $last->sender ? [
                        'id' => $last->sender->id,
                        'name' => $last->sender->name,
                    ] : null,
                ] : null,
            ];
        });

        return response()->json($payload);
    }

    public function store(Request $request, ChatService $chats): JsonResponse
    {
        $data = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        try {
            [$chat, $created] = $chats->findOrCreateDirectChat($request->user(), (int) $data['user_id']);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $chat->load(['latestMessage.sender', 'users']);

        $user = $request->user();
        $peer = $chat->users->firstWhere('id', '!=', $user->id);
        $last = $chat->latestMessage;

        return response()->json([
            'id' => $chat->id,
            'type' => $chat->type,
            'updated_at' => $chat->updated_at,
            'peer' => $peer ? [
                'id' => $peer->id,
                'name' => $peer->name,
            ] : null,
            'last_message' => $last ? [
                'id' => $last->id,
                'body' => $last->body,
                'created_at' => $last->created_at,
                'user_id' => $last->user_id,
                'sender' => $last->sender ? [
                    'id' => $last->sender->id,
                    'name' => $last->sender->name,
                ] : null,
            ] : null,
        ], $created ? 201 : 200);
    }
}
