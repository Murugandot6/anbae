import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { toast } from 'sonner'; // Using sonner for toasts

export default function TestLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    toast.dismiss(); // Dismiss any existing toasts
    
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: 'boysismoffl@gmail.com',
        password: 'Murugan@123'
      });

      if (authError) {
        throw authError;
      }
      toast.success('Login successful! Check console for user details');
      console.log('Test Login successful!');
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'Login failed');
      console.error('Full error details:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg mt-8">
      <h3 className="text-xl font-bold text-center mb-4 text-gray-900 dark:text-white">Quick Test Login</h3>
      <button 
        onClick={handleLogin}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50 transition-colors"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Logging in...
          </span>
        ) : 'Test Login with boysismoffl@gmail.com'}
      </button>
      {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
    </div>
  );
}