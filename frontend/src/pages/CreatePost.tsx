import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/api/axios";
import { extractErrorMessage } from "@/lib/errors";
import { notify } from "@/lib/notify";
import { Loader2, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
// ...page-level controls removed; modal contains its own header
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Category {
  id: number;
  name: string;
}

const CreatePost = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCategories, setFetchingCategories] = useState(true);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get("/api/categories");
        setCategories(data);
        if (data.length > 0) {
          setCategoryId(data[0].id.toString());
        }
      } catch (err) {
        const e = err as any;
        const msg =
          extractErrorMessage(e) ||
          "Failed to load categories. Please refresh the page.";
        try {
          notify.error(msg);
        } catch {}
      } finally {
        setFetchingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || !categoryId) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data } = await api.post("/api/posts", {
        title,
        body,
        category_id: parseInt(categoryId),
        is_pinned: false,
      });
      // Navigate to the post detail or back to forum
      navigate(`/posts/${data.slug}`);
    } catch (err) {
      const e = err as any;
      // Validation errors: show field-level messages
      if (e?.response?.status === 422 && e.response.data?.errors) {
        setFieldErrors(e.response.data.errors || {});
        // also set a friendly summary message
        const first = Object.values(e.response.data.errors)[0];
        setError(Array.isArray(first) ? String(first[0]) : String(first));
        return;
      }

      // Non-validation error: show a general message and notify
      const msg = extractErrorMessage(e);
      setError(msg || "Failed to create post. Please try again.");
      try {
        notify.error(msg);
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <AlertDialog
        open={true}
        onOpenChange={(v) => {
          if (!v) navigate(-1);
        }}
      >
        {/* Trigger not needed when opening as a page; modal opens immediately */}
        <AlertDialogTrigger asChild>
          <div />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <div className="relative">
            <AlertDialogHeader>
              <AlertDialogTitle>Create Post</AlertDialogTitle>
              <AlertDialogDescription>
                Share something anonymously with the community. Your title and
                message will be posted to the selected space.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {/* Top-right X close button */}
            <button
              onClick={() => navigate(-1)}
              className="absolute right-3 top-3 text-muted-foreground p-1 rounded hover:bg-muted"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 max-w-2xl mx-auto p-1">
            {error && (
              <div className="mb-4 p-3 text-sm text-red-500 bg-red-100 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="category"
                  className="text-sm font-medium text-foreground"
                >
                  Select Category
                </label>
                <select
                  id="category"
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    setFieldErrors((prev) => {
                      const copy = { ...prev };
                      delete copy.category_id;
                      return copy;
                    });
                    setError("");
                  }}
                  disabled={fetchingCategories}
                  className="w-full bg-card border border-border rounded-lg p-3 text-foreground appearance-none shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {fetchingCategories ? (
                    <option>Loading categories...</option>
                  ) : (
                    categories.map((cat) => (
                      <option key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </option>
                    ))
                  )}
                </select>
                {fieldErrors.category_id && (
                  <div className="mt-1 space-y-1">
                    {fieldErrors.category_id.map((m, i) => (
                      <p key={i} className="text-xs text-red-500">
                        {m}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="title"
                  className="text-sm font-medium text-foreground"
                >
                  Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setFieldErrors((prev) => {
                      const copy = { ...prev };
                      delete copy.title;
                      return copy;
                    });
                    setError("");
                  }}
                  placeholder="Give your thoughts a clear title"
                  className="w-full bg-card border border-border rounded-lg p-3 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  maxLength={255}
                />
                {fieldErrors.title && (
                  <div className="mt-1 space-y-1">
                    {fieldErrors.title.map((m, i) => (
                      <p key={i} className="text-xs text-red-500">
                        {m}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="body"
                  className="text-sm font-medium text-foreground"
                >
                  Your Message
                </label>
                <textarea
                  id="body"
                  value={body}
                  onChange={(e) => {
                    setBody(e.target.value);
                    setFieldErrors((prev) => {
                      const copy = { ...prev };
                      delete copy.body;
                      return copy;
                    });
                    setError("");
                  }}
                  placeholder="What's on your mind?"
                  rows={8}
                  className="w-full bg-card border border-border rounded-lg p-3 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
                {fieldErrors.body && (
                  <div className="mt-1 space-y-1">
                    {fieldErrors.body.map((m, i) => (
                      <p key={i} className="text-xs text-red-500">
                        {m}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading || fetchingCategories}
                className="w-full h-12 rounded-xl text-base gap-2 mt-4"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Send size={18} /> Share Anonymously
                  </>
                )}
              </Button>
            </form>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CreatePost;
