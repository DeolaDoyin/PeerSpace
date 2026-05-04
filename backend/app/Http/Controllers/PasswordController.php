<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Http\Requests\ChangePasswordRequest;

class PasswordController extends Controller
{
	public function update(ChangePasswordRequest $request)
	{
		$user = $request->user();

		// Verify current password
		if (!Hash::check($request->input('current_password'), $user->password)) {
			return response()->json([
				'message' => 'The provided credentials are invalid.'
			], 422);
		}

		// Update password
		$user->password = Hash::make($request->input('password'));
		$user->save();

		// Revoke other tokens (logout other sessions) but keep the current session's token
		try {
			if (method_exists($user, 'tokens')) {
				// If Sanctum's currentAccessToken is available, keep it and delete others
				if (method_exists($request->user(), 'currentAccessToken') && $request->user()->currentAccessToken()) {
					$current = $request->user()->currentAccessToken();
					$user->tokens()->where('id', '!=', $current->id)->delete();
				} else {
					// Fallback: delete all tokens (older Laravel or different token implementations)
					$user->tokens()->delete();
				}
			}
		} catch (\Exception $e) {
			// Non-fatal
		}

		return response()->json(['message' => 'Password updated']);
	}
}

