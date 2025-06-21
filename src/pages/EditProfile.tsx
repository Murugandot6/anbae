import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Mail, Users, Image as ImageIcon } from 'lucide-react'; // Added ImageIcon
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSession } from '@/contexts/SessionContext';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Import Avatar components
import { cn } from '@/lib/utils'; // Import cn for conditional classNames

// Define default avatar options
const AVATAR_OPTIONS = [
  '/avatars/avatar1.png',
  '/avatars/avatar2.png',
  '/avatars/avatar3.png',
  '/avatars/avatar4.png',
  '/avatars/avatar5.png',
  '/avatars/avatar6.png',
  '/avatars/avatar7.png',
  '/avatars/avatar8.png',
  '/avatars/avatar9.png',
  '/avatars/avatar10.png',
];

const formSchema = z.object({
  nickname: z.string().min(2, { message: 'Nickname must be at least 2 characters.' }).optional().or(z.literal('')),
  partner_email: z.string().email({ message: 'Please enter a valid partner email address.' }).optional().or(z.literal('')),
  partner_nickname: z.string().min(2, { message: 'Partner nickname must be at least 2 characters.' }).optional().or(z.literal('')),
  avatar_url: z.string().url({ message: 'Please select a valid avatar.' }).optional().or(z.literal('')), // Added avatar_url
}).refine((data) => {
  const sessionContext = (window as any).dyadSessionContext;
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
      partner_nickname: '',
      avatar_url: '', // Set default value for avatar_url
    },
  });

  useEffect(() => {
    (window as any).dyadSessionContext = { user, loading: sessionLoading };
  }, [user, sessionLoading]);

  useEffect(() => {
    if (!sessionLoading && user) {
      form.reset({
        nickname: user.user_metadata.nickname || '',
        partner_email: user.user_metadata.partner_email || '',
        partner_nickname: user.user_metadata.partner_nickname || '',
        avatar_url: user.user_metadata.avatar_url || '', // Populate from user_metadata
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
          partner_nickname: values.partner_nickname,
          avatar_url: values.avatar_url, // Update avatar_url in user_metadata
        },
      });

      if (authError) {
        throw authError;
      }

      // 2. Update public.profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          username: values.nickname,
          partner_email: values.partner_email,
          partner_nickname: values.partner_nickname,
          avatar_url: values.avatar_url, // Update avatar_url in profiles table
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
    return null;
  }

  const currentAvatarUrl = form.watch('avatar_url');

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
                  <FormLabel className="flex items-center gap-2"><Mail className="w-4 h-4" /> Partner's Email</FormLabel>
                  <FormControl>
                    <Input placeholder="partner@example.com" {...field} type="email" value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="partner_nickname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><Users className="w-4 h-4" /> Partner's Nickname</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Partner's Nickname" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="avatar_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Choose Avatar</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-5 gap-2">
                      {AVATAR_OPTIONS.map((url, index) => (
                        <Avatar
                          key={index}
                          className={cn(
                            "w-12 h-12 cursor-pointer border-2 transition-all duration-200",
                            currentAvatarUrl === url ? "border-blue-500 ring-2 ring-blue-500 scale-110" : "border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                          )}
                          onClick={() => field.onChange(url)}
                        >
                          <AvatarImage src={url} alt={`Avatar ${index + 1}`} />
                          <AvatarFallback>{url.slice(url.lastIndexOf('/') + 1, url.lastIndexOf('.'))}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
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