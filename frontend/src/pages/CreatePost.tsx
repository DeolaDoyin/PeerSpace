import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/api/axios";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/api/categories');
        setCategories(data);
        if (data.length > 0) {
          setCategoryId(data[0].id.toString());
        }
      } catch (err) {
        console.error("Failed to fetch categories");
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
      const { data } = await api.post('/api/posts', {
        title,
        body,
        category_id: parseInt(categoryId),
        is_pinned: false
      });
      // Navigate to the post detail or back to forum
      navigate(`/posts/${data.id}`);
    } catch (err: any) {
      if (err.response?.status === 422) {
        setError(Object.values(err.response.data.errors)[0] as string);
      } else {
        setError("Failed to create post. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 bg-card border-b border-border px-4 py-4 z-10 flex items-center gap-3">
        <button 
          onClick={() => navigate(-1)} 
          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-semibold text-foreground">Create Support Post</h1>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        {error && (
          <div className="mb-4 p-3 text-sm text-red-500 bg-red-100 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium text-foreground">
              Select Category
            </label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={fetchingCategories}
              className="w-full bg-card border border-border rounded-lg p-3 text-foreground appearance-none shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {fetchingCategories ? (
                <option>Loading categories...</option>
              ) : (
                categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))
              )}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-foreground">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your thoughts a clear title"
              className="w-full bg-card border border-border rounded-lg p-3 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              maxLength={255}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="body" className="text-sm font-medium text-foreground">
              Your Message
            </label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What's on your mind? Share safely and anonymously..."
              rows={8}
              className="w-full bg-card border border-border rounded-lg p-3 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          <Button 
            type="submit" 
            disabled={loading || fetchingCategories} 
            className="w-full h-12 rounded-xl text-base gap-2 mt-4"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Send size={18} /> Share Anonymously</>}
          </Button>
        </form>
      </main>
    </div>
  );
};

export default CreatePost;
