// src/main.tsx
import ReactDOM from "react-dom/client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import Auth from "@/pages/Auth";
import Chats from "@/pages/Chats";
import ChatRoom from "@/pages/ChatRoom";
import Forum from "@/pages/Forum";
import Profile from "@/pages/Profile";
import LandingPage from "@/pages/LandingPage";

import "@/styles/index.css"; 

const queryClient = new QueryClient();

// eslint-disable-next-line react-refresh/only-export-components
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Landing page */}
          <Route path="/" element={<LandingPage />} />

          {/* Auth page */}
          <Route
            path="/auth"
            element={
              <Auth />
              // optionally, after successful login you can redirect inside Auth
              // or you can wrap it in a component that auto-redirects to /forum
            }
          />

          {/* After auth, Forum is first page user sees */}
          <Route path="/forum" element={<Forum />} />

          {/* Other routes */}
          <Route path="/chats" element={<Chats />} />
          <Route path="/chat/:chatId" element={<ChatRoom />} />
          <Route path="/profile" element={<Profile />} />

          {/* Redirect any unknown route to landing */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<App />);