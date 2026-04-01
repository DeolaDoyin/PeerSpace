<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $user = App\Models\User::first();
    if (!$user) {
        die("No user found.");
    }
    auth()->login($user);

    $post = App\Models\Post::first();
    if (!$post) {
        die("No post found.");
    }
    
    echo "User: " . $user->id . "\n";
    echo "Post: " . $post->id . "\n";

    $controller = app(App\Http\Controllers\LikeController::class);
    $response = $controller->togglePost($post);
    
    echo "Response: " . $response->getContent() . "\n";
} catch (\Throwable $e) {
    echo "Exception: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ':' . $e->getLine() . "\n";
}
