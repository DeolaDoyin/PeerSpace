<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\Post;
use App\Models\Comment;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Relations\Relation;

class ReportController extends Controller
{
    public function index()
    {
        // Only return pending reports with relations loaded
        $reports = Report::with(['user', 'reportable'])
            ->where('status', 'pending')
            ->latest()
            ->get();
            
        return response()->json($reports);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'reportable_id' => 'required|integer',
            'reportable_type' => 'required|string|in:post,comment',
            'reason' => 'required|string|max:255',
        ]);

        $typeClass = $validated['reportable_type'] === 'post' ? Post::class : Comment::class;

        // Ensure target exists
        if (!$typeClass::find($validated['reportable_id'])) {
            return response()->json(['error' => 'Target not found'], 404);
        }

        $report = Report::create([
            'user_id' => $request->user()->id,
            'reportable_id' => $validated['reportable_id'],
            'reportable_type' => $typeClass,
            'reason' => $validated['reason'],
            'status' => 'pending',
        ]);

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
