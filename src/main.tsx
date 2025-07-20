import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './globals.css';
import { ThemeProvider } from './components/theme-provider.tsx';
import { Toaster } from 'sonner';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { SessionContextProvider } from './contexts/SessionContext.tsx';
import { ConcertPlayerProvider } from './contexts/ConcertPlayerContext.tsx';
import { TooltipProvider } from '@/components/ui/tooltip.tsx'; // Import TooltipProvider

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider defaultTheme="goblin" storageKey="vite-ui-theme"> {/* Changed defaultTheme to 'goblin' */}
        <HelmetProvider>
          <SessionContextProvider>
            <ConcertPlayerProvider>
              <TooltipProvider> {/* Wrap the entire App with TooltipProvider */}
                <App />
              </TooltipProvider>
            </ConcertPlayerProvider>
          </SessionContextProvider>
        </HelmetProvider>
        <Toaster />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);