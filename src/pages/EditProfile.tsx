import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } => 'Your partner\'s email cannot be the same as your own email.',
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