import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Heart, User, Users, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/contexts/SessionContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const profileFormSchema = z.object({
  username: z.string().min(2, { message: 'Nickname must be at least 2 characters.' }).optional().or(z.literal('')),
  partner_email: z.string().email({ message: 'Please enter a valid partner email address.' }).optional().or(z.literal('')),
  partner_nickname: z.string().optional().or(z.literal('')),
});

const passwordFormSchema = z.object({
  newPassword: z.string()
    .min(8, { message: 'Password must be at least 8 characters.' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter.' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter.' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number.' })
    .regex(/[^a-zA-Z0-9]/, { message: 'Password must contain at least one special character.' }),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords do not match.",
  path: ["confirmNewPassword"],
});

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, loading: sessionLoading } = useSession();
  const [profileExists, setProfileExists] = useState(false);

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: '',
      partner_email: '',
      partner_nickname: '',
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  // Custom validation for partner_email
  useEffect(() => {
    if (user?.email) {
      const partnerEmailValue = profileForm.watch('partner_email');
      if (partnerEmailValue && user.email === partnerEmailValue) {
        profileForm.setError('partner_email', {
          type: 'manual',
          message: "Your partner's email cannot be the same as your own email.",
        }, { shouldFocus: true });
      } else {
        profileForm.clearErrors('partner_email');
      }
    }
  }, [user?.email, profileForm.watch('partner_email'), profileForm]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (sessionLoading || !user) {
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username, partner_email, partner_nickname')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Supabase Error fetching profile:', error.message, error);
          toast.error('Failed to load profile data: ' + error.message);
          setProfileExists(false);
        } else if (data) {
          profileForm.reset({
            username: data.username || '',
            partner_email: data.partner_email || '',
            partner_nickname: data.partner_nickname || '',
          });
          setProfileExists(true);
        } else {
          setProfileExists(false);
        }
      } catch (error: any) {
        console.error('Unexpected error fetching profile:', error.message, error);
        toast.error('An unexpected error occurred while loading profile.');
      }
    };

    fetchProfile();
  }, [user, sessionLoading, profileForm]);

  const onProfileSubmit = async (values: z.infer<typeof profileFormSchema>) => {
    if (!user) {
      toast.error('You must be logged in to edit your profile.');
      return;
    }

    if (user.email && values.partner_email && user.email === values.partner_email) {
      profileForm.setError('partner_email', {
        type: 'manual',
        message: "Your partner's email cannot be the same as your own email.",
      });
      return;
    }

    try {
      let dbError = null;

      const updateData = {
        username: values.username || null,
        partner_email: values.partner_email || null,
        partner_nickname: values.partner_nickname || null,
      };

      if (profileExists) {
        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', user.id);
        dbError = error;
      } else {
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            ...updateData,
          });
        dbError = error;
      }

      if (dbError) {
        toast.error(dbError.message);
        console.error('Supabase Profile DB operation error:', dbError.message, dbError);
      } else {
        const { error: updateAuthError } = await supabase.auth.updateUser({
          data: {
            nickname: values.username || null,
            partner_email: values.partner_email || null,
            partner_nickname: values.partner_nickname || null,
          },
        });

        if (updateAuthError) {
          console.error('Supabase Auth user metadata update error:', updateAuthError.message, updateAuthError);
          toast.error('Profile updated, but failed to update session data. Please re-login.');
        } else {
          toast.success('Profile updated successfully!');
          navigate('/dashboard');
        }
      }
    } catch (error: any) {
      console.error('Unexpected profile update error:', error.message, error);
      toast.error('An unexpected error occurred during profile update.');
    }
  };

  const onPasswordSubmit = async (values: z.infer<typeof passwordFormSchema>) => {
    if (!user) {
      toast.error('You must be logged in to change your password.');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: values.newPassword,
      });

      if (error) {
        toast.error(error.message);
        console.error('Supabase Password change error:', error.message, error);
      } else {
        toast.success('Password updated successfully!');
        passwordForm.reset(); // Clear the password form
        // Optionally, force re-login for security
        // await supabase.auth.signOut();
        // navigate('/login');
      }
    } catch (error: any) {
      console.error('Unexpected password change error:', error.message, error);
      toast.error('An unexpected error occurred during password change.');
    }
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-950 text-foreground">
        <p className="text-xl">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-950 p-4 pt-20">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <Heart className="w-12 h-12 text-pink-600 dark:text-purple-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Edit Your Profile</h2>
          <p className="text-muted-foreground">Update your personal details.</p>
        </div>
        <Form {...profileForm}>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
            <FormField
              control={profileForm.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><User className="w-4 h-4" /> Your Nickname</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Nickname" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={profileForm.control}
              name="partner_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><Users className="w-4 h-4" /> Partner's Email</FormLabel>
                  <FormControl>
                    <Input placeholder="partner@example.com" {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={profileForm.control}
              name="partner_nickname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><User className="w-4 h-4" /> Partner's Alias (for your view)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Sweetheart, My Love" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700 text-white dark:bg-purple-600 dark:hover:bg-purple-700">
              Save Profile Changes
            </Button>
          </form>
        </Form>

        <Separator className="my-8" />

        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Change Password</h2>
          <p className="text-muted-foreground">Update your account password.</p>
        </div>
        <Form {...passwordForm}>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
            <FormField
              control={passwordForm.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><Lock className="w-4 h-4" /> New Password</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter new password" {...field} type="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={passwordForm.control}
              name="confirmNewPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><Lock className="w-4 h-4" /> Confirm New Password</FormLabel>
                  <FormControl>
                    <Input placeholder="Confirm new password" {...field} type="password" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700">
              Change Password
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center">
          <Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;