<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PostController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\LikeController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\ChatMessageController;
use App\Http\Controllers\ModerationController;
use App\Http\Controllers\ReportController;
use App\Services\RedditAliasService;

Route::middleware(['throttle:auth'])->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

Route::get('/auth/suggest-username', function () {
    return response(RedditAliasService::getNewAlias());
})->middleware('throttle:suggest-alias');

// Protected routes
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::put('/user', [AuthController::class, 'updateProfile']);

    // Posts
    Route::get('posts', [PostController::class, 'index']);
    Route::get('posts/{post:slug}', [PostController::class, 'show'])->name('posts.show');
    // Keep delete (destroy) restricted to moderators via explicit route below
    Route::resource('posts', PostController::class)
        ->except(['index', 'show', 'destroy'])
        ->middleware('throttle:post-write');

    // Ensure this is inside your auth middleware group if reporting requires login
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/posts/{post}/report', [PostController::class, 'report']);
    });

    // Comments
    Route::get('/posts/{post}/comments', [CommentController::class, 'index']);
    Route::post('/posts/{post}/comments', [CommentController::class, 'store'])->middleware('throttle:comments');
    Route::delete('/comments/{comment}', [CommentController::class, 'destroy']);

    // Categories
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/categories/{category}/posts', [PostController::class, 'index']);

    // Notifications
    Route::get('/notifications', function () {
        return auth()->user()->unreadNotifications;
    });
    
    Route::post('/notifications/{id}/read', function ($id) {
        $notification = auth()->user()->notifications()->find($id);
        if ($notification) {
            $notification->markAsRead();
        }
        return response()->json(['success' => true]);
    });

    Route::post('/notifications/mark-all-read', function () {
        auth()->user()->unreadNotifications->markAsRead();
        return response()->json(['success' => true]);
    });

    // Reports (User)
    Route::post('/reports', [ReportController::class, 'store'])->middleware('throttle:post-write');

    // Like
    Route::post('/posts/{post}/like', [LikeController::class, 'togglePost'])->middleware('throttle:likes');
    Route::post('/comments/{comment}/like', [LikeController::class, 'toggleComment'])->middleware('throttle:likes');

    // Chats (direct messages)
    Route::get('/chats', [ChatController::class, 'index']);
    Route::post('/chats', [ChatController::class, 'store'])->middleware('throttle:chat-start');
    Route::get('/chats/{chat}/messages', [ChatMessageController::class, 'index']);
    Route::post('/chats/{chat}/messages', [ChatMessageController::class, 'store'])->middleware('throttle:chat-messages');

    // Admin routes
    Route::middleware(['admin'])->group(function () {
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::post('/users/promote', [AuthController::class, 'promote']);
    });

    // Moderator routes
    Route::middleware(['moderator'])->group(function () {
        Route::patch('/posts/{post}/pin', [PostController::class, 'togglePin']);
        Route::delete('/posts/{post}', [PostController::class, 'destroy']);
        Route::post('/users/{user}/suspend', [ModerationController::class, 'suspendUser']);
        Route::get('/reports', [ReportController::class, 'index']);
        Route::patch('/reports/{report}/resolve', [ReportController::class, 'resolve']);
    });
});
