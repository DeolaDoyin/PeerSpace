<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireAccountAge
{
    /**
     * Minimum account age in hours to access protected resources.
     */
    protected int $minHours = 1;

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Admins and moderators bypass age restrictions
        if (in_array($user->role, ['admin', 'moderator'])) {
            return $next($request);
        }

        // Skip in testing environment
        if (app()->environment('testing')) {
            return $next($request);
        }

        $createdAt = $user->created_at;
        if ($createdAt && $createdAt->diffInHours(now()) < $this->minHours) {
            $remainingMinutes = $this->minHours * 60 - $createdAt->diffInMinutes(now());
            return response()->json([
                'message' => "Your account is too new. Please wait {$remainingMinutes} minutes before performing this action.",
                'retry_after_minutes' => $remainingMinutes,
            ], 403);
        }

        return $next($request);
    }
}
