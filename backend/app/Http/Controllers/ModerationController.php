<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class ModerationController extends Controller
{
    public function suspendUser(Request $request, User $user)
    {
        // Must be admin or moderator - managed by middleware in routes, but let's double check
        $currentUser = $request->user();
        if (!in_array($currentUser->role, ['admin', 'moderator'])) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        // Prevent suspending admins
        if ($user->role === 'admin') {
            return response()->json(['error' => 'Cannot suspend an administrator.'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:active,suspended'
        ]);

        $user->update(['account_status' => $validated['status']]);

        return response()->json([
            'message' => 'User account status updated successfully.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'account_status' => $user->account_status
            ]
        ]);
    }
}
