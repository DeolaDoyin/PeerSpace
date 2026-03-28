<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PostController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\LikeController;
use App\Services\NotificationService;
use App\Services\RedditAliasService;

// Route::get('posts', [PostController::class, 'index']);

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout']);

Route::get('/auth/suggest-username', function () {
    return response(RedditAliasService::getNewAlias());
});

// Protected routes
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::put('/user', [AuthController::class, 'updateProfile']);

    // Posts
    Route::get('posts', [PostController::class, 'index']);
    Route::get('posts/{post:slug}', [PostController::class, 'show'])->name('posts.show');
    Route::resource('posts', PostController::class)->except(['index', 'show']); 

    // Comments
    Route::get('/posts/{post}/comments', [CommentController::class, 'index']);
    Route::post('/posts/{post}/comments', [CommentController::class, 'store']);

    // Categories
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/categories/{category}/posts', [PostController::class, 'index']);

    // Notifications
    Route::get('/notifications', function () {
        return auth()->user()->unreadNotifications;
    });

    // Like
    Route::post('/posts/{post}/like', [LikeController::class, 'togglePost']);
    Route::post('/comments/{comment}/like', [LikeController::class, 'toggleComment']);

    // Admin routes
    Route::middleware(['admin'])->group(function () {
        Route::post('/categories', [CategoryController::class, 'store']);
    });

    // Moderator routes
    Route::middleware(['moderator'])->group(function () {
        Route::patch('/posts/{post}/pin', [PostController::class, 'togglePin']);
        // Route::delete('/posts/{post}', [PostController::class, 'destroy']);
    });
});
