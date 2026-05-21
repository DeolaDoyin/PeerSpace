<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SanitizeInput
{
    /**
     * Fields that should NOT be sanitized (e.g., passwords).
     */
    protected array $except = [
        'password',
        'password_confirmation',
        'current_password',
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $input = $request->all();

        array_walk_recursive($input, function (&$value, $key) {
            if (in_array($key, $this->except)) {
                return;
            }
            if (is_string($value)) {
                $value = $this->sanitize($value);
            }
        });

        $request->merge($input);

        return $next($request);
    }

    /**
     * Sanitize a string value by stripping dangerous HTML/scripts.
     */
    protected function sanitize(string $value): string
    {
        // Strip HTML tags except basic formatting
        $value = strip_tags($value, '<b><i><u><em><strong><br><p>');

        // Remove null bytes
        $value = str_replace("\0", '', $value);

        // Remove javascript: protocol
        $value = preg_replace('/javascript\s*:/i', '', $value);

        // Remove on* event handlers
        $value = preg_replace('/\bon\w+\s*=/i', '', $value);

        // Remove data: protocol (can be used for XSS)
        $value = preg_replace('/data\s*:/i', '', $value);

        // Trim whitespace
        $value = trim($value);

        return $value;
    }
}
