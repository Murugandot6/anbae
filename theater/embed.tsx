import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SupabaseProvider } from './contexts/SupabaseContext';

// The main function to initialize the app
const init = (containerSelector: string) => {
  const container = document.querySelector(containerSelector);
  if (!container) {
    console.error(`SyncStream Error: Container element with selector "${containerSelector}" not found.`);
    return;
  }

  // Add a class to the container for styling purposes if needed
  container.classList.add('syncstream-wrapper');

  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <SupabaseProvider>
        <App />
      </SupabaseProvider>
    </React.StrictMode>
  );
};

// Expose the init function to the global scope
export { init };