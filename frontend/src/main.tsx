// src/main.tsx
import { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CreatePostProvider } from "@/lib/createPostModal";
import { notify } from "@/lib/notify";
import ErrorBoundary from "@/components/ErrorBoundary";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import LoadingScreen from "@/components/LoadingScreen";

import "@/styles/index.css";

// Lazy-loaded pages
const Auth = lazy(() => import("@/pages/Auth"));
const Chats = lazy(() => import("@/pages/Chats"));
const ChatRoom = lazy(() => import("@/pages/ChatRoom"));
const Forum = lazy(() => import("@/pages/Forum"));
const Profile = lazy(() => import("@/pages/Profile"));
const Contact = lazy(() => import("@/pages/Contact"));
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const CreatePost = lazy(() => import("@/pages/CreatePost"));
const PostDetail = lazy(() => import("@/pages/PostDetail"));
const VerifyEmailNotice = lazy(() => import("@/pages/VerifyEmailNotice"));
const VerifyEmailConfirm = lazy(() => import("@/pages/VerifyEmailConfirm"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const SavedPosts = lazy(() => import("@/pages/SavedPosts"));
const UserProfile = lazy(() => import("@/pages/UserProfile"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      onError: (err: any) => {
        try {
          notify.error(err?.message || "Network error");
        } catch {}
      },
    },
  } as any,
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CreatePostProvider>
      <TooltipProvider>
        <Sonner position="bottom-center" richColors closeButton />
        <BrowserRouter>
          <ErrorBoundary>
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                {/* Landing */}
                <Route path="/" element={<LandingPage />} />

                {/* Auth */}
                <Route path="/auth" element={<Auth />} />
                <Route path="/verify-email" element={<VerifyEmailNotice />} />
                <Route path="/verify-email/confirm" element={<VerifyEmailConfirm />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Main app */}
                <Route path="/forum" element={<Forum />} />
                <Route path="/posts/create" element={<CreatePost />} />
                <Route path="/posts/:slug" element={<PostDetail />} />
                <Route path="/verify-email" element={<VerifyEmailNotice />} />

                {/* Chats */}
                <Route path="/chats" element={<Chats />} />
                <Route path="/chat/:chatId" element={<ChatRoom />} />

                {/* Other */}
                <Route path="/profile" element={<Profile />} />
                <Route path="/saved-posts" element={<SavedPosts />} />
                <Route path="/users/:userId" element={<UserProfile />} />
                <Route path="/contact" element={<Contact />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </CreatePostProvider>
  </QueryClientProvider>
);

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<App />);