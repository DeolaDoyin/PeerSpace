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
        $perPage = min(50, max(1, (int) $request->query('per_page', 50)));

        $reports = Report::with(['user', 'reportable'])
            ->where('status', 'pending')
            ->latest()
            ->paginate($perPage);

        // Enrich each report with reportable details
        $reports->getCollection()->transform(function (Report $report) {
            $reportable = $report->reportable;
            $content = null;
            $reportedUser = null;

            if ($reportable) {
                if ($report->reportable_type === Post::class) {
                    $content = [
                        'id' => $reportable->id,
                        'title' => $reportable->title,
                        'slug' => $reportable->slug,
                        'body' => $reportable->body,
                        'type' => 'post',
                    ];
                    $reportedUser = $reportable->creator ? [
                        'id' => $reportable->creator->id,
                        'name' => $reportable->creator->name,
                    ] : null;
                } elseif ($report->reportable_type === Comment::class) {
                    $content = [
                        'id' => $reportable->id,
                        'content' => $reportable->content,
                        'post_id' => $reportable->post_id,
                        'type' => 'comment',
                    ];
                    $reportedUser = $reportable->user ? [
                        'id' => $reportable->user->id,
                        'name' => $reportable->user->name,
                    ] : null;
                }
            }

            return [
                'id' => $report->id,
                'status' => $report->status,
                'created_at' => $report->created_at,
                'reporter' => $report->user ? [
                    'id' => $report->user->id,
                    'name' => $report->user->name,
                ] : null,
                'content' => $content,
                'reported_user' => $reportedUser,
            ];
        });

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
        $target = $typeClass::find($validated['reportable_id']);
        if (!$target) {
            return response()->json(['error' => 'Target not found'], 404);
        }

        // Prevent reporting own content
        if ($target->user_id === $request->user()->id) {
            return response()->json(['error' => 'You cannot report your own content.'], 422);
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
