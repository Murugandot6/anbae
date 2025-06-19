import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const EditProfile = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-950 p-4 pt-20">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Edit Profile (Diagnostic)</h1>
      <p className="text-muted-foreground mb-6">This is a temporary page to test the build system.</p>
      <Link to="/dashboard">
        <Button variant="outline" className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Dashboard
        </Button>
      </Link>
    </div>
  );
};

export default EditProfile;