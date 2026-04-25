<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;

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
            $request->validate([
                'login' => 'required|string',
                'password' => 'required|string',
            ]);

            $loginValue = $request->input('login');
            $field = filter_var($loginValue, FILTER_VALIDATE_EMAIL) ? 'email' : 'name';

            $user = User::where($field, $loginValue)->first();

            if (!$user || !Hash::check($request->password, $user->password)) {
                return response()->json(['message' => 'Invalid credentials'], 401);
            }

            if ($user->account_status !== 'active') {
                return response()->json(['message' => 'Your account has been suspended.'], 403);
            }

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'user' => $user,
                'token' => $token,
            ]);

        } catch (\Exception $e) {
            // Log the exception server-side without exposing internals to clients
            \Log::error('Login Error', ['exception' => $e]);
            return response()->json(['message' => 'An internal error occurred.'], 500);
        }
}

    // 3. Logout
    public function logout(Request $request)
    {
        $user = $request->user();

        // Revoke the current access token if present (Sanctum)
        try {
            if ($user && method_exists($user, 'currentAccessToken') && $user->currentAccessToken()) {
                $user->currentAccessToken()->delete();
            } elseif ($user && method_exists($user, 'tokens')) {
                // Fallback: delete all tokens for the user
                $user->tokens()->delete();
            }
        } catch (\Exception $e) {
            \Log::warning('Failed to revoke token on logout', ['exception' => $e]);
        }

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

    // 5. Promote a user to moderator or admin
    public function promote(Request $request)
    {
        $request->validate([
            'login' => 'required|string',
            'role'  => 'required|in:admin,moderator,user',
        ]);

        $loginValue = $request->input('login');
        $field = filter_var($loginValue, FILTER_VALIDATE_EMAIL) ? 'email' : 'name';

        $user = User::where($field, $loginValue)->first();

        if (!$user) {
            return response()->json(['message' => 'User not found. Check spelling.'], 404);
        }

        $user->update(['role' => $request->role]);

        return response()->json([
            'message' => "Successfully updated {$user->name} to {$request->role}!"
        ]);
    }

    public function redirectToProvider($provider)
    {
        return response()->json([
            'url' => Socialite::driver($provider)->stateless()->redirect()->getTargetUrl()
        ]);
    }

    public function handleProviderCallback($provider)
    {
        try {
            $socialUser = Socialite::driver($provider)->stateless()->user();
            $user = User::where('email', $socialUser->getEmail())->first();

            if (!$user) {
                $user = User::create([
                    'name' => 'Anon_' . Str::random(6),
                    'email' => $socialUser->getEmail(),
                    'password' => Hash::make(Str::random(24)),
                    'account_status' => 'active',
                ]);
            }

            $token = $user->createToken('auth_token')->plainTextToken;
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
            
            return redirect()->away($frontendUrl . "/auth#oauth_token=" . $token);
        } catch (\Exception $e) {
            \Log::error('Socialite Error', ['exception' => $e]);
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
            return redirect()->away($frontendUrl . "/auth?error=oauth_failed");
        }
    }
}