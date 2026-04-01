<?php

use App\Models\Chat;
use App\Models\Post;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('post.{postId}', function (?User $user, string $postId) {
    if (! $user) {
        return false;
    }

    $post = Post::find($postId);
    if (! $post || ! $user->can('view', $post)) {
        return false;
    }

    return ['id' => $user->id, 'name' => $user->name];
});

Broadcast::channel('chat.{chatId}', function (?User $user, string $chatId) {
    if (! $user) {
        return false;
    }

    $chat = Chat::find($chatId);
    if (! $chat || ! $user->can('view', $chat)) {
        return false;
    }

    return ['id' => $user->id, 'name' => $user->name];
});
