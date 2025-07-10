import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './globals.css'; // Corrected import path
import { ThemeProvider } from './components/theme-provider.tsx';
import { Toaster } from 'sonner';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <App />
      <Toaster />
    </ThemeProvider>
  </React.StrictMode>,
);