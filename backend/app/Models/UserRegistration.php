<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserRegistration extends Model
{
    protected $fillable = [
        'user_id',
        'ip_address',
        'user_agent',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if an IP address has too many recent registrations.
     */
    public static function hasTooManyFromIp(string $ip, int $maxAccounts = 3, int $hours = 24): bool
    {
        return static::where('ip_address', $ip)
            ->where('created_at', '>=', now()->subHours($hours))
            ->count() >= $maxAccounts;
    }

    /**
     * Get the number of accounts registered from an IP in the last N hours.
     */
    public static function countFromIp(string $ip, int $hours = 24): int
    {
        return static::where('ip_address', $ip)
            ->where('created_at', '>=', now()->subHours($hours))
            ->count();
    }
}
