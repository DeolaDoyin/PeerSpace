import type { AxiosError } from "axios";

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  account_status: string;
  email_verified_at?: string;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: number;
  name: string;
  slug?: string;
  description?: string;
}

export interface PostCreator {
  id: number;
  name: string;
}

export interface Post {
  id: number;
  slug: string;
  title: string;
  body: string;
  user_id: string;
  category_id?: number;
  created_at: string;
  updated_at?: string;
  comments_count: number;
  likes_count: number;
  is_liked?: boolean;
  is_saved?: boolean;
  is_hidden?: boolean;
  is_followed?: boolean;
  is_pinned: boolean;
  creator?: PostCreator;
  category?: Category;
}

export interface PaginatedResponse<T = Post> {
  data: T[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
  current_page?: number;
  last_page?: number;
}

export interface CommentRow {
  id: number;
  content: string;
  user_id: number;
  post_id?: number;
  parent_id?: number | null;
  user?: { id: number; name: string };
  created_at?: string;
  updated_at?: string;
  likes_count?: number;
  is_liked?: boolean;
}

export interface CommentNode extends CommentRow {
  replies: CommentNode[];
}

export interface CommentCreatedPayload {
  comment: {
    id: number;
    post_id: number;
    parent_id?: number | null;
    content: string;
    created_at?: string;
    user: { id: number; name: string };
  };
}

export interface PostCacheRow {
  comments_count?: number;
  is_followed?: boolean;
  is_saved?: boolean;
  is_hidden?: boolean;
  is_liked?: boolean;
  likes_count?: number;
  [key: string]: unknown;
}

export interface ChatListRow {
  id: number;
  type: string;
  peer: { id: number; name: string } | null;
  last_message: {
    id: number;
    body: string;
    encrypted_payload?: string; // 💡 Optional: to decrypt preview on chats index page
    iv?: string;                // 💡 Optional
    created_at?: string;
  } | null;
  updated_at: string;
}

// 💡 Updated to support End-to-End Encryption fields
export interface ChatMessageApi {
  id: number;
  chat_id: number;
  user_id: number;
  body: string; // Keeps compatibility with virtual fallback string
  
  // E2EE additions
  encrypted_payload?: string; 
  iv?: string;                 
  
  created_at: string;
  sender?: { id: number; name: string } | null;
}

// 💡 Streamlined to reference ChatMessageApi directly 
export interface MessageSentPayload {
  message: ChatMessageApi;
}

export interface DbNotification {
  id: string;
  type?: string;
  created_at: string;
  data: {
    type?: string;
    message?: string;
    post_slug?: string;
  };
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiValidationErrors {
  message: string;
  errors: Record<string, string[]>;
}

export interface ApiError {
  response?: {
    status: number;
    data: {
      message?: string;
      error?: string;
      errors?: Record<string, string[]>;
    };
  };
  message?: string;
}

export function isAxiosError(err: unknown): err is AxiosError<ApiValidationErrors | { message: string; error?: string; errors?: Record<string, string[]> }> {
  return typeof err === "object" && err !== null && "isAxiosError" in err;
}

export function getApiError(err: unknown): ApiError {
  if (isAxiosError(err)) {
    return {
      response: err.response
        ? {
            status: err.response.status,
            data: err.response.data,
          }
        : undefined,
      message: err.message,
    };
  }
  return { message: err instanceof Error ? err.message : String(err) };
}
