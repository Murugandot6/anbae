import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import SendMessage from "./pages/SendMessage";
import EditProfile from "./pages/EditProfile";
import Messages from "./pages/Messages";
import ViewMessage from "./pages/ViewMessage";
import OnboardingWelcome from "./pages/OnboardingWelcome";
import Journal from "./pages/Journal";
import WatchParty from "./pages/WatchParty";
import CreatePromposal from "./pages/CreatePromposal";
import ViewPromposal from "./pages/ViewPromposal";
import WaveRoomPage from "./features/waveroom/pages/WaveRoomPage";
import WaveRoomTheaterPage from "./features/waveroom/pages/WaveRoomTheaterPage";
import { SessionContextProvider } from "./contexts/SessionContext";
import { ThemeProvider } from "./components/ThemeProvider";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme" attribute="class" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <SessionContextProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/onboarding-welcome" element={<OnboardingWelcome />} />
                <Route path="/promposal/:id" element={<ViewPromposal />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/journal" element={<Journal />} />
                  <Route path="/send-message" element={<SendMessage />} />
                  <Route path="/edit-profile" element={<EditProfile />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/messages/:id" element={<ViewMessage />} />
                  <Route path="/watch-party" element={<WatchParty />} />
                  <Route path="/promposal/create" element={<CreatePromposal />} />
                  <Route path="/waveroom" element={<WaveRoomPage />} />
                  <Route path="/waveroom/:roomCode" element={<WaveRoomTheaterPage />} />
                </Route>

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </SessionContextProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;