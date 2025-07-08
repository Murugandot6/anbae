import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import LoadingPulsar from './LoadingPulsar';

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useSession();

  if (loading) {
    // Optionally, render a loading spinner or skeleton here
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-950 text-foreground">
        <LoadingPulsar />
        <p className="text-xl mt-4">Loading authentication...</p>
      </div>
    );
  }

  if (!user) {
    // User is not authenticated, redirect to login page
    return <Navigate to="/login" replace />;
  }

  // User is authenticated, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;