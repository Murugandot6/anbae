import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Heart, Mail, Lock, User, Users } from 'lucide-react';
import { toast } from 'sonner';
import { ThemeToggle } from "@/components/ThemeToggle"; // Import ThemeToggle

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters.' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter.' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter.' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number.' })
    .regex(/[^a-zA-Z0-9]/, { message: 'Password must contain at least one special character.' }),
  nickname: z.string().min(2, { message: 'Nickname must be at least 2 characters.' }),
  partner_email: z.string().email({ message: 'Please enter a valid partner email address.' }),
}).refine((data) => data.email !== data.partner_email, {
  message: "Your partner's email cannot be the same as your own email.",
  path: ["partner_email"],
});

const Register = () => {
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      nickname: '',
      partner_email: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { email, password, nickname, partner_email } = values;
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nickname,
            partner_email,
          },
        },
      });

      if (error) {
        toast.error(error.message);
        console.error('Registration error:', error.message);
      } else if (data.user) {
        toast.success('Registration successful! Please check your email to confirm your account.');
        navigate('/login');
      }
    } catch (error) {
      console.error('Unexpected registration error:', error);
      toast.error('An unexpected error occurred during registration.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-950 p-4 relative">
      <div className="absolute top-4 right-4 z-10"> {/* Position ThemeToggle */}
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <Heart className="w-12 h-12 text-pink-600 dark:text-purple-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Join Anbae</h2>
          <p className="text-muted-foreground">Create your personalized space.</p>
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
            <FormField
              control={form.control}
              name="nickname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><User className="w-4 h-4" /> Nickname</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Nickname" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="partner_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><Users className="w-4 h-4" /> Partner's Email</FormLabel>
                  <FormControl>
                    <Input placeholder="partner@example.com" {...field} type="email" value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700 text-white dark:bg-purple-600 dark:hover:bg-purple-700">
              <Heart className="w-4 h-4 mr-2" /> Create Account
            </Button>
          </form>
        </Form>
        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-pink-600 hover:text-pink-700 dark:text-purple-400 dark:hover:text-purple-500 transition-colors">
            Already have an account? Login here
          </Link>
        </div>
        <div className="mt-4 text-center">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;