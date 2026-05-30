<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Services\ChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class ChatController extends Controller
{
    use AuthorizesRequests;
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $perPage = min(50, max(1, (int) $request->query('per_page', 20)));

        $paginator = $user->chats()
            ->with(['latestMessage.sender', 'users'])
            ->orderByDesc('chats.updated_at')
            ->paginate($perPage);

        $payload = $paginator->getCollection()->map(function (Chat $chat) use ($user) {
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
                    // 💡 Pass E2EE payload & IV down to the React frontend mapping collection
                    'encrypted_payload' => $last->encrypted_payload,
                    'iv' => $last->iv,
                    'created_at' => $last->created_at,
                    'user_id' => $last->user_id,
                    'sender' => $last->sender ? [
                        'id' => $last->sender->id,
                        'name' => $last->sender->name,
                    ] : null,
                ] : null,
            ];
        });

        return response()->json([
            'data' => $payload,
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ]);
    }

    public function store(Request $request, ChatService $chats): JsonResponse
    {
        $data = $request->validate([
            'username' => ['required', 'string', 'exists:users,name'],
        ]);
        $targetUser = \App\Models\User::where('name', $data['username'])->first();

        try {
            [$chat, $created] = $chats->findOrCreateDirectChat($request->user(), (int) $targetUser->id);
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
                // 💡 Pass them here as well for when a chat is instantly opened or created
                'encrypted_payload' => $last->encrypted_payload,
                'iv' => $last->iv,
                'created_at' => $last->created_at,
                'user_id' => $last->user_id,
                'sender' => $last->sender ? [
                    'id' => $last->sender->id,
                    'name' => $last->sender->name,
                ] : null,
            ] : null,
        ], $created ? 201 : 200);
    }

    // GET /api/chats/{chat}/room-key  
public function getRoomKey(Request $request, Chat $chat): JsonResponse
{
    $this->authorize('view', $chat);
    return response()->json(['room_key' => $chat->room_key]);
}

// POST /api/chats/{chat}/room-key
public function setRoomKey(Request $request, Chat $chat): JsonResponse
{
    $this->authorize('view', $chat);
    
    // Only set if not already set — first writer wins
    if ($chat->room_key) {
        return response()->json(['room_key' => $chat->room_key]);
    }
    
    $data = $request->validate(['room_key' => ['required', 'string']]);
    $chat->update(['room_key' => $data['room_key']]);
    
    return response()->json(['room_key' => $chat->room_key]);
}
}