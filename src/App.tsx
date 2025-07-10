import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { SessionContextProvider } from "./contexts/SessionContext";
import { ThemeProvider } from "./components/ThemeProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import { ConcertPlayerProvider } from "./contexts/ConcertPlayerContext";
import GlobalConcertPlayer from "./components/GlobalConcertPlayer";
import { HelmetProvider } from "react-helmet-async"; // Import HelmetProvider
import LoadingPulsar from "./components/LoadingPulsar";

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
const Theater = lazy(() => import("./pages/WatchParty")); // Renamed from WatchParty
const CreatePromposal = lazy(() => import("./pages/CreatePromposal"));
const ViewPromposal = lazy(() => import("./pages/ViewPromposal"));
const ConcertPage = lazy(() => import("./features/concert/pages/ConcertPage")); // Renamed from WaveRoomPage
const ConcertTheaterPage = lazy(() => import("./features/concert/pages/ConcertTheaterPage")); // Renamed from WaveRoomTheaterPage
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
              <ConcertPlayerProvider>
                <div className="flex flex-col h-screen"> {/* Added h-screen here */}
                  <Suspense fallback={
                    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-background/80 text-foreground">
                      <LoadingPulsar />
                      <p className="text-xl mt-4">Loading application...</p>
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
                        <Route path="/theater" element={<Theater />} /> {/* Renamed route */}
                        <Route path="/promposal/create" element={<CreatePromposal />} />
                        <Route path="/concert" element={<ConcertPage />} /> {/* Renamed route */}
                        <Route path="/concert/:roomCode" element={<ConcertTheaterPage />} /> {/* Renamed route */}
                        <Route path="/manual" element={<UserManual />} />
                      </Route>

                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                  <GlobalConcertPlayer />
                </div>
              </ConcertPlayerProvider>
            </SessionContextProvider>
          </TooltipProvider>
        </ThemeProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
};

export default App;