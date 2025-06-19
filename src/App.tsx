import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"; // Import useLocation
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import SendMessage from "./pages/SendMessage";
import EditProfile from "./pages/EditProfile";
import Messages from "./pages/Messages";
import ViewMessage from "./pages/ViewMessage";
import { SessionContextProvider } from "./contexts/SessionContext";
import { ThemeProvider } from "./components/ThemeProvider";
import BottomNavigationBar from "./components/BottomNavigationBar"; // Import BottomNavigationBar

const queryClient = new QueryClient();

const AppContent = () => { // Create a wrapper component to use useLocation
  const location = useLocation();
  const hideBottomNav = ['/', '/login', '/register', '/404'].includes(location.pathname);

  return (
    <>
      <div className={hideBottomNav ? "pt-0" : "pt-0 pb-16 md:pb-0"}> {/* Adjusted padding for bottom nav */}
        <SessionContextProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/send-message" element={<SendMessage />} />
            <Route path="/edit-profile" element={<EditProfile />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:id" element={<ViewMessage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SessionContextProvider>
      </div>
      <BottomNavigationBar />
    </>
  );
};

const App = () => {
  // Log the base URL being used by Vite for debugging
  console.log("Vite BASE_URL:", import.meta.env.BASE_URL);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme" attribute="class" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <AppContent /> {/* Render the wrapper component */}
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;