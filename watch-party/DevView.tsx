import React from 'react';
import App from './App';
import { createSupabaseClient } from './lib/supabaseClient';
import { SupabaseProvider } from './contexts/SupabaseContext';

// Create two separate clients, one for each user view.
// They use different storage keys to keep their sessions isolated.
const user1Client = createSupabaseClient('user1_session');
const user2Client = createSupabaseClient('user2_session');


const DevView: React.FC = () => {
  return (
    <div className="flex flex-col lg:flex-row w-screen h-screen bg-gray-900 p-2 gap-2">
      <div className="flex-1 border-2 border-blue-500 rounded-lg overflow-auto relative">
        <div className="absolute top-2 left-4 bg-blue-500 text-white px-3 py-1 text-sm font-bold rounded z-50">User 1</div>
        <div className="h-full w-full">
          <SupabaseProvider client={user1Client}>
            <App key="user1" />
          </SupabaseProvider>
        </div>
      </div>
      <div className="flex-1 border-2 border-green-500 rounded-lg overflow-auto relative">
        <div className="absolute top-2 left-4 bg-green-500 text-white px-3 py-1 text-sm font-bold rounded z-50">User 2</div>
        <div className="h-full w-full">
          <SupabaseProvider client={user2Client}>
            <App key="user2" />
          </SupabaseProvider>
        </div>
      </div>
    </div>
  );
};

export default DevView;