import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, Send, MessageSquare, Users, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/contexts/SessionContext';
import { Profile } from '@/types/supabase'; // Import shared Profile type
import { fetchProfileByEmail } from '@/lib/supabaseHelpers'; // Import shared helper
import BackgroundWrapper from '@/components/BackgroundWrapper'; // Import BackgroundWrapper
import { cn } from '@/lib/utils'; // Import cn utility for conditional classes

const formSchema = z.object({
  message_type: z.enum(['Grievance', 'Compliment', 'Good Memory', 'How I Feel'], {
    required_error: 'Please select a message type.',
  }),
  content: z.string().min(1, { message: 'Message content cannot be empty.' }).max(1000, { message: 'Message is too long.' }),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent'], {
    required_error: 'Please select a priority.',
  }),
  mood: z.enum(['Happy', 'Sad', 'Angry', 'Neutral', 'Anxious', 'Grateful'], {
    required_error: 'Please select your mood.',
  }),
});

const SendMessage = () => {
  const navigate = useNavigate();
  const { user, loading: sessionLoading } = useSession();
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [partnerNickname, setPartnerNickname] = useState<string | null>(null);
  const [fetchingPartner, setFetchingPartner] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message_type: 'Grievance',
      content: '',
      priority: 'Medium',
      mood: 'Neutral',
    },
  });

  // Watch for changes in message_type to dynamically update card styling
  const selectedMessageType = form.watch('message_type');

  useEffect(() => {
    const fetchPartnerDetails = async () => {
      if (sessionLoading || !user) {
        setFetchingPartner(false);
        return;
      }

      const currentUsersPartnerEmail = user?.user_metadata?.partner_email;

      if (currentUsersPartnerEmail) {
        try {
          const partnerData = await fetchProfileByEmail(currentUsersPartnerEmail); // Use the helper
          if (partnerData) {
            setPartnerId(partnerData.id);
            setPartnerNickname(partnerData.username);
          } else {
            toast.error('Partner profile not found for the specified email. Please ensure your partner has registered.');
            setPartnerId(null);
            setPartnerNickname(null);
          }
        } catch (error: any) {
          toast.error('An unexpected error occurred while fetching partner details.');
        }
      } else {
        toast.error('Your profile does not have a partner email set. Please update your profile.');
      }
      setFetchingPartner(false);
    };
    fetchPartnerDetails();
  }, [user, sessionLoading]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user || !partnerId) {
      toast.error('Cannot send message: User or partner not identified.');
      return;
    }

    const authorName = user.user_metadata.nickname || user.email;
    if (!authorName) {
      toast.error("Could not determine your author name. Please ensure you have a nickname set in your profile.");
      return;
    }

    try {
      const { error } = await supabase.from('messages').insert({
        user_id: user.id,
        sender_id: user.id,
        receiver_id: partnerId,
        author_name: authorName,
        subject: values.message_type,
        content: values.content,
        message_type: values.message_type,
        priority: values.priority,
        mood: values.mood,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Message sent successfully!');
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error('An unexpected error occurred while sending the message.');
    }
  };

  if (sessionLoading || fetchingPartner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-950 text-foreground">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  const currentPartnerEmail = user.user_metadata.partner_email || 'Not set';

  if (!partnerId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-950 p-4 text-center pt-20">
        <Heart className="w-12 h-12 text-pink-600 dark:text-purple-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Partner Not Found</h2>
        <p className="text-muted-foreground mb-2">
          It looks like your partner's profile isn't set up or linked.
        </p>
        <p className="text-muted-foreground mb-6">
          Your current partner email is: <strong className="text-gray-900 dark:text-white">{currentPartnerEmail}</strong>.
          Please ensure your partner has registered with this exact email, or update it in your profile.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/edit-profile">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700">
              <Users className="w-5 h-5 mr-2" /> Edit Partner Email
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="outline" className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Function to get dynamic card classes based on message type
  const getCardClassesForMessageType = (messageType: string) => {
    switch (messageType) {
      case 'Grievance':
        return 'bg-red-100/30 dark:bg-red-950/30 border-red-300/30 dark:border-red-700/30';
      case 'Compliment':
        return 'bg-green-100/30 dark:bg-green-950/30 border-green-300/30 dark:border-green-700/30';
      case 'Good Memory':
        return 'bg-yellow-100/30 dark:bg-yellow-950/30 border-yellow-300/30 dark:border-yellow-700/30';
      case 'How I Feel':
        return 'bg-blue-100/30 dark:bg-blue-950/30 border-blue-300/30 dark:border-blue-700/30';
      default:
        return 'bg-white/30 dark:bg-gray-800/30 border-white/30 dark:border-gray-600/30'; // Default neutral
    }
  };

  return (
    <BackgroundWrapper>
      <div className={cn(
        "w-full max-w-md p-8 rounded-xl shadow-lg backdrop-blur-sm transition-colors duration-300",
        getCardClassesForMessageType(selectedMessageType)
      )}>
        <div className="text-center mb-6">
          <Heart className="w-12 h-12 text-pink-600 dark:text-purple-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Send a Message</h2>
          <p className="text-muted-foreground">Share your thoughts with {partnerNickname || 'your partner'}.</p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="message_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Message Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a message type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Grievance">💔 Grievance</SelectItem>
                      <SelectItem value="Compliment">💖 Compliment</SelectItem>
                      <SelectItem value="Good Memory">✨ Good Memory</SelectItem>
                      <SelectItem value="How I Feel">🤔 How I Feel</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Explanation</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Explain the situation, how it makes you feel, and what you need." {...field} rows={5} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">Your Mood</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your mood" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Happy">😊 Happy</SelectItem>
                        <SelectItem value="Sad">😔 Sad</SelectItem>
                        <SelectItem value="Angry">😠 Angry</SelectItem>
                        <SelectItem value="Neutral">😐 Neutral</SelectItem>
                        <SelectItem value="Anxious">😟 Anxious</SelectItem>
                        <SelectItem value="Grateful">🙏 Grateful</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-800">
              <Send className="w-4 h-4 mr-2" /> Send Message
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

export default SendMessage;