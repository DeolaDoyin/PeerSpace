<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class VerificationController extends Controller
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
                    'location' => 'VerificationController.php',
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

    /**
     * Resend email verification notification for the authenticated user.
     */
    public function resend(Request $request)
    {
        $user = $request->user();
        // #region agent log
        $this->agentLog('H1', 'resend_entered', [
            'has_user' => (bool) $user,
            'auth_id' => auth()->id(),
        ]);
        // #endregion
        if (!$user) {
            // #region agent log
            $this->agentLog('H1', 'resend_unauthenticated');
            // #endregion
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        try {
            // #region agent log
            $this->agentLog('H2', 'before_send_notification', [
                'user_id' => $user->id,
                'has_verified_email_method' => method_exists($user, 'sendEmailVerificationNotification'),
                'already_verified' => method_exists($user, 'hasVerifiedEmail') ? $user->hasVerifiedEmail() : null,
                'mail_mailer' => config('mail.default'),
                'mail_host' => config('mail.mailers.smtp.host'),
                'mail_port' => config('mail.mailers.smtp.port'),
                'mail_scheme' => config('mail.mailers.smtp.scheme'),
                'mail_encryption_env' => env('MAIL_ENCRYPTION'),
            ]);
            // #endregion
            if (method_exists($user, 'sendEmailVerificationNotification')) {
                $user->sendEmailVerificationNotification();
                // #region agent log
                $this->agentLog('H2', 'send_notification_success', [
                    'user_id' => $user->id,
                ]);
                // #endregion
                return response()->json(['message' => 'Verification email sent.']);
            }

            // #region agent log
            $this->agentLog('H2', 'send_notification_method_missing', [
                'user_id' => $user->id,
            ]);
            // #endregion
            return response()->json(['message' => 'Email verification not supported.'], 400);
        } catch (\Exception $e) {
            // #region agent log
            $this->agentLog('H3', 'send_notification_exception', [
                'user_id' => $user->id,
                'exception_class' => get_class($e),
                'exception_message' => $e->getMessage(),
            ]);
            // #endregion
            \Log::error('Failed to resend verification email', ['exception' => $e]);
            return response()->json(['message' => 'Failed to send verification email.'], 500);
        }
    }

    /**
     * Verify the user's email address.
     */
    public function verify(Request $request, $id, $hash)
    {
        $user = \App\Models\User::find($id);

        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        if (!hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
            return response()->json(['message' => 'Invalid verification link.'], 400);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified.']);
        }

        if ($user->markEmailAsVerified()) {
            event(new \Illuminate\Auth\Events\Verified($user));
            return response()->json(['message' => 'Email has been verified.']);
        }

        return response()->json(['message' => 'Failed to verify email.'], 500);
    }
}
