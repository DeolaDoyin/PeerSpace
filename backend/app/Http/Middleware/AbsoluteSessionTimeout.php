<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AbsoluteSessionTimeout
{
    /**
     * Maximum session lifetime in minutes (regardless of activity).
     */
    protected int $maxLifetime = 480; // 8 hours

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && $request->hasSession()) {
            $session = $request->session();
            $createdAt = $session->get('created_at');

            if (!$createdAt) {
                // First request in this session - record creation time
                $session->put('created_at', now()->timestamp);
            } else {
                // Check if absolute lifetime has been exceeded
                $age = now()->timestamp - (int) $createdAt;
                if ($age > $this->maxLifetime * 60) {
                    $session->invalidate();
                    $session->regenerateToken();

                    if ($request->expectsJson()) {
                        return response()->json([
                            'message' => 'Your session has expired. Please log in again.',
                        ], 401);
                    }

                    return redirect('/auth');
                }
            }
        }

        return $next($request);
    }
}
