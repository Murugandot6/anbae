import React, { useState } from 'react';
import { FilmIcon } from './icons';
import { useSupabase } from '../contexts/SupabaseContext';

const Login: React.FC = () => {
  const supabase = useSupabase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      if (signInError.message === 'Invalid login credentials') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: email.split('@')[0],
            }
          }
        });
        
        if (signUpError) {
          setError(signUpError.message);
        }
      } else {
        setError(signInError.message);
      }
    }
    // On success, the onAuthStateChange listener in App.tsx will handle the session update.
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center p-4">
       <div className="flex items-center mb-8 text-white">
        <FilmIcon className="h-12 w-12 text-blue-500" />
        <h1 className="text-5xl font-bold ml-4 tracking-wider">SyncStream</h1>
      </div>
      <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl p-8">
        <h2 className="text-3xl font-bold text-center text-white mb-2">Join the Party</h2>
        <p className="text-center text-gray-400 mb-8">Sign in or create an account to start watching.</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="text-sm font-bold text-gray-300 block mb-2">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-bold text-gray-300 block mb-2">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              required
              disabled={loading}
            />
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed"
          >
            {loading ? 'Connecting...' : 'Sign In / Sign Up'}
          </button>
        </form>
      </div>
       <p className="text-gray-500 text-center mt-8">
        Enter any email and password. <br/> An account will be created if it doesn't exist.
       </p>
    </div>
  );
};

export default Login;