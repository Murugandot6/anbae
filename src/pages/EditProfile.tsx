import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Mail, Users, Image as ImageIcon, Sun, Moon, Trash2, Heart, Leaf } from 'lucide-react'; // Added Heart icon, imported Leaf
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
import { Helmet } from 'react-helmet-async'; // Corrected import
import LoadingPulsar from '@/components/LoadingPulsar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const formSchema = z.object({
  nickname: z.string().min(2, { message: 'Nickname must be at least 2 characters.' }).optional().or(z.literal('')),
  partner_email: z.string().email({ message: 'Please enter a valid partner email address.' }).optional().or(z.literal('')),
  partner_nickname: z.string().min(2, { message: 'Partner nickname must be at least 2 characters.' }).optional().or(z.literal('')),
  avatar_url: z.string().optional().or(z.literal('')),
  relationship_status: z.enum(['Single', 'In a Relationship', 'Married', 'One-sided'], {
    required_error: 'Please select your relationship status.',
  }).optional().or(z.literal('')), // Make optional for existing users who might not have it
}).refine((data) => {
  const sessionContext = (window as any).dyadSessionContext;
  const currentUserEmail = sessionContext?.user?.email;
  return data.partner_email === '' || data.partner_email !== currentUserEmail;
}, {
  message: "Your partner's email cannot be the same as your own email.",
  path: ["partner_email"],
}).refine((data) => {
  if (data.relationship_status === 'Single' || data.relationship_status === 'One-sided' || !data.relationship_status) {
    return true; // partner_email is optional for these statuses or if status is not set
  }
  // For 'In a Relationship' or 'Married', partner_email must be provided and valid
  return data.partner_email && z.string().email().safeParse(data.partner_email).success;
}, {
  message: "Partner's email is required for this relationship status.",
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false); // State for delete dialog

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nickname: '',
      partner_email: '',
      partner_nickname: '',
      avatar_url: '',
      relationship_status: '', // Initialize with empty string for select
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
          relationship_status: user.user_metadata.relationship_status || '',
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
          partner_email: values.partner_email || null, // Ensure null is sent if empty
          partner_nickname: values.partner_nickname || null, // Ensure null is sent if empty
          avatar_url: values.avatar_url || null, // Ensure null is sent if empty
          relationship_status: values.relationship_status || null, // Ensure null is sent if empty
        },
      });

      if (authError) {
        throw authError;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          username: values.nickname,
          partner_email: values.partner_email || null,
          partner_nickname: values.partner_nickname || null,
          avatar_url: values.avatar_url || null,
          relationship_status: values.relationship_status || null,
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

  const handleDeleteAccount = async () => {
    if (!user) {
      toast.error('User not authenticated.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-user-data', {
        body: JSON.stringify({ userId: user.id }),
      });

      if (error) {
        toast.error(error.message);
      } else if (data && data.success) {
        toast.success('Account and all associated data deleted successfully.');
        await supabase.auth.signOut(); // Ensure user is signed out
        navigate('/'); // Redirect to home page
      } else {
        toast.error(data?.message || 'Failed to delete account.');
      }
    } catch (error: any) {
      toast.error('An unexpected error occurred during account deletion.');
    } finally {
      setLoading(false);
      setIsDeleteDialogOpen(false); // Close dialog
    }
  };

  const selectedRelationshipStatus = form.watch('relationship_status');

  if (sessionLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-background/80 text-foreground">
        <LoadingPulsar />
        <p className="text-xl mt-4">Loading profile...</p>
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
        <div className="w-full max-w-sm sm:max-w-md bg-card/60 dark:bg-card/60 p-6 sm:p-8 rounded-xl shadow-lg backdrop-blur-md border border-border/50 mt-16 md:mt-8">
          <div className="text-center mb-6">
            <User className="w-10 h-10 sm:w-12 sm:h-12 text-primary mx-auto mb-3 sm:mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">Edit Your Profile</h2>
            <p className="text-sm sm:text-base text-muted-foreground">Update your personal and partner details.</p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6">
              <FormField
                control={form.control}
                name="nickname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm sm:text-base"><User className="w-4 h-4 text-primary" /> Nickname</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Nickname" {...field} value={field.value || ''} className="bg-input/50 border-border/50 text-foreground text-sm sm:text-base placeholder:text-form-placeholder" />
                    </FormControl>
                    <FormMessage className="text-xs sm:text-sm" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="relationship_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm sm:text-base"><Heart className="w-4 h-4" /> Relationship Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-input/50 border-border/50 text-foreground text-sm sm:text-base h-10">
                          <SelectValue placeholder="Select your status" className="data-[placeholder]:text-form-placeholder" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card border-border text-foreground text-sm sm:text-base">
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="In a Relationship">In a Relationship</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="One-sided">One-sided</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs sm:text-sm" />
                  </FormItem>
                )}
              />
              {!(selectedRelationshipStatus === 'Single' || selectedRelationshipStatus === 'One-sided' || !selectedRelationshipStatus) && (
                <FormField
                  control={form.control}
                  name="partner_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-sm sm:text-base"><Mail className="w-4 h-4" /> Partner's Email</FormLabel>
                      <FormControl>
                        <Input placeholder="partner@example.com" {...field} type="email" value={field.value || ''} className="bg-input/50 border-border/50 text-foreground text-sm sm:text-base placeholder:text-form-placeholder" />
                      </FormControl>
                      <FormMessage className="text-xs sm:text-sm" />
                    </FormItem>
                  )}
                />
              )}
              {!(selectedRelationshipStatus === 'Single' || selectedRelationshipStatus === 'One-sided' || !selectedRelationshipStatus) && (
                <FormField
                  control={form.control}
                  name="partner_nickname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-sm sm:text-base"><Users className="w-4 h-4" /> Partner's Nickname</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Partner's Nickname" {...field} value={field.value || ''} className="bg-input/50 border-border/50 text-foreground text-sm sm:text-base placeholder:text-form-placeholder" />
                      </FormControl>
                      <FormMessage className="text-xs sm:text-sm" />
                    </FormItem>
                  )}
                />
              )}
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-sm sm:text-base"><ImageIcon className="w-4 h-4 text-primary" /> Select Your Avatar</FormLabel>
                <div className="flex items-center gap-4 mb-4">
                  <Avatar
                    className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-primary mx-auto rounded-full cursor-pointer shadow-md"
                    onClick={() => setIsAvatarDialogOpen(true)}
                  >
                    <AvatarImage src={selectedAvatar || ''} alt="Your Avatar" />
                    <AvatarFallback className="bg-primary text-primary-foreground">AV</AvatarFallback>
                  </Avatar>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">Click your avatar to change it</p>
                </div>
                <AvatarSelectionDialog
                  isOpen={isAvatarDialogOpen}
                  onOpenChange={setIsAvatarDialogOpen}
                  selectedAvatar={selectedAvatar}
                  onSelect={handleAvatarSelect}
                />
                <FormMessage className="text-xs sm:text-sm">{form.formState.errors.avatar_url?.message}</FormMessage>
              </FormItem>

              <FormItem>
                <FormLabel className="flex items-center gap-2 text-sm sm:text-base">
                  {theme === 'dark' ? <Moon className="w-4 h-4 text-primary" /> : theme === 'light' ? <Sun className="w-4 h-4 text-primary" /> : <Leaf className="w-4 h-4 text-primary" />} Theme
                </FormLabel>
                <Select onValueChange={(value) => setTheme(value)} value={theme}>
                  <FormControl>
                    <SelectTrigger className="bg-input/50 border-border/50 text-foreground text-sm sm:text-base h-10">
                      <SelectValue placeholder="Select theme" className="data-[placeholder]:text-form-placeholder" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-card border-border text-foreground text-sm sm:text-base">
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="goblin">Goblin</SelectItem> {/* New theme option */}
                  </SelectContent>
                </Select>
              </FormItem>

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm sm:text-base py-2 sm:py-2.5">
                Save Changes
              </Button>
            </form>
          </Form>
          <div className="mt-5 sm:mt-6 text-center">
            {/* Replaced Link with Button for consistent styling and positioning */}
            <div className="absolute top-3 left-3 z-10">
              <Link to="/dashboard">
                <Button variant="outline" size="icon" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full text-foreground border-border hover:bg-accent hover:text-accent-foreground shadow-md">
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Delete Account Section */}
          <div className="mt-8 pt-6 border-t border-border/50">
            <h3 className="text-lg sm:text-xl font-bold text-destructive mb-4 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" /> Danger Zone
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm sm:text-base py-2 sm:py-2.5">
                  Delete My Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card/80 backdrop-blur-md border border-border/50 rounded-xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                    <Trash2 className="w-6 h-6" /> Are you absolutely sure?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground">
                    This action cannot be undone. This will permanently delete your account and remove all your data from our servers, including messages, journal entries, and any other associated content.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="text-foreground border-border hover:bg-accent/20 hover:text-accent-foreground">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                    Yes, Delete My Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </BackgroundWrapper>
    </>
  );
};

export default EditProfile;