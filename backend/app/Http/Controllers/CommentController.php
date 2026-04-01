<?php

namespace App\Http\Controllers;

use App\Events\CommentCreated;
use App\Models\Post;
use App\Models\Comment;
use App\Notifications\NewComment;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request, Post $post)
    {
        $query = $post->comments()->with('user')->orderBy('created_at', 'asc');

        if ($request->filled('per_page')) {
            $perPage = min(100, max(1, (int) $request->query('per_page')));

            return $query->paginate($perPage);
        }

        return $query->get();
    }

    public function store(Request $request, Post $post)
    {
        // 1. Validate the input
        $request->validate([
            'content' => 'required|string|max:1000',
        ]);

        // 2. Save to the database
        $comment = $post->comments()->create([
            'content' => $request->content,
            'user_id' => auth()->id(), // The currently logged in user
        ]);

        // 3. Send notification to the post author
        $postOwner = $post->creator;
        
        // Don't notify the user about their own comment!
        if ($postOwner->id !== auth()->id()) {
            $postOwner->notify(new NewComment($post, auth()->user()));
        }

        $comment->load('user');
        broadcast(new CommentCreated($comment))->toOthers();

        return response()->json($comment);
    }

    public function destroy(Comment $comment)
    {
        // This one line checks the 'delete' method in CommentPolicy
        $this->authorize('delete', $comment);

        $comment->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}
