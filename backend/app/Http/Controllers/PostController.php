<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\Category;
use App\Models\Report;
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
            ->whereDoesntHave('hiddenByUsers', function ($q) {
                $q->where('user_id', auth()->id());
            })
            ->withExists(['savedByUsers as is_saved' => function ($q) {
                $q->where('user_id', auth()->id());
            }])
            ->withExists(['followedByUsers as is_followed' => function ($q) {
                $q->where('user_id', auth()->id());
            }])
            ->orderByDesc('is_pinned')
            ->latest()
            ->paginate(15); // Use pagination for performance!

        return response()->json($posts);
    }

    public function show(Post $post): JsonResponse
    {
        // Load relationships and counts in one go
        return response()->json(
            $post->load(['creator', 'category'])
                 ->loadCount('comments')
                 ->loadExists(['savedByUsers as is_saved' => function ($q) {
                     $q->where('user_id', auth()->id());
                 }])
                 ->loadExists(['followedByUsers as is_followed' => function ($q) {
                     $q->where('user_id', auth()->id());
                 }])
        );
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'body'        => 'sometimes|string',
            'category_id' => 'required|exists:categories,id',
        ]);

        // Ensure body exists (tests expect posts can be created without an explicit body)
        $data = $validated + ['body' => $validated['body'] ?? ''];

        $post = auth()->user()->posts()->create($data);

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
        // Explicit role check in addition to route middleware
        $user = auth()->user();
        if (! $user || ! in_array($user->role, ['admin', 'moderator'])) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $post->update([
            'is_pinned' => !$post->is_pinned
        ]);

        return response()->json([
            'message'   => $post->is_pinned ? 'Post pinned!' : 'Post unpinned!',
            'is_pinned' => $post->is_pinned
        ]);
    }

    public function report(Request $request, Post $post)
    {
    try {
        $exists = Report::where('reportable_id', $post->id)
                    ->where('reportable_type', Post::class)
                    ->exists();

        if ($exists) {
            return response()->json(['message' => 'This post has already been reported and is currently under invertigation'], 422);
        }

        Report::create([
            'user_id' => auth()->id(),
            'reportable_id' => $post->id,
            'reportable_type' => Post::class,
        ]);

        return response()->json(['message' => 'Report submitted to moderators.']);
    } catch (\Exception $e) {
        // This will return the actual error message to your console log
        return response()->json(['error' => $e->getMessage()], 500);
    }
    }

    public function toggleSave(Post $post): JsonResponse
    {
        $user = auth()->user();
        $user->savedPosts()->toggle($post->id);
        
        return response()->json([
            'is_saved' => $user->savedPosts()->where('post_id', $post->id)->exists()
        ]);
    }

    public function toggleHide(Post $post): JsonResponse
    {
        $user = auth()->user();
        // Option to fully toggle or just hide. Usually 'Hide' is one-way from the feed, but toggle is fine.
        $user->hiddenPosts()->toggle($post->id);
        
        return response()->json([
            'is_hidden' => $user->hiddenPosts()->where('post_id', $post->id)->exists()
        ]);
    }

    public function toggleFollow(Post $post): JsonResponse
    {
        $user = auth()->user();
        $user->followedPosts()->toggle($post->id);
        
        return response()->json([
            'is_followed' => $user->followedPosts()->where('post_id', $post->id)->exists()
        ]);
    }
    public function destroy(Post $post): JsonResponse
    {
        // Authorize the deletion via policy (owner or admin)
        $this->authorize('delete', $post);

        $post->delete();

        return response()->json([
            'success' => true,
            'message' => 'Post deleted successfully'
        ], 200);
    }
}