"use client";

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { useSession } from '@/components/SessionContextProvider';

const Room: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-gray-700 dark:text-gray-300">Loading...</p>
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
        <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
          Watch Party Room: {roomId === 'new' ? 'Creating New Room...' : roomId}
        </h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
          This is where the magic will happen! Video player and chat will go here.
        </p>
        <Button onClick={() => navigate('/lobby')} variant="outline">
          Back to Lobby
        </Button>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Room;