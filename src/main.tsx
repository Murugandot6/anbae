import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './globals.css';
import { ThemeProvider } from './components/theme-provider.tsx';
import { Toaster } from 'sonner';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { SessionContextProvider } from './contexts/SessionContext.tsx'; // Import SessionContextProvider
import { ConcertPlayerProvider } from './contexts/ConcertPlayerContext.tsx'; // Import ConcertPlayerProvider

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <HelmetProvider>
          <SessionContextProvider> {/* Wrap App with SessionContextProvider */}
            <ConcertPlayerProvider> {/* Wrap App with ConcertPlayerProvider */}
              <App />
            </ConcertPlayerProvider>
          </SessionContextProvider>
        </HelmetProvider>
        <Toaster />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);