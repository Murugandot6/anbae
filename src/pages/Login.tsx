import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Heart, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';
import ForgotPasswordDialog from '@/components/ForgotPasswordDialog';
import { useState } from 'react';
import { ThemeToggle } from "@/components/ThemeToggle";
import VideoBackground from '@/components/VideoBackground'; // Import VideoBackground

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
        console.error('Login error:', error.message);
      } else {
        toast.success('Logged in successfully!');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Unexpected login error:', error);
      toast.error('An unexpected error occurred during login.');
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden"> {/* Outer container for video */}
      <VideoBackground /> {/* The animated background */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4"> {/* Content wrapper */}
        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md bg-white/80 dark:bg-gray-800/80 p-8 rounded-xl shadow-lg backdrop-blur-sm border border-white/30 dark:border-gray-600/30"> {/* Semi-transparent content card with glassmorphism */}
          <div className="text-center mb-6">
            <Heart className="w-12 h-12 text-pink-600 dark:text-purple-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome Back!</h2>
            <p className="text-muted-foreground">Sign in to continue your journey.</p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Mail className="w-4 h-4" /> Email</FormLabel>
                    <FormControl>
                      <Input placeholder="your.email@example.com" {...field} type="email" value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Lock className="w-4 h-4" /> Password</FormLabel>
                    <FormControl>
                      <Input placeholder="Your password" {...field} type="password" value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700 text-white dark:bg-purple-600 dark:hover:bg-purple-700">
                Sign In
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsForgotPasswordOpen(true)}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-500 transition-colors"
            >
              Forgot password?
            </button>
          </div>
          <div className="mt-6 text-center">
            <Link to="/register" className="text-sm text-pink-600 hover:text-pink-700 dark:text-purple-400 dark:hover:text-purple-500 transition-colors">
              Don't have an account? Register here
            </Link>
          </div>
          <div className="mt-4 text-center">
            <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
        <ForgotPasswordDialog isOpen={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen} />
      </div>
    </div>
  );
};

export default Login;