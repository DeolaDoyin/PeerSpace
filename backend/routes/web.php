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

// Only logged-in users can access these
// API routes have been moved to routes/api.php

