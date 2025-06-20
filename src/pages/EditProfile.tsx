import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Mail, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSession } from '@/contexts/SessionContext';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ThemeToggle } from "@/components/ThemeToggle";

const formSchema = z.object({
  nickname: z.string().min(2, { message: 'Nickname must be at least 2 characters.' }).optional().or(z.literal('')),
  partner_email: z.string().email({ message: 'Please enter a valid partner email address.' }).optional().or(z.literal('')),
}).refine((data) => {
  // Get current user's email from session context
  const sessionContext = (window as any).dyadSessionContext; // Accessing global context for validation
  const currentUserEmail = sessionContext?.user?.email;
  return data.partner_email === '' || data.partner_email !== currentUserEmail;
}, {
  message: "Your partner's email cannot be the same as your own email.",
  path: ["partner_email"],
});

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, loading: sessionLoading } = useSession();
  const [loading, setLoading] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nickname: '',
      partner_email: '',
    },
  });

  // Expose user and session to a global object for Zod refinement to access
  useEffect(() => {
    (window as any).dyadSessionContext = { user, loading: sessionLoading };
  }, [user, sessionLoading]);

  useEffect(() => {
    if (!sessionLoading && user) {
      form.reset({
        nickname: user.user_metadata.nickname || '',
        partner_email: user.user_metadata.partner_email || '',
      });
      setLoading(false);
    } else if (!sessionLoading && !user) {
      navigate('/login');
    }
  }, [user, sessionLoading, navigate, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast.error('User not authenticated.');
      return;
    }

    setLoading(true);
    try {
      // 1. Update user_metadata in auth.users
      const { data: authUpdateData, error: authError } = await supabase.auth.updateUser({
        data: {
          nickname: values.nickname,
          partner_email: values.partner_email,
        },
      });

      if (authError) {
        throw authError;
      }

      // 2. Update public.profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          username: values.nickname, // Map nickname to username in profiles table
          partner_email: values.partner_email,
        })
        .eq('id', user.id);

      if (profileError) {
        throw profileError;
      }

      toast.success('Profile updated successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Profile update error:', error.message, error);
      toast.error('Failed to update profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-950 text-foreground">
        <p className="text-xl">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Should be redirected by useEffect
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-950 p-4 relative">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <User className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Edit Your Profile</h2>
          <p className="text-muted-foreground">Update your personal and partner details.</p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700">
              Save Changes
            </Button>
          </form>
        </Form>
        <div className="mt-6 text-center">
          <Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
            <ArrowLeft className="inline-block w-4 h-4 mr-1" /> Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;