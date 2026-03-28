<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class LikeController extends Controller
{
    public function togglePost(Post $post)
    {
        return $this->toggle($post);
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
