import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/api/axios";
import { extractErrorMessage } from "@/lib/errors";
import { notify } from "@/lib/notify";
import type { Category } from "@/types";
import { Loader2, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const EditPost = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [postId, setPostId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postRes, catRes] = await Promise.all([
          api.get(`/api/posts/${slug}`),
          api.get("/api/categories"),
        ]);
        const post = postRes.data;
        setPostId(post.id);
        setTitle(post.title || "");
        setBody(post.body || "");
        setCategoryId(post.category_id?.toString() || "");
        setCategories(catRes.data);
      } catch (err: any) {
        if (err?.response?.status === 404) {
          notify.error("Post not found.");
        } else {
          notify.error("Failed to load post data.");
        }
        navigate("/forum");
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [slug, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || !categoryId) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data } = await api.put(`/api/posts/${postId}`, {
        body,
        category_id: parseInt(categoryId),
      });
      notify.success("Post updated!");
      navigate(`/posts/${data.slug}`);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        notify.error("Post not found. It may have been deleted.");
        navigate("/forum");
        return;
      }
      if (err?.response?.status === 403) {
        notify.error("You don't have permission to edit this post.");
        return;
      }
      if (err && typeof err === "object" && "response" in err) {
        const e = err as { response?: { status?: number; data?: { errors?: Record<string, string[]> } } };
        if (e?.response?.status === 422 && e.response.data?.errors) {
          setFieldErrors(e.response.data.errors || {});
          const first = Object.values(e.response.data.errors)[0];
          setError(Array.isArray(first) ? String(first[0]) : String(first));
          return;
        }
      }
      const msg = extractErrorMessage(err);
      setError(msg || "Failed to update post. Please try again.");
      notify.error(msg);
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
        <AlertDialogTrigger asChild>
          <div />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <div className="relative">
            <AlertDialogHeader>
              <AlertDialogTitle>Edit Post</AlertDialogTitle>
              <AlertDialogDescription>
                Update your post. Changes will be visible immediately.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <button
              onClick={() => navigate(-1)}
              className="absolute right-3 top-3 text-muted-foreground p-1 rounded hover:bg-muted"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 max-w-2xl mx-auto p-1">
            {fetching ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-4 p-3 text-sm text-red-500 bg-red-100 rounded-lg">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="category" className="text-sm font-medium text-foreground">
                      Category
                    </label>
                    <select
                      id="category"
                      value={categoryId}
                      onChange={(e) => {
                        setCategoryId(e.target.value);
                        setFieldErrors((prev) => { const c = { ...prev }; delete c.category_id; return c; });
                        setError("");
                      }}
                      className="w-full bg-card border border-border rounded-lg p-3 text-foreground appearance-none shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.category_id?.map((m, i) => (
                      <p key={i} className="text-xs text-red-500">{m}</p>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="title" className="text-sm font-medium text-foreground">
                      Title
                    </label>
                    <input
                      id="title"
                      type="text"
                      value={title}
                      disabled
                      className="w-full bg-muted border border-border rounded-lg p-3 text-muted-foreground shadow-sm cursor-not-allowed"
                      maxLength={255}
                    />
                    <p className="text-xs text-muted-foreground">Title cannot be changed after posting.</p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="body" className="text-sm font-medium text-foreground">
                      Message
                    </label>
                    <textarea
                      id="body"
                      value={body}
                      onChange={(e) => {
                        setBody(e.target.value);
                        setFieldErrors((prev) => { const c = { ...prev }; delete c.body; return c; });
                        setError("");
                      }}
                      rows={8}
                      className="w-full bg-card border border-border rounded-lg p-3 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    />
                    {fieldErrors.body?.map((m, i) => (
                      <p key={i} className="text-xs text-red-500">{m}</p>
                    ))}
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl text-base gap-2 mt-4"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Send size={18} /> Save Changes
                      </>
                    )}
                  </Button>
                </form>
              </>
            )}
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EditPost;
