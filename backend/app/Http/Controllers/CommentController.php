<?php

namespace App\Http\Controllers;

use App\Events\CommentCreated;
use App\Models\Post;
use App\Models\Comment;
use App\Models\Report;
use App\Models\User;
use App\Notifications\NewComment;
use App\Notifications\NewCommentOnFollowedPost;
use App\Notifications\CommentReplyReceived;
use App\Notifications\ContentReported;
use App\Services\CrisisKeywordService;
use App\Notifications\ContentDeleted;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;

class CommentController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request, Post $post)
    {
        $perPage = $request->filled('per_page')
            ? min(100, max(1, (int) $request->query('per_page')))
            : 50;

        return $post->comments()->with('user')->orderBy('created_at', 'asc')->paginate($perPage);
    }

    public function store(Request $request, Post $post)
    {
        // 1. Validate the input
        $request->validate([
            'content' => 'required|string|max:1000',
            'parent_id' => 'nullable|exists:comments,id',
        ]);

        // 2. Save to the database
        $comment = $post->comments()->create([
            'content' => $request->content,
            'user_id' => auth()->id(), // The currently logged in user
            'parent_id' => $request->parent_id,
        ]);

        $currentUser = auth()->user();

        // Auto-flag content from new accounts (less than 24 hours old)
        $isNewAccount = $currentUser->created_at && $currentUser->created_at->diffInHours(now()) < 24;
        if ($isNewAccount) {
            $existingReport = Report::where('reportable_id', $comment->id)
                ->where('reportable_type', Comment::class)
                ->where('status', 'pending')
                ->exists();

            if (!$existingReport) {
                Report::create([
                    'user_id' => $currentUser->id,
                    'reportable_id' => $comment->id,
                    'reportable_type' => Comment::class,
                    'status' => 'pending',
                ]);

                $moderators = User::whereIn('role', ['admin', 'moderator'])->get();
                Notification::send($moderators, new ContentReported('comment', $comment->id, $currentUser));
            }
        }

        // Check for crisis keywords and auto-report if detected
        $crisisCheck = CrisisKeywordService::check($request->content);
        if ($crisisCheck['matched'] && $crisisCheck['severity'] !== 'low') {
            $existingReport = Report::where('reportable_id', $comment->id)
                ->where('reportable_type', Comment::class)
                ->where('status', 'pending')
                ->exists();

            if (!$existingReport) {
                Report::create([
                    'user_id' => $currentUser->id,
                    'reportable_id' => $comment->id,
                    'reportable_type' => Comment::class,
                    'status' => 'pending',
                ]);

                $moderators = User::whereIn('role', ['admin', 'moderator'])->get();
                Notification::send($moderators, new ContentReported('comment', $comment->id, $currentUser));
            }
        }

        // 3. Send notifications
        $postOwner = $post->creator;
        $currentUser = auth()->user();
        $parentOwnerId = null;

        // Notify parent comment owner if this is a reply
        if ($request->parent_id) {
            $parentComment = Comment::find($request->parent_id);
            if ($parentComment && $parentComment->user_id !== $currentUser->id) {
                $parentComment->user->notify(new CommentReplyReceived($parentComment, $currentUser));
                $parentOwnerId = $parentComment->user_id;
            }
        }

        // Notify post owner (prevent duplicate if they already got a reply notification)
        if ($postOwner->id !== $currentUser->id && $postOwner->id !== $parentOwnerId) {
            $postOwner->notify(new NewComment($post, $currentUser));
        }

        // Notify followers
        $post->load('followedByUsers');
        foreach ($post->followedByUsers as $follower) {
            if ($follower->id !== $currentUser->id && $follower->id !== $postOwner->id && $follower->id !== $parentOwnerId) {
                $follower->notify(new NewCommentOnFollowedPost($post, $currentUser));
            }
        }

        $comment->load('user');
        broadcast(new CommentCreated($comment))->toOthers();

        $response = response()->json($comment);

        // If crisis keywords detected, include helpline info in response headers
        if ($crisisCheck['matched'] && $crisisCheck['severity'] !== 'low') {
            $response->header('X-Crisis-Detected', 'true');
            $response->header('X-Crisis-Helplines', json_encode(CrisisKeywordService::getHelplines()));
        }

        return $response;
    }

    public function destroy(Comment $comment)
    {
        // This one line checks the 'delete' method in CommentPolicy
        $this->authorize('delete', $comment);

        if ($comment->user_id !== auth()->id()) {
            $comment->user->notify(new ContentDeleted('comment'));
        }

        $comment->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}
