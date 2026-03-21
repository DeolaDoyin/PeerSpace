<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Notifications\Notifiable;
use App\Http\Controllers\PostController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\CategoryController;


Route::get('/', function () {
    return view('welcome');
});


Route::get('/test-session', function () {
    session(['test_key' => 'It works!']);
    return "Session file should exist now.";
});

// Only logged-in users can access these
// API routes have been moved to routes/api.php

	