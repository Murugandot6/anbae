import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Mail, Users, Image as ImageIcon, Sun, Moon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSession } from '@/contexts/SessionContext';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ThemeToggle } from "@/components/ThemeToggle";
import AvatarSelectionDialog from '@/components/AvatarSelectionDialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { fetchProfileByEmail } from '@/lib/supabaseHelpers';
import { Profile } from '@/types/supabase';
import BackgroundWrapper from '@/components/BackgroundWrapper';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from 'next-themes';
import { Helmet } from 'react-helmet-async'; // Import Helmet

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
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<Profile | null>(null);
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-background/80 text-foreground">
        <p className="text-xl">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Edit Profile - Anbae</title>
        <meta name="description" content="Update your Anbae profile, including nickname, partner details, avatar, and theme preferences." />
      </Helmet>
      <BackgroundWrapper className="pt-0 md:pt-0">
        <div className="w-full max-w-md bg-card/60 dark:bg-card/60 p-8 rounded-xl shadow-lg backdrop-blur-md border border-border/50 mt-16 md:mt-8">
          <div className="text-center mb-6">
            <User className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-foreground mb-2">Edit Your Profile</h2>
            <p className="text-muted-foreground">Update your personal and partner details.</p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="nickname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><User className="w-4 h-4 text-primary" /> Nickname</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Nickname" {...field} value={field.value || ''} className="bg-input/50 border-border/50 text-foreground" />
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
                    <FormLabel className="flex items-center gap-2"><Mail className="w-4 h-4 text-primary" /> Partner's Email</FormLabel>
                    <FormControl>
                      <Input placeholder="partner@example.com" {...field} type="email" value={field.value || ''} className="bg-input/50 border-border/50 text-foreground" />
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
                    <FormLabel className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Partner's Nickname</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Partner's Nickname" {...field} value={field.value || ''} className="bg-input/50 border-border/50 text-foreground" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel className="flex items-center gap-2"><ImageIcon className="w-4 h-4 text-primary" /> Select Your Avatar</FormLabel>
                <div className="flex items-center gap-4 mb-4">
                  <Avatar
                    className="w-20 h-20 border-2 border-primary mx-auto rounded-full cursor-pointer shadow-md"
                    onClick={() => setIsAvatarDialogOpen(true)}
                  >
                    <AvatarImage src={selectedAvatar || ''} alt="Your Avatar" />
                    <AvatarFallback className="bg-primary text-primary-foreground">AV</AvatarFallback>
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

              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  {theme === 'dark' ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-primary" />} Theme
                </FormLabel>
                <Select onValueChange={(value) => setTheme(value)} value={theme}>
                  <FormControl>
                    <SelectTrigger className="bg-input/50 border-border/50 text-foreground">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-card border-border text-foreground">
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                Save Changes
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center">
            {/* Replaced Link with Button for consistent styling and positioning */}
            <div className="absolute top-4 left-4 z-10">
              <Link to="/dashboard">
                <Button variant="outline" size="icon" className="w-10 h-10 rounded-full text-foreground border-border hover:bg-accent hover:text-accent-foreground shadow-md">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </BackgroundWrapper>
    </>
  );
};

export default EditProfile;