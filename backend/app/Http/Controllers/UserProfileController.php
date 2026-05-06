<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;

class UserProfileController extends Controller
{
    public function show(User $user): JsonResponse
    {
        $posts = $user->posts()
            ->with('category')
            ->withCount('comments')
            ->withCount('likes')
            ->latest()
            ->limit(20)
            ->get();

        $comments = $user->comments()
            ->with(['post:id,slug,title'])
            ->latest()
            ->limit(20)
            ->get();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
            ],
            'posts' => $posts,
            'comments' => $comments,
        ]);
    }
}
