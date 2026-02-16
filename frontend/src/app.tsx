import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import Chats from "./pages/Chats";
import ChatRoom from "./pages/ChatRoom";
import Forum from "./pages/Forum";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();
@@ -15,8 +19,11 @@ const App = () => (
<Sonner />
<BrowserRouter>
<Routes>
          <Route path="/" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="/" element={<Auth />} />
          <Route path="/chats" element={<Chats />} />
          <Route path="/chat/:chatId" element={<ChatRoom />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/profile" element={<Profile />} />
<Route path="*" element={<NotFound />} />
</Routes>
</BrowserRouter>