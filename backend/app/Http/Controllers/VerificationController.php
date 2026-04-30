<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class VerificationController extends Controller
{
    /**
     * Resend email verification notification for the authenticated user.
     */
    public function resend(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        try {
            if (method_exists($user, 'sendEmailVerificationNotification')) {
                $user->sendEmailVerificationNotification();
                return response()->json(['message' => 'Verification email sent.']);
            }

            return response()->json(['message' => 'Email verification not supported.'], 400);
        } catch (\Exception $e) {
            \Log::error('Failed to resend verification email', ['exception' => $e]);
            return response()->json(['message' => 'Failed to send verification email.'], 500);
        }
    }
}
