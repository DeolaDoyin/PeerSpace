<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // The 'before' check runs before any other policy
        Gate::before(function (User $user, string $ability) {
            if ($user->role === 'admin') {
                return true; // Admin can do EVERYTHING
            }
        });
    }
}
