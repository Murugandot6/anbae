import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Mail, Users, Image as ImageIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSession } from '@/contexts/SessionContext';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ThemeToggle } from "@/components/ThemeToggle";
import AvatarSelectionDialog from '@/components/AvatarSelectionDialog'; // Import the new dialog component
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { fetchProfileByEmail } from '@/lib/supabaseHelpers';
import { Profile } from '@/types/supabase';
import BackgroundWrapper from '@/components/BackgroundWrapper';

const formSchema = z.object({
  nickname: z.string().min(2, { message: 'Nickname must be at least 2 characters.' }).optional().or(z.literal('')),
  partner_email: z.string().email({ message: 'Please enter a valid partner email address.' }).optional().or(z.literal('')),
  partner_nickname: z.string().min(2, { message: 'Partner nickname must be at least 2 characters.' }).optional().or(z.literal('')),
  avatar_url: z.string().optional().or(z.literal('')),
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
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<Profile | null>(null);
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false); // State for dialog open/close

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nickname: '',
      partner_email: '',
      partner_nickname: '',
      avatar_url: '',
    },
  });

  useEffect(() => {
    (window as any).dyadSessionContext = { user, loading: sessionLoading };
  }, [user, sessionLoading]);

  useEffect(() => {
    const loadProfileData = async () => {
      if (!sessionLoading && user) {
        const currentAvatar = user.user_metadata.avatar_url || '';
        setSelectedAvatar(currentAvatar);
        form.reset({
          nickname: user.user_metadata.nickname || '',
          partner_email: user.user_metadata.partner_email || '',
          partner_nickname: user.user_metadata.partner_nickname || '',
          avatar_url: currentAvatar,
        });

        const currentUsersPartnerEmail = user.user_metadata.partner_email;
        if (currentUsersPartnerEmail) {
          try {
            const partnerData = await fetchProfileByEmail(currentUsersPartnerEmail);
            if (partnerData) {
              setPartnerProfile(partnerData);
            } else {
              setPartnerProfile(null);
            }
          } catch (error) {
            setPartnerProfile(null);
          }
        } else {
          setPartnerProfile(null);
        }
        setLoading(false);
      } else if (!sessionLoading && !user) {
        navigate('/login');
      }
    };
    loadProfileData();
  }, [user, sessionLoading, navigate, form]);

  const handleAvatarSelect = (url: string) => {
    setSelectedAvatar(url);
    form.setValue('avatar_url', url, { shouldValidate: true });
    // Dialog closing is handled within AvatarSelectionDialog's onSelect prop
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast.error('User not authenticated.');
      return;
    }

    setLoading(true);

    try {
      const { data: authUpdateData, error: authError } = await supabase.auth.updateUser({
        data: {
          nickname: values.nickname,
          partner_email: values.partner_email,
          partner_nickname: values.partner_nickname,
          avatar_url: values.avatar_url,
        },
      });

      if (authError) {
        throw authError;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          username: values.nickname,
          partner_email: values.partner_email,
          partner_nickname: values.partner_nickname,
          avatar_url: values.avatar_url,
        })
        .eq('id', user.id);

      if (profileError) {
        throw profileError;
      }

      toast.success('Profile updated successfully!');
      navigate('/dashboard');
    } catch (error: any) {
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

  return (
    <BackgroundWrapper>
      <div className="w-full max-w-md bg-white/30 dark:bg-gray-800/30 p-8 rounded-xl shadow-lg backdrop-blur-sm border border-white/30 dark:border-gray-600/30">
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
            {/* Avatar Selection Field - now with a dialog trigger */}
            <FormItem>
              <FormLabel className="flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Select Your Avatar</FormLabel>
              <div className="flex items-center gap-4 mb-4">
                <Avatar
                  className="w-20 h-20 border-2 border-blue-500 dark:border-purple-400 mx-auto rounded-full cursor-pointer"
                  onClick={() => setIsAvatarDialogOpen(true)} // Open dialog on click
                >
                  <AvatarImage src={selectedAvatar || ''} alt="Your Avatar" />
                  <AvatarFallback>AV</AvatarFallback>
                </Avatar>
                <p className="text-sm text-muted-foreground mt-1">Click your avatar to change it</p>
              </div>
              <AvatarSelectionDialog
                isOpen={isAvatarDialogOpen}
                onOpenChange={setIsAvatarDialogOpen}
                selectedAvatar={selectedAvatar}
                onSelect={handleAvatarSelect}
              />
              <FormMessage>{form.formState.errors.avatar_url?.message}</FormMessage>
            </FormItem>

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
    </BackgroundWrapper>
  );
};

export default EditProfile;