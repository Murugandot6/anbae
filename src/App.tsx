import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { SessionContextProvider } from "./contexts/SessionContext";
import { ThemeProvider } from "./components/ThemeProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import { WaveRoomPlayerProvider } from "./contexts/WaveRoomPlayerContext";
import GlobalWaveRoomPlayer from "./components/GlobalWaveRoomPlayer";
import { HelmetProvider } from "react-helmet-async"; // Import HelmetProvider

// Lazy load all page components
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SendMessage = lazy(() => import("./pages/SendMessage"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const Messages = lazy(() => import("./pages/Messages"));
const ViewMessage = lazy(() => import("./pages/ViewMessage"));
const OnboardingWelcome = lazy(() => import("./pages/OnboardingWelcome"));
const Journal = lazy(() => import("./pages/Journal"));
const WatchParty = lazy(() => import("./pages/WatchParty"));
const CreatePromposal = lazy(() => import("./pages/CreatePromposal"));
const ViewPromposal = lazy(() => import("./pages/ViewPromposal"));
const WaveRoomPage = lazy(() => import("./features/waveroom/pages/WaveRoomPage"));
const WaveRoomTheaterPage = lazy(() => import("./features/waveroom/pages/WaveRoomTheaterPage"));
const UserManual = lazy(() => import("./pages/UserManual"));

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider> {/* Wrap the entire app with HelmetProvider */}
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme" attribute="class" enableSystem>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <SessionContextProvider>
              <WaveRoomPlayerProvider>
                {/* Removed Red Border Debugging */}
                <div className="flex flex-col h-screen">
                  <Suspense fallback={
                    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-background/80 text-foreground">
                      <p className="text-xl">Loading application...</p>
                    </div>
                  }>
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
                        <Route path="/manual" element={<UserManual />} />
                      </Route>

                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                  <GlobalWaveRoomPlayer />
                </div>
              </WaveRoomPlayerProvider>
            </SessionContextProvider>
          </TooltipProvider>
        </ThemeProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
};

export default App;