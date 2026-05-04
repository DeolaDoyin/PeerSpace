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
    <ErrorBoundary>
      <CreatePostProvider>
        <TooltipProvider>
          <Sonner position="bottom-center" richColors closeButton />
          <BrowserRouter>
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                {/* Landing page */}
                <Route path="/" element={<LandingPage />} />
                
                {/* Auth & Verification */}
                <Route path="/auth" element={<Auth />} />
                <Route path="/verify-email" element={<VerifyEmailNotice />} />

                {/* Forum & Posts */}
                <Route path="/forum" element={<Forum />} />
                <Route path="/posts/create" element={<CreatePost />} />
                <Route path="/posts/:slug" element={<PostDetail />} />

                {/* Messages & Social */}
                <Route path="/chats" element={<Chats />} />
                <Route path="/chat/:chatId" element={<ChatRoom />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/contact" element={<Contact />} />

                {/* Redirect any unknown route to landing */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </CreatePostProvider>
    </ErrorBoundary>
  </QueryClientProvider>
);

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<App />);