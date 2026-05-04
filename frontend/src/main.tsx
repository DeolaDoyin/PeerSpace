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

// Lazy-loaded pages to reduce initial bundle size
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
import LoadingScreen from "@/components/LoadingScreen";

import "@/styles/index.css";

const queryClient = new QueryClient({
  // cast to any to avoid strict types for onError here
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

// eslint-disable-next-line react-refresh/only-export-components
const App = () => (
  <QueryClientProvider client={queryClient}>
    <CreatePostProvider>
      <TooltipProvider>
        <Sonner position="bottom-center" richColors closeButton />
        <BrowserRouter>
          <Suspense fallback={<LoadingScreen />}>
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<LandingPage />} />

                <Route path="/auth" element={<Auth />} />

                {/* After auth, Forum is first page user sees */}
                <Route path="/forum" element={<Forum />} />
                <Route path="/posts/create" element={<CreatePost />} />
                <Route path="/posts/:slug" element={<PostDetail />} />
                <Route path="/verify-email" element={<VerifyEmailNotice />} />

                {/* Other routes */}
                <Route path="/chats" element={<Chats />} />
                <Route path="/chat/:chatId" element={<ChatRoom />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/contact" element={<Contact />} />

                {/* Redirect any unknown route to landing */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </ErrorBoundary>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </CreatePostProvider>
  </QueryClientProvider>
);

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<App />);
