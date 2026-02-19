<?php
namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PostController extends Controller
{
    // List all posts in a category
    // public function index(Category $category)
    // {
    //     return $category->posts()
    //     ->with('creator')
    //     ->withCount('comments')
    //     ->orderBy('is_pinned', 'desc')
    //     ->latest()
    //     ->get();
    // }

    public function index(): JsonResponse
    {
        // Fetch all posts from the DB
        $posts = Post::all();

        // Return them as a JSON response
        return response()->json($posts);
    }

    // Get a specific post
    public function show(Post $post)
    {
        return $post->load(['creator', 'category'])
            ->loadCount('comments');
    }

    // Create a new thread
    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
        ]);

        $post = auth()->user()->posts()->create($data);

        return response()->json($post, 201);
    }

    public function togglePin(Post $post)
    {
        // Flip the boolean (if true becomes false, if false becomes true)
        $post->update([
            'is_pinned' => ! $post->is_pinned
        ]);

        return response()->json([
            'message' => $post->is_pinned ? 'Post pinned!' : 'Post unpinned!',
            'is_pinned' => $post->is_pinned
        ]);
    }
}