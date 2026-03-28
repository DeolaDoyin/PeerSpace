<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // 1. Register a new user
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'account_status' => 'active', // Default status from your ERD
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;
        Auth::login($user);

        return response()->json(['user' => $user, 'token' => $token, 'token_type' => 'Bearer', 'message' => 'Registration successful'], 201);
    }

    // 2. Login existing user
    // public function login(Request $request) 
    // {
    //     \Log::info($request->all());
    //     $request->validate([
    //         'login' => 'required|string',
    //         'password' => 'required|string',
    //     ]);
    //     // 1. Determine if the input is an email or a username
    //     $loginValue = $request->input('login');
    //     $field = filter_var($loginValue, FILTER_VALIDATE_EMAIL) ? 'email' : 'name';

    //     // 2. Attempt to find the user using the correct column
    //     $user = User::where($field, $loginValue)->first();

    //     if (!$user || !Hash::check($request->password, $user->password)) {
    //         return response()->json(['message' => 'Invalid credentials'], 401);
    //     }

    //     // 3. Create the token (Sanctum)
    //     $token = $user->createToken('auth_token')->plainTextToken;

    //     return response()->json([
    //         'user' => $user,
    //         'token' => $token,
    //         'message' => 'Login successful'
    //     ]);
    // }

    public function login(Request $request) 
{
    try {
        // Log to see if we even get past validation
        \Log::info("Starting validation...");
        \DB::listen(function($query) {
    \Log::info($query->sql);
    \Log::info($query->bindings);
});
        
        $request->validate([
            'login' => 'required|string',
            'password' => 'required|string',
        ]);

        \Log::info("Validation passed. Finding user...");

        $loginValue = $request->input('login');
        $field = filter_var($loginValue, FILTER_VALIDATE_EMAIL) ? 'email' : 'name';

        $user = User::where($field, $loginValue)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);

    } catch (\Exception $e) {
        \Log::error("Login Error: " . $e->getMessage());
        return response()->json(['error' => $e->getMessage()], 500);
    }
}

    // 3. Logout
    public function logout(Request $request)
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out']);
    }

    // 4. Update Profile
    public function updateProfile(Request $request)
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $user->id,
        ]);

        $user->update($validated);

        return response()->json($user);
    }
}