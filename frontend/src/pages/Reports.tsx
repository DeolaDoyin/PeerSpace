import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import api from "@/api/axios";
import { notify } from "@/lib/notify";
import { extractErrorMessage } from "@/lib/errors";
import AppNavbar from "@/components/AppNavbar";
import BottomNav from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  AlertCircle,
  Flag,
  MessageCircle,
  FileText,
  Trash2,
  CheckCircle,
  ShieldAlert,
  ExternalLink,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ReportContent {
  id: number;
  title?: string;
  slug?: string;
  body?: string;
  content?: string;
  post_id?: number;
  type: "post" | "comment";
}

interface ReportItem {
  id: number;
  status: string;
  created_at: string;
  reporter: { id: number; name: string } | null;
  content: ReportContent | null;
  reported_user: { id: number; name: string } | null;
}

interface ReportsPaginatedResponse {
  data: ReportItem[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

const Reports = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: reportsResponse,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const { data } = await api.get<ReportsPaginatedResponse>("/api/reports");
      return data;
    },
  });

  const reports = reportsResponse?.data ?? [];

  // Group reports by reported user
  const groupedByUser = reports.reduce(
    (acc, report) => {
      const userId = report.reported_user?.id ?? 0;
      const userName = report.reported_user?.name ?? "Unknown";
      if (!acc[userId]) {
        acc[userId] = { name: userName, reports: [] };
      }
      acc[userId].reports.push(report);
      return acc;
    },
    {} as Record<number, { name: string; reports: ReportItem[] }>,
  );

  const handleResolve = async (reportId: number) => {
    try {
      await api.patch(`/api/reports/${reportId}/resolve`);
      notify.success("Report resolved.");
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    } catch (e) {
      notify.error(extractErrorMessage(e) || "Failed to resolve report.");
    }
  };

  const handleDeleteContent = async (content: ReportContent) => {
    try {
      if (content.type === "post") {
        await api.delete(`/api/posts/${content.id}`);
        notify.success("Post deleted.");
      } else {
        await api.delete(`/api/comments/${content.id}`);
        notify.success("Comment deleted.");
      }
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    } catch (e) {
      notify.error(extractErrorMessage(e) || "Failed to delete content.");
    }
  };

  const handleSuspendUser = async (userId: number) => {
    try {
      await api.post("/api/users/suspend", {
        login: String(userId),
        status: "suspended",
      });
      notify.success("User suspended.");
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    } catch (e) {
      notify.error(extractErrorMessage(e) || "Failed to suspend user.");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppNavbar />

      <div className="max-w-3xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            <h1 className="text-xl font-bold text-foreground">Reports</h1>
          </div>
          <span className="text-sm text-muted-foreground">
            {reports.length} pending
          </span>
        </div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {isError && (
          <Card className="p-8 border-destructive bg-destructive/10 text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-destructive font-medium">Failed to load reports</p>
            <button onClick={() => refetch()} className="text-sm underline mt-2">
              Try again
            </button>
          </Card>
        )}

        {!isLoading && !isError && reports.length === 0 && (
          <Card className="p-8 text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-muted-foreground">No pending reports. All clear!</p>
          </Card>
        )}

        {!isLoading && !isError && Object.entries(groupedByUser).map(([userId, group]) => (
          <div key={userId} className="space-y-3">
            {/* User header - only show if user has multiple reports */}
            {group.reports.length > 1 && (
              <div className="flex items-center gap-2 px-1">
                <div className="h-6 w-6 rounded-full bg-destructive/20 flex items-center justify-center text-[10px] font-bold text-destructive">
                  {group.name[0]}
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {group.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({group.reports.length} reports)
                </span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="ml-auto h-7 text-xs">
                      Suspend User
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-xs sm:max-w-md">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Suspend {group.name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will prevent them from logging in or creating new content.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleSuspendUser(Number(userId))}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Suspend
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}

            {/* Report cards */}
            {group.reports.map((report) => (
              <Card key={report.id} className="p-4 border-border">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Content type badge */}
                    <div className="flex items-center gap-2 mb-2">
                      {report.content?.type === "post" ? (
                        <FileText className="h-4 w-4 text-blue-500" />
                      ) : (
                        <MessageCircle className="h-4 w-4 text-purple-500" />
                      )}
                      <span className="text-xs font-medium uppercase text-muted-foreground">
                        {report.content?.type ?? "Unknown"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(report.created_at))} ago
                      </span>
                    </div>

                    {/* Content preview */}
                    {report.content?.type === "post" && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          {report.content.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {report.content.body}
                        </p>
                      </div>
                    )}
                    {report.content?.type === "comment" && (
                      <p className="text-sm text-foreground">
                        "{report.content.content}"
                      </p>
                    )}

                    {/* Reporter info */}
                    <p className="text-xs text-muted-foreground mt-2">
                      Reported by {report.reporter?.name ?? "Anonymous"}
                    </p>

                    {/* Reported user (if single report) */}
                    {group.reports.length === 1 && report.reported_user && (
                      <p className="text-xs text-muted-foreground">
                        Content by{" "}
                        <Link
                          to={`/users/${report.reported_user.id}`}
                          className="underline hover:text-foreground"
                        >
                          {report.reported_user.name}
                        </Link>
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 shrink-0">
                    {/* View content */}
                    {report.content?.type === "post" && report.content.slug && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => navigate(`/posts/${report.content!.slug}`)}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    )}

                    {/* Delete content */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="h-7 text-xs">
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-xs sm:max-w-md">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this content?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the {report.content?.type} and resolve this report.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              if (report.content) handleDeleteContent(report.content);
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    {/* Resolve without action */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground"
                      onClick={() => handleResolve(report.id)}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Dismiss
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  );
};

export default Reports;
