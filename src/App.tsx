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
import OnboardingWelcome from "./pages/OnboardingWelcome"; // Import the new OnboardingWelcome page
import { SessionContextProvider } from "./contexts/SessionContext";
import { ThemeProvider } from "./components/ThemeProvider";
import ProtectedRoute from "./components/ProtectedRoute"; // Import the new ProtectedRoute

const queryClient = new QueryClient();

const App = () => {
  // Log the base URL being used by Vite for debugging
  console.log("Vite BASE_URL:", import.meta.env.BASE_URL);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme" attribute="class" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter basename={import.meta.env.BASE_URL} future={{ v7_relativeSplatPath: true }}>
            <SessionContextProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/send-message" element={<SendMessage />} />
                  <Route path="/edit-profile" element={<EditProfile />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/messages/:id" element={<ViewMessage />} />
                  <Route path="/onboarding-welcome" element={<OnboardingWelcome />} /> {/* New protected route */}
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