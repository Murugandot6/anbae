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
import { Profile } from '@/types/supabase';
import { fetchProfileByEmail } from '@/lib/supabaseHelpers';
import BackgroundWrapper from '@/components/BackgroundWrapper';
import { cn } from '@/lib/utils';
import { Helmet } from 'react-helmet-async'; // Import Helmet
import LoadingPulsar from '@/components/LoadingPulsar';

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
          const partnerData = await fetchProfileByEmail(currentUsersPartnerEmail);
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
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error('An unexpected error occurred while sending the message.');
    }
  };

  if (sessionLoading || fetchingPartner) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-background/80 text-foreground">
        <LoadingPulsar />
        <p className="text-xl mt-4">Loading...</p>
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
      <>
        <Helmet>
          <title>Send Message - Anbae</title>
          <meta name="description" content="Send a message to your partner. Choose message type, content, priority, and mood." />
        </Helmet>
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-background/80 p-4 text-center pt-20">
          <Heart className="w-10 h-10 sm:w-12 sm:h-12 text-primary mx-auto mb-3 sm:mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3 sm:mb-4">Partner Not Found</h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-2">
            It looks like your partner's profile isn't set up or linked.
          </p>
          <p className="text-sm sm:text-base text-muted-foreground mb-5 sm:mb-6">
            Your current partner email is: <strong className="text-foreground">{currentPartnerEmail}</strong>.
            Please ensure your partner has registered with this exact email, or update it in your profile.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link to="/edit-profile">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm sm:text-base px-4 py-2 sm:px-6 sm:py-3">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> Edit Partner Email
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" className="text-foreground border-border hover:bg-accent hover:text-accent-foreground text-sm sm:text-base px-4 py-2 sm:px-6 sm:py-3">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  const getCardClassesForMessageType = (messageType: string) => {
    switch (messageType) {
      case 'Grievance':
        return 'bg-destructive/20 dark:bg-destructive/20 border-destructive/50 dark:border-destructive/50';
      case 'Compliment':
        return 'bg-green-100/20 dark:bg-green-950/20 border-green-300/50 dark:border-green-700/50';
      case 'Good Memory':
        return 'bg-yellow-100/20 dark:bg-yellow-950/20 border-yellow-300/50 dark:border-yellow-700/50';
      case 'How I Feel':
        return 'bg-blue-100/20 dark:bg-blue-950/20 border-blue-300/50 dark:border-blue-700/50';
      default:
        return 'bg-card/60 dark:bg-card/60 border-border/50 dark:border-border/50';
    }
  };

  return (
    <>
      <Helmet>
        <title>Send Message - Anbae</title>
        <meta name="description" content="Send a message to your partner. Choose message type, content, priority, and mood." />
      </Helmet>
      <BackgroundWrapper>
        <div className={cn(
          "w-full max-w-sm sm:max-w-md p-6 sm:p-8 rounded-xl shadow-lg backdrop-blur-md transition-colors duration-300",
          getCardClassesForMessageType(selectedMessageType)
        )}>
          <div className="text-center mb-6">
            <Heart className="w-10 h-10 sm:w-12 sm:h-12 text-primary mx-auto mb-3 sm:mb-4" />
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">Send a Message</h2>
            <p className="text-sm sm:text-base text-muted-foreground">Share your thoughts with {partnerNickname || 'your partner'}.</p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6">
              <FormField
                control={form.control}
                name="message_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm sm:text-base"><MessageSquare className="w-4 h-4 text-primary" /> Message Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-input/50 border-border/50 text-foreground text-sm sm:text-base h-10">
                          <SelectValue placeholder="Select a message type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-card border-border text-foreground text-sm sm:text-base">
                        <SelectItem value="Grievance">💔 Grievance</SelectItem>
                        <SelectItem value="Compliment">💖 Compliment</SelectItem>
                        <SelectItem value="Good Memory">✨ Good Memory</SelectItem>
                        <SelectItem value="How I Feel">🤔 How I Feel</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs sm:text-sm" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-sm sm:text-base"><MessageSquare className="w-4 h-4 text-primary" /> Explanation</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Explain the situation, how it makes you feel, and what you need." {...field} rows={4} className="bg-input/50 border-border/50 text-foreground text-sm sm:text-base min-h-[80px] sm:min-h-[120px]" />
                    </FormControl>
                    <FormMessage className="text-xs sm:text-sm" />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-sm sm:text-base">Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-input/50 border-border/50 text-foreground text-sm sm:text-base h-10">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-card border-border text-foreground text-sm sm:text-base">
                          <SelectItem value="Low">Low</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs sm:text-sm" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-sm sm:text-base">Your Mood</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-input/50 border-border/50 text-foreground text-sm sm:text-base h-10">
                            <SelectValue placeholder="Select your mood" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-card border-border text-foreground text-sm sm:text-base">
                          <SelectItem value="Happy">😊 Happy</SelectItem>
                          <SelectItem value="Sad">😔 Sad</SelectItem>
                          <SelectItem value="Angry">😠 Angry</SelectItem>
                          <SelectItem value="Neutral">😐 Neutral</SelectItem>
                          <SelectItem value="Anxious">😟 Anxious</SelectItem>
                          <SelectItem value="Grateful">🙏 Grateful</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs sm:text-sm" />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm sm:text-base py-2 sm:py-2.5">
                <Send className="w-4 h-4 mr-2" /> Send Message
              </Button>
            </form>
          </Form>
          <div className="mt-5 sm:mt-6 text-center">
            <Link to="/dashboard" className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="inline-block w-4 h-4 mr-1" /> Back to Dashboard
            </Link>
          </div>
        </div>
      </BackgroundWrapper>
    </>
  );
};

export default SendMessage;