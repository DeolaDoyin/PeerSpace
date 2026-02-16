<?php

use App\Models\Thread;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('thread.{threadId}', function ($user, $threadId) {
    // Basic check: Is the user logged in? 
    // In a peer-support forum, you could later add logic to check 
    // if the user is a member of this specific private thread.
    if ($user) {
        return ['id' => $user->id, 'name' => $user->name];
    }
});
