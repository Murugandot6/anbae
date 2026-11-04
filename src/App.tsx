import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { MusicProvider } from "@/context/MusicContext";
import { AuthProvider } from "@/context/AuthContext";
import Index from "./pages/Index";
import MusicPage from "./pages/Music";
import Search from "./pages/Search";
import Radio from "./pages/Radio";
import Library from "./pages/Library";
import Songs from "./pages/Songs";
import Artists from "./pages/Artists";
import Favourites from "./pages/Favourites";
import Journal from "./pages/Journal";
import AlbumDetails from "./pages/AlbumDetails";
import PlaylistDetails from "./pages/PlaylistDetails";
import Featured from "./pages/Featured";
import Movies from "./pages/Movies";
import Lyrics from "./pages/Lyrics";
import TV from "./pages/TV";
import Watch from "./pages/Watch";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <MusicProvider>
          <Toaster />
          <Sonner />
          <HashRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/music" element={<MusicPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/search" element={<Search />} />
              <Route path="/radio" element={<Radio />} />
              <Route path="/library" element={<Library />} />
              <Route path="/songs" element={<Songs />} />
              <Route path="/artists" element={<Artists />} />
              <Route path="/favourites" element={<Favourites />} />
              <Route path="/journal" element={<Journal />} />
              <Route path="/featured" element={<Featured />} />
              <Route path="/movies" element={<Movies />} />
              <Route path="/lyrics" element={<Lyrics />} />
              <Route path="/tv" element={<TV />} />
              <Route path="/watch" element={<Watch />} />
              <Route path="/album/:id" element={<AlbumDetails />} />
              <Route path="/playlist/:id" element={<PlaylistDetails />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </HashRouter>
        </MusicProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;