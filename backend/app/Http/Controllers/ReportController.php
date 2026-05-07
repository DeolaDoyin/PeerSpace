<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\Post;
use App\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Relations\Relation;
use App\Models\User;
use Illuminate\Support\Facades\Notification;
use App\Notifications\ContentReported;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $perPage = min(50, max(1, (int) $request->query('per_page', 20)));

        $reports = Report::with(['user', 'reportable'])
            ->where('status', 'pending')
            ->latest()
            ->paginate($perPage);

        return response()->json($reports);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'reportable_id' => 'required|integer',
            'reportable_type' => 'required|string|in:post,comment',
        ]);

        $typeClass = $validated['reportable_type'] === 'post' ? Post::class : Comment::class;

        // Ensure target exists
        if (!$typeClass::find($validated['reportable_id'])) {
            return response()->json(['error' => 'Target not found'], 404);
        }

        // Prevent duplicate reports from the same user
        $existing = Report::where('user_id', $request->user()->id)
            ->where('reportable_id', $validated['reportable_id'])
            ->where('reportable_type', $typeClass)
            ->where('status', 'pending')
            ->exists();

        if ($existing) {
            return response()->json(['error' => 'You have already reported this content.'], 422);
        }

        $report = Report::create([
            'user_id' => $request->user()->id,
            'reportable_id' => $validated['reportable_id'],
            'reportable_type' => $typeClass,
            'status' => 'pending',
        ]);

        $moderators = User::whereIn('role', ['admin', 'moderator'])->get();
        Notification::send($moderators, new ContentReported($validated['reportable_type'], $validated['reportable_id'], $request->user()));

        return response()->json([
            'message' => 'Report submitted successfully.',
            'report' => $report
        ], 201);
    }

    public function resolve(Request $request, Report $report)
    {
        $report->update(['status' => 'resolved']);

        return response()->json([
            'message' => 'Report resolved.',
            'report' => $report
        ]);
    }
}
