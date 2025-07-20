import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Mail, Lock, User, Users, Heart } from 'lucide-react'; // Added Heart icon for relationship status
import { toast } from 'sonner';
import VideoBackground from '@/components/VideoBackground';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Helmet } from 'react-helmet-async'; // Import Helmet
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters.' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter.' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter.' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number.' })
    .regex(/[^a-zA-Z0-9]/, { message: 'Password must contain at least one special character.' }),
  nickname: z.string().min(2, { message: 'Nickname must be at least 2 characters.' }),
  relationship_status: z.enum(['Single', 'In a Relationship', 'Married', 'One-sided'], {
    required_error: 'Please select your relationship status.',
  }),
  partner_email: z.string().email({ message: 'Please enter a valid partner email address.' }).optional().or(z.literal('')),
}).refine((data) => data.email !== data.partner_email, {
  message: "Your partner's email cannot be the same as your own email.",
  path: ["partner_email"],
}).refine((data) => {
  if (data.relationship_status === 'Single' || data.relationship_status === 'One-sided') {
    return true; // partner_email is optional for these statuses
  }
  // For 'In a Relationship' or 'Married', partner_email must be provided and valid
  return data.partner_email && z.string().email().safeParse(data.partner_email).success;
}, {
  message: "Partner's email is required for this relationship status.",
  path: ["partner_email"],
});

const Register = () => {
  const navigate = useNavigate();
  const [isExiting, setIsExiting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      nickname: '',
      relationship_status: undefined, // Set initial value to undefined for select
      partner_email: '',
    },
  });

  const selectedRelationshipStatus = form.watch('relationship_status');

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { email, password, nickname, partner_email, relationship_status } = values;
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nickname,
            partner_email: partner_email || null, // Send null if optional and empty
            relationship_status,
          },
        },
      });

      if (error) {
        toast.error(error.message);
      } else if (data.user) {
        toast.success('Registration successful! Please check your email to confirm your account.');
        setIsExiting(true);
        setTimeout(() => {
          navigate('/onboarding-welcome');
        }, 500);
      }
    } catch (error) {
      toast.error('An unexpected error occurred during registration.');
    }
  };

  return (
    <>
      <Helmet>
        <title>Register - Anbae</title>
        <meta name="description" content="Create your Anbae account to start nurturing your relationship with personalized communication tools." />
      </Helmet>
      <VideoBackground />
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        <div className="absolute top-4 right-4 z-10">
          {/* Removed ThemeToggle */}
        </div>
        <div className={cn(
          "w-full max-w-[280px] sm:max-w-[320px] bg-white/30 dark:bg-gray-800/30 p-3 sm:p-4 rounded-xl shadow-lg backdrop-blur-sm border border-white/30 dark:border-gray-600/30",
          isExiting ? "animate-fade-out" : "animate-fade-in"
        )}>
          <div className="text-center mb-5">
            <img src="/favicon.ico" alt="App Favicon" className="w-9 h-9 sm:w-10 sm:h-10 mx-auto mb-2 sm:mb-3" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">Join Anbae</h2>
            <p className="text-sm text-gray-700 dark:text-gray-300">Create your personalized space.</p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4" /> Email</FormLabel>
                    <FormControl>
                      <Input placeholder="your.email@example.com" {...field} type="email" value={field.value || ''} className="text-sm placeholder:text-form-placeholder" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm"><Lock className="w-4 h-4" /> Password</FormLabel>
                    <FormControl>
                      <Input placeholder="Your password" {...field} type="password" value={field.value || ''} className="text-sm placeholder:text-form-placeholder" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nickname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm"><User className="w-4 h-4" /> Nickname</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Nickname" {...field} value={field.value || ''} className="text-sm placeholder:text-form-placeholder" />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="relationship_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm"><Heart className="w-4 h-4" /> Relationship Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-input/50 border-border/50 text-foreground text-sm h-10">
                          <SelectValue placeholder="Select your status" className="data-[placeholder]:text-form-placeholder" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card border-border text-foreground text-sm">
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="In a Relationship">In a Relationship</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="One-sided">One-sided</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              {!(selectedRelationshipStatus === 'Single' || selectedRelationshipStatus === 'One-sided') && (
                <FormField
                  control={form.control}
                  name="partner_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-sm"><Users className="w-4 h-4" /> Partner's Email</FormLabel>
                      <FormControl>
                        <Input placeholder="partner@example.com" {...field} type="email" value={field.value || ''} className="text-sm placeholder:text-form-placeholder" />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              )}
              <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700 text-white dark:bg-purple-600 dark:hover:bg-purple-700 text-sm py-2">
                <img src="/favicon.ico" alt="Favicon" className="w-4 h-4 mr-2" /> Create Account
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center">
            <Link to="/login" className="text-xs text-pink-600 hover:text-pink-700 dark:text-purple-400 dark:hover:text-purple-500 transition-colors">
              Already have an account? Login here
            </Link>
          </div>
          <div className="mt-2 text-center">
            <Link to="/" className="text-xs text-gray-800 hover:text-gray-900 dark:text-gray-200 dark:hover:text-gray-100 transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;