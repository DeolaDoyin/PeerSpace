<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\Comment;
use App\Notifications\NewCommentReceived;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function index(Post $post)
    {
        return $post->comments;
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
            $postOwner->notify(new NewCommentReceived($comment));
        }

        return response()->json($comment->load('user'));
    }

    public function destroy(Comment $comment)
    {
        // This one line checks the 'delete' method in CommentPolicy
        $this->authorize('delete', $comment);

        $comment->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}
