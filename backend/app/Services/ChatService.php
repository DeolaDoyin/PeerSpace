<?php

namespace App\Services;

use App\Models\Chat;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ChatService
{
    /**
     * Find an existing direct chat between two users (exactly two members) or create one.
     *
     * @return array{0: Chat, 1: bool} Chat and whether it was just created.
     */
    public function findOrCreateDirectChat(User $actor, int $otherUserId): array
    {
        if ($otherUserId === $actor->id) {
            throw new \InvalidArgumentException('Cannot start a chat with yourself.');
        }

        if (! User::query()->whereKey($otherUserId)->exists()) {
            throw new \InvalidArgumentException('User not found.');
        }

        $idsA = DB::table('chat_user')->where('user_id', $actor->id)->pluck('chat_id');
        $idsB = DB::table('chat_user')->where('user_id', $otherUserId)->pluck('chat_id');
        $both = $idsA->intersect($idsB)->values()->all();

        $existing = Chat::query()
            ->where('type', 'direct')
            ->whereIn('id', $both ?: [0])
            ->withCount('users')
            ->get()
            ->firstWhere('users_count', 2);

        if ($existing) {
            return [$existing, false];
        }

        $chat = DB::transaction(function () use ($actor, $otherUserId) {
            $chat = Chat::create(['type' => 'direct']);
            $chat->users()->attach([$actor->id, $otherUserId]);

            return $chat;
        });

        return [$chat, true];
    }
}
