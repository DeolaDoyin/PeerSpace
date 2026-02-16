<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsModerator
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = auth()->user();
        // Check if the role is 'moderator' OR 'admin'
        if ($user && ($user->role === 'moderator' || $user->role === 'admin')) {
            return $next($request); // The request is allowed to pass through
        }

        // If neither, they are stopped here
        return response()->json(['error' => 'You do not have staff permissions.'], 403);
        }
}
