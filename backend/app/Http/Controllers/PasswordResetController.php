<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class PasswordResetController extends Controller
{
    /**
     * Send a reset link to the given user.
     */
    public function sendResetLinkEmail(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        try {
            $status = Password::broker()->sendResetLink(
                $request->only('email')
            );

            if ($status == Password::RESET_LINK_SENT) {
                return response()->json(['message' => __($status)]);
            }

            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            report($e);
            throw ValidationException::withMessages([
                'email' => ['Unable to send reset email. Please try again later.'],
            ]);
        }
    }

    /**
     * Reset the user's password.
     */
    public function reset(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        try {
            $status = Password::broker()->reset(
                $request->only('email', 'password', 'password_confirmation', 'token'),
                function ($user, $password) {
                    $user->forceFill([
                        'password' => \Illuminate\Support\Facades\Hash::make($password),
                    ])->save();
                }
            );

            if ($status == Password::PASSWORD_RESET) {
                return response()->json(['message' => __($status)]);
            }

            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            report($e);
            throw ValidationException::withMessages([
                'email' => ['Unable to reset password. Please try again later.'],
            ]);
        }
    }
}
