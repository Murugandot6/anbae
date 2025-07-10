import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ManualPage from "./pages/ManualPage"; // Import ManualPage

function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/manual" element={<ManualPage />} /> {/* New route for manual page */}
    </Routes>
  );
}

export default App;