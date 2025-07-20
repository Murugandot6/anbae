import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';
import ForgotPasswordDialog from '@/components/ForgotPasswordDialog';
import { useState } from 'react';
import VideoBackground from '@/components/VideoBackground';
import { Helmet } from 'react-helmet-async'; // Import Helmet

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

const Login = () => {
  const navigate = useNavigate();
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { email, password } = values;
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Logged in successfully!');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error('An unexpected error occurred during login.');
    }
  };

  return (
    <>
      <Helmet>
        <title>Login - Anbae</title>
        <meta name="description" content="Log in to your Anbae account to access your personalized relationship insights and communication tools." />
      </Helmet>
      <VideoBackground />
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        <div className="absolute top-4 right-4 z-10">
          {/* Removed ThemeToggle */}
        </div>
        <div className="w-full max-w-[280px] sm:max-w-[320px] bg-white/30 dark:bg-gray-800/30 p-3 sm:p-4 rounded-xl shadow-lg backdrop-blur-sm border border-white/30 dark:border-gray-600/30">
          <div className="text-center mb-5">
            <img src="/favicon.ico" alt="App Favicon" className="w-9 h-9 sm:w-10 sm:h-10 mx-auto mb-2 sm:mb-3" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">Welcome Back!</h2>
            <p className="text-sm text-gray-700 dark:text-gray-300">Sign in to continue your journey.</p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4" /> Email</FormLabel>
                    <FormControl>
                      <Input placeholder="your.email@example.com" {...field} type="email" value={field.value || ''} className="text-sm placeholder:text-form-placeholder" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm"><Lock className="w-4 h-4" /> Password</FormLabel>
                    <FormControl>
                      <Input placeholder="Your password" {...field} type="password" value={field.value || ''} className="text-sm placeholder:text-form-placeholder" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700 text-white dark:bg-purple-600 dark:hover:bg-purple-700 text-sm py-2">
                Sign In
              </Button>
            </form>
          </Form>
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() => setIsForgotPasswordOpen(true)}
              className="text-xs text-pink-600 hover:text-pink-700 dark:text-purple-400 dark:hover:text-purple-500 transition-colors"
            >
              Forgot password?
            </button>
          </div>
          <div className="mt-4 text-center">
            <Link to="/register" className="text-xs text-pink-600 hover:text-pink-700 dark:text-purple-400 dark:hover:text-purple-500 transition-colors">
              Don't have an account? Register here
            </Link>
          </div>
          <div className="mt-2 text-center">
            <Link to="/" className="text-xs text-gray-800 hover:text-gray-900 dark:text-gray-200 dark:hover:text-gray-100 transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
        <ForgotPasswordDialog isOpen={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen} />
      </div>
    </>
  );
};

export default Login;