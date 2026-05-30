<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Artisan;
use App\Http\Controllers\PostController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\LikeController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\ChatMessageController;
use App\Http\Controllers\ModerationController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\PasswordController;
use App\Http\Controllers\UserProfileController;
use App\Services\RedditAliasService;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\ContactController;

Route::get('/health', function () {
    return response()->json(['status' => 'ok'], 200);
});

Route::get('/process-queue-secret-789', function (Request $request) {
    // SECURITY CHECK: Ensure the 'key' in the URL matches your secret
    if ($request->query('key') !== env('CRON_SECRET')) {
        abort(403, 'Unauthorized access.');
    }

    // This clears the emails waiting in the database
    Artisan::call('queue:work --max-jobs=3 --stop-when-empty');
    
    return response()->json(['message' => 'Queue processed successfully.']);
});

Route::middleware(['throttle:auth'])->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:register');
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [PasswordResetController::class, 'sendResetLinkEmail'])->middleware('guest')->name('password.email');
    Route::post('/reset-password', [PasswordResetController::class, 'reset'])->middleware('guest')->name('password.store');
});

Route::get('/email/verify/{id}/{hash}', [\App\Http\Controllers\VerificationController::class, 'verify'])
    ->middleware(['signed'])
    ->name('verification.verify');

Route::get('/auth/suggest-username', function () {
    return response(RedditAliasService::getNewAlias());
})->middleware('throttle:suggest-alias');

Route::get('/auth/{provider}/redirect', [AuthController::class, 'redirectToProvider']);
Route::get('/auth/{provider}/callback', [AuthController::class, 'handleProviderCallback']);

Route::post('/contact', [ContactController::class, 'store'])->middleware('throttle:post-write');

// Protected routes
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::get('/users/{user}/profile', [UserProfileController::class, 'show']);
    Route::put('/user', [AuthController::class, 'updateProfile']);
    Route::delete('/user', [AuthController::class, 'deleteAccount']);

    // Change password for the authenticated user (frontend posts to /api/user/password)
    Route::patch('/user/password', [PasswordController::class, 'update'])
        ->name('user.password.update');

    // Posts
    Route::get('posts', [PostController::class, 'index']);
    Route::get('posts/saved', [PostController::class, 'saved']);
    Route::get('posts/{post:slug}', [PostController::class, 'show'])->name('posts.show');
    // Keep delete (destroy) restricted to moderators via explicit route below
    Route::resource('posts', PostController::class)
        ->except(['index', 'show', 'destroy'])
        ->middleware('throttle:post-write');

    Route::post('/posts/{post}/save', [PostController::class, 'toggleSave']);
    Route::post('/posts/{post}/hide', [PostController::class, 'toggleHide']);
    Route::post('/posts/{post}/follow', [PostController::class, 'toggleFollow']);

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
    Route::get('/notifications', function (Request $request) {
        $perPage = min(50, max(1, (int) $request->query('per_page', 20)));
        return auth()->user()->unreadNotifications()->paginate($perPage);
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

    // Email verification: resend verification email for the authenticated user
    // Throttle: 6 requests per minute per user (adjust as needed)
    Route::post('/email/verification-notification', [\App\Http\Controllers\VerificationController::class, 'resend'])
        ->middleware('throttle:6,1');
        
    // The actual verification route doesn't strictly need auth:sanctum if it's signed,
    // but typically we can place it here or outside. We will place it outside so unauthenticated users can click the link.

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
        Route::post('/users/suspend', [ModerationController::class, 'suspendUser']);
        Route::get('/reports', [ReportController::class, 'index']);
        Route::patch('/reports/{report}/resolve', [ReportController::class, 'resolve']);
    });

    // Delete owned posts (policy checks ownership or staff role)
    Route::delete('/posts/{post}', [PostController::class, 'destroy']);

    Route::prefix('users/{user}')->group(function () {
        // Change password - PATCH /settings/users/1/password
        Route::patch('password', [PasswordController::class, 'update'])
            ->name('users.password.update');
    });

    Route::get('/chats/{chat}/room-key', [ChatController::class, 'getRoomKey']);
    Route::post('/chats/{chat}/room-key', [ChatController::class, 'setRoomKey']);

});
