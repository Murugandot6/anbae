"use client";

import React from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { Button } from '@/components/ui/button';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

const Lobby: React.FC = () => {
  const { user, isLoading } = useSession();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showError("Failed to log out: " + error.message);
    } else {
      // SessionContextProvider handles navigation on SIGNED_OUT event
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-gray-700 dark:text-gray-300">Loading user session...</p>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Welcome, {user.email}!</h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
          This is your lobby. Here you can create a new watch party room or join an existing one.
        </p>
        <div className="space-x-4">
          <Button onClick={() => navigate('/room/new')} className="bg-blue-600 hover:bg-blue-700 text-white">
            Create New Room
          </Button>
          <Button onClick={() => showSuccess("Join room functionality coming soon!")} variant="secondary">
            Join Room
          </Button>
        </div>
        <Button onClick={handleLogout} variant="destructive" className="mt-8">
          Logout
        </Button>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Lobby;