import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './globals.css'; // Corrected import path
import { ThemeProvider } from './components/theme-provider.tsx';
import { Toaster } from 'sonner';
import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter
import { HelmetProvider } from 'react-helmet-async'; // Import HelmetProvider

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <HelmetProvider> {/* Wrap App with HelmetProvider */}
          <App />
        </HelmetProvider>
        <Toaster />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);