<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;
use Illuminate\Auth\Events\Registered;
use App\Services\RedditAliasService;

class AuthController extends Controller
{
    // #region agent log
    private function agentLog(string $hypothesisId, string $message, array $data = []): void
    {
        try {
            file_put_contents(
                base_path('../debug-e43b30.log'),
                json_encode([
                    'sessionId' => 'e43b30',
                    'runId' => 'initial',
                    'hypothesisId' => $hypothesisId,
                    'location' => 'AuthController.php',
                    'message' => $message,
                    'data' => $data,
                    'timestamp' => round(microtime(true) * 1000),
                ]) . PHP_EOL,
                FILE_APPEND
            );
        } catch (\Throwable $e) {
        }
    }
    // #endregion

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

        event(new \Illuminate\Auth\Events\Registered($user));

        Auth::login($user);

        return response()->json(['user' => $user, 'message' => 'Registration successful'], 201);
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

            Auth::login($user);

            return response()->json([
                'user' => $user,
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

        // Token logic removed. Rely on session invalidation.

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
            $created = false;

            if (!$user) {
                $user = User::create([
                    'name' => RedditAliasService::getNewAlias(),
                    'email' => $socialUser->getEmail(),
                    'password' => Hash::make(Str::random(24)),
                    'account_status' => 'active',
                ]);
                $created = true;
            }

            Auth::login($user);
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');

            // For newly-created social accounts, send verification email and
            // route them through the same verification flow as regular signup.
            if ($created && !$user->email_verified_at) {
                // #region agent log
                $this->agentLog('H4', 'social_registered_dispatching', [
                    'provider' => $provider,
                    'user_id' => $user->id,
                    'created' => $created,
                    'email_verified' => (bool) $user->email_verified_at,
                ]);
                // #endregion
                event(new Registered($user));
            }
            // #region agent log
            $this->agentLog('H4', 'social_user_state_after_login', [
                'provider' => $provider,
                'user_id' => $user->id,
                'created' => $created,
                'email_verified' => (bool) $user->email_verified_at,
            ]);
            // #endregion
            
            \Log::info('User redirecting to verification:', [
                'user_id' => $user->id,
                'email' => $user->email,
                'target_url' => $frontendUrl . "/verify-email"
            ]);

            if (!$user->email_verified_at) {
                // #region agent log
                $this->agentLog('H4', 'social_redirect_verify_email', [
                    'provider' => $provider,
                    'user_id' => $user->id,
                ]);
                // #endregion
                return redirect()->away($frontendUrl . "/verify-email");
            }

            return redirect()->away($frontendUrl . "/forum");
        } catch (\Exception $e) {
            // #region agent log
            $this->agentLog('H4', 'social_callback_exception', [
                'provider' => $provider,
                'exception_class' => get_class($e),
                'exception_message' => $e->getMessage(),
            ]);
            // #endregion
            \Log::error('Socialite Error', ['exception' => $e]);
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
            return redirect()->away($frontendUrl . "/auth?error=oauth_failed");
        }
    }

    /**
     * Resend email verification notification for the authenticated user.
     */
    // method moved to VerificationController
}