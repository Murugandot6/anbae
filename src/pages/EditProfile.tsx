import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom'; // Corrected this line
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Heart, User, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/contexts/SessionContext';

const formSchema = z.object({
  username: z.string().min(2, { message: 'Nickname must be at least 2 characters.' }).optional().or(z.literal('')),
  partner_email: z.string().email({ message: 'Please enter a valid partner email address.' }).optional().or(z.literal('')),
  partner_nickname: z.string().optional().or(z.literal('')), // New field for partner's nickname alias
});

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, loading: sessionLoading } = useSession();
  const [profileExists, setProfileExists] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      partner_email: '',
      partner_nickname: '', // Initialize new field
    },
  });

  // Custom validation for partner_email
  useEffect(() => {
    if (user?.email) {
      // This effect is for real-time validation feedback, not for initial form state.
      // The actual validation for submission happens in onSubmit.
      const partnerEmailValue = form.watch('partner_email');
      if (partnerEmailValue && user.email === partnerEmailValue) {
        form.setError('partner_email', {
          type: 'manual',
          message: "Your partner's email cannot be the same as your own email.",
        }, { shouldFocus: true });
      } else {
        form.clearErrors('partner_email');
      }
    }
  }, [user?.email, form.watch('partner_email'), form]); // Added form to dependencies

  useEffect(() => {
    const fetchProfile = async () => {
      if (sessionLoading || !user) {
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('username, partner_email, partner_nickname') // Select partner_nickname
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error.message);
        toast.error('Failed to load profile data.');
        setProfileExists(false);
      } else if (data) {
        form.reset({
          username: data.username || '',
          partner_email: data.partner_email || '',
          partner_nickname: data.partner_nickname || '', // Set value for new field
        });
        setProfileExists(true);
      } else {
        setProfileExists(false);
      }
    };

    fetchProfile();
  }, [user, sessionLoading, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast.error('You must be logged in to edit your profile.');
      return;
    }

    // Perform the custom validation before submitting
    if (user.email && values.partner_email && user.email === values.partner_email) {
      form.setError('partner_email', {
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
        partner_nickname: values.partner_nickname || null, // Include partner_nickname
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
        console.error('Profile DB operation error:', dbError.message);
      } else {
        // Also update user_metadata for immediate reflection in session context
        // Removed 'data: updateAuthData' as it was unused
        const { error: updateAuthError } = await supabase.auth.updateUser({
          data: {
            nickname: values.username || null,
            partner_email: values.partner_email || null,
            partner_nickname: values.partner_nickname || null, // Update user_metadata
          },
        });

        if (updateAuthError) {
          console.error('Auth user metadata update error:', updateAuthError.message);
          toast.error('Profile updated, but failed to update session data. Please re-login.');
        } else {
          toast.success('Profile updated successfully!');
          navigate('/dashboard');
        }
      }
    } catch (error) {
      console.error('Unexpected profile update error:', error);
      toast.error('An unexpected error occurred during profile update.');
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-950 p-4 pt-20">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <Heart className="w-12 h-12 text-pink-600 dark:text-purple-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Edit Your Profile</h2>
          <p className="text-muted-foreground">Update your personal details.</p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
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
              control={form.control}
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
              control={form.control}
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
              Save Changes
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