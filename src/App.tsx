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
import { SessionContextProvider } from "./contexts/SessionContext";
import { ThemeProvider } from "./components/ThemeProvider";
import React from "react"; // Import React for useState

const queryClient = new QueryClient();

const App = () => {
  // Log the base URL being used by Vite for debugging
  console.log("Vite BASE_URL:", import.meta.env.BASE_URL);

  // State to trigger a refresh of the messages list
  const [messagesRefreshKey, setMessagesRefreshKey] = React.useState(0);

  // Function to increment the refresh key, triggering a re-fetch in Messages.tsx
  const handleMessagesRefresh = () => {
    setMessagesRefreshKey(prev => prev + 1);
  };

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
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/send-message" element={<SendMessage />} />
                <Route path="/edit-profile" element={<EditProfile />} />
                {/* Pass messagesRefreshKey as a key prop to force re-mount and re-fetch */}
                <Route path="/messages" element={<Messages key={messagesRefreshKey} />} />
                <Route path="/messages/:id" element={<ViewMessage onMessageRead={handleMessagesRefresh} />} />
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