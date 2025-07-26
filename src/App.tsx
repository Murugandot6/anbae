import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserManual from "./pages/UserManual"; // Corrected import to UserManual
import Dashboard from "./pages/Dashboard";
import OnboardingWelcome from "./pages/OnboardingWelcome";
import SendMessage from "./pages/SendMessage";
import EditProfile from "./pages/EditProfile";
import Messages from "./pages/Messages";
import ViewMessage from "./pages/ViewMessage";
import CreatePromposal from "./pages/CreatePromposal";
import ViewPromposal from "./pages/ViewPromposal";
import Journal from "./pages/Journal";
import WatchParty from "./pages/WatchParty";
import ConcertPage from "./features/concert/pages/ConcertPage";
import ConcertTheaterPage from "./features/concert/pages/ConcertTheaterPage";
import Notifications from "./pages/Notifications"; // New import
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import GlobalConcertPlayer from "./components/GlobalConcertPlayer"; // Import GlobalConcertPlayer

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/manual" element={<UserManual />} /> {/* Updated to UserManual */}
        <Route path="/onboarding-welcome" element={<OnboardingWelcome />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/send-message" element={<SendMessage />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:id" element={<ViewMessage />} />
          <Route path="/promposal/create" element={<CreatePromposal />} />
          <Route path="/promposal/:id" element={<ViewPromposal />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/theater" element={<WatchParty />} />
          <Route path="/concert" element={<ConcertPage />} />
          <Route path="/concert/:roomCode" element={<ConcertTheaterPage />} />
          <Route path="/notifications" element={<Notifications />} /> {/* New route */}
        </Route>

        {/* Catch-all route for 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <GlobalConcertPlayer /> {/* Render GlobalConcertPlayer outside Routes */}
    </>
  );
}

export default App;