<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Post;
use App\Models\Comment;

class LikeController extends Controller
{
    public function togglePost(Post $post)
    {
        $response = $this->toggle($post);
        $data = $response->getData();
        
        if ($data->liked && $post->user_id !== auth()->id()) {
            $post->creator->notify(new \App\Notifications\PostLiked($post, auth()->user()));
        }

        return $response;
    }

    public function toggleComment(Comment $comment)
    {
        return $this->toggle($comment);
    }

    protected function toggle($model)
    {
        $user = auth()->user();
        
        // Check if the record already exists
        $like = $model->likes()->where('user_id', $user->id)->first();

        if ($like) {
            $like->delete();
            return response()->json(['liked' => false, 'message' => 'Like removed']);
        }

        $model->likes()->create(['user_id' => $user->id]);
        return response()->json(['liked' => true, 'message' => 'Post liked!']);
    }
}
