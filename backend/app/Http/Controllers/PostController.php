<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class PostController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display a listing of posts.
     * Supports filtering by category if passed through the route.
     */
    public function index(Request $request, ?Category $category = null): JsonResponse
    {
        // 1. Decide if we are looking at one category or the global feed
        $query = $category ? $category->posts() : Post::query();

        // 2. Eager load 'creator' and 'category' to avoid N+1 issues
        // 3. Sort by pinned first, then latest
        $posts = $query->with(['creator', 'category'])
            ->withCount('comments')
            ->orderByDesc('is_pinned')
            ->latest()
            ->paginate(15); // Use pagination for performance!

        return response()->json($posts);
    }

    public function show(Post $post): JsonResponse
    {
        // Load relationships and counts in one go
        return response()->json(
            $post->load(['creator', 'category'])->loadCount('comments')
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'body'        => 'required|string',
            'category_id' => 'required|exists:categories,id',
        ]);

        $post = auth()->user()->posts()->create($validated);

        // Load relations so the React frontend can display them immediately
        return response()->json($post->load('creator', 'category'), 201);
    }

    public function update(Request $request, Post $post): JsonResponse
    {
        $this->authorize('update', $post);

        $validated = $request->validate([
            'title'       => 'sometimes|string|max:255',
            'body'        => 'sometimes|string',
            'category_id' => 'sometimes|exists:categories,id',
        ]);

        $post->update($validated);

        return response()->json($post->load('creator', 'category'));
    }

    public function togglePin(Post $post): JsonResponse
    {
        // Ideally, only moderators should do this
        // $this->authorize('moderate', Post::class); 

        $post->update([
            'is_pinned' => !$post->is_pinned
        ]);

        return response()->json([
            'message'   => $post->is_pinned ? 'Post pinned!' : 'Post unpinned!',
            'is_pinned' => $post->is_pinned
        ]);
    }

    public function destroy(Post $post): JsonResponse
    {
        $this->authorize('delete', $post);

        $post->delete();

        return response()->json([
            'success' => true,
            'message' => 'Post deleted successfully'
        ], 200);
    }
}