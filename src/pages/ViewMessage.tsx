import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { ArrowLeft, Reply, User, Mail, MessageSquare, Tag, Zap, Smile } from 'lucide-react';
import { Separator } from '@/components/ui/separator'; // Import Separator

interface Profile {
  id: string;
  username: string | null;
  email: string | null;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  subject: string;
  content: string;
  created_at: string;
  is_read: boolean;
  message_type: string;
  priority: string;
  mood: string;
  senderProfile?: Profile | null;
  receiverProfile?: Profile | null;
}

const replyFormSchema = z.object({
  replyContent: z.string().min(1, { message: 'Reply cannot be empty.' }).max(1000, { message: 'Reply is too long.' }),
});

const ViewMessage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: sessionLoading } = useSession();
  const [message, setMessage] = useState<Message | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(true);

  const replyForm = useForm<z.infer<typeof replyFormSchema>>({
    resolver: zodResolver(replyFormSchema),
    defaultValues: {
      replyContent: '',
    },
  });

  useEffect(() => {
    const fetchMessage = async () => {
      if (sessionLoading || !user || !id) {
        setLoadingMessage(false);
        return;
      }

      setLoadingMessage(true);
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Error fetching message:', error.message);
          toast.error('Failed to load message.');
          setMessage(null);
        } else if (data) {
          // Fetch sender and receiver profiles
          const relatedUserIds = new Set<string>();
          relatedUserIds.add(data.sender_id);
          relatedUserIds.add(data.receiver_id);

          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, username, email')
            .in('id', Array.from(relatedUserIds));

          if (profilesError) {
            console.error('Error fetching profiles for message:', profilesError.message);
            toast.error('Failed to load associated profiles for message.');
          }

          const profilesMap = new Map<string, Profile>();
          profilesData?.forEach(profile => {
            profilesMap.set(profile.id, profile);
          });

          setMessage({
            ...data,
            senderProfile: profilesMap.get(data.sender_id) || null,
            receiverProfile: profilesMap.get(data.receiver_id) || null,
          });

          // Mark message as read if current user is the receiver and it's unread
          if (data.receiver_id === user.id && !data.is_read) {
            const { error: updateError } = await supabase
              .from('messages')
              .update({ is_read: true })
              .eq('id', id);
            if (updateError) {
              console.error('Error marking message as read:', updateError.message);
            }
          }
        } else {
          setMessage(null);
          toast.error('Message not found.');
        }
      } catch (error) {
        console.error('Unexpected error fetching message:', error);
        toast.error('An unexpected error occurred while loading the message.');
      } finally {
        setLoadingMessage(false);
      }
    };

    fetchMessage();
  }, [id, user, sessionLoading]);

  const handleReply = async (values: z.infer<typeof replyFormSchema>) => {
    if (!user || !message) {
      toast.error('Cannot send reply: User or message not identified.');
      return;
    }

    // Determine the recipient of the reply
    const replyReceiverId = message.sender_id === user.id ? message.receiver_id : message.sender_id;

    if (!replyReceiverId) {
      toast.error('Cannot determine recipient for reply.');
      return;
    }

    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: replyReceiverId,
        subject: `Re: ${message.subject}`, // Prefix subject with "Re:"
        content: values.replyContent,
        message_type: 'Reply', // New message type for replies
        priority: 'Medium', // Default priority for replies
        mood: 'Neutral', // Default mood for replies
      });

      if (error) {
        toast.error(error.message);
        console.error('Error sending reply:', error.message);
      } else {
        toast.success('Reply sent successfully!');
        replyForm.reset(); // Clear the reply form
        navigate('/messages'); // Navigate back to messages list
      }
    } catch (error) {
      console.error('Unexpected error sending reply:', error);
      toast.error('An unexpected error occurred while sending the reply.');
    }
  };

  if (sessionLoading || loadingMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-950 text-foreground">
        <p className="text-xl">Loading message...</p>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  if (!message) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-950 p-4 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Message Not Found</h2>
        <p className="text-muted-foreground mb-6">The message you are looking for does not exist or you do not have permission to view it.</p>
        <Link to="/messages">
          <Button variant="outline" className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">
            <ArrowLeft className="w-5 h-5 mr-2" /> Back to Messages
          </Button>
        </Link>
      </div>
    );
  }

  const isSentMessage = message.sender_id === user.id;
  const displaySender = isSentMessage ? 'You' : message.senderProfile?.username || message.senderProfile?.email || 'Unknown Sender';
  const displayReceiver = isSentMessage ? message.receiverProfile?.username || message.receiverProfile?.email || 'Unknown Partner' : 'You';

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-950 text-foreground p-4 pt-20">
      <div className="w-full max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Message Details</h1>
          <Link to="/messages">
            <Button variant="outline" className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">
              <ArrowLeft className="w-5 h-5 mr-2" /> Back to Messages
            </Button>
          </Link>
        </div>

        <Card className="bg-white dark:bg-gray-800 shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white text-2xl flex items-center gap-2">
              <MessageSquare className="w-6 h-6" /> {message.subject}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-base space-y-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <p><strong>From:</strong> {displaySender}</p>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <p><strong>To:</strong> {displayReceiver}</p>
            </div>
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              <p><strong>Type:</strong> {message.message_type}</p>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <p><strong>Priority:</strong> {message.priority}</p>
            </div>
            <div className="flex items-center gap-2">
              <Smile className="w-4 h-4" />
              <p><strong>Mood:</strong> {message.mood}</p>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sent on: {new Date(message.created_at).toLocaleString()}
            </p>
            <Separator className="my-4" />
            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">Content:</h3>
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </CardContent>
        </Card>

        {/* Reply Section */}
        {!isSentMessage && ( // Only show reply form if the message was received by the current user
          <Card className="bg-white dark:bg-gray-800 shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white text-2xl flex items-center gap-2">
                <Reply className="w-6 h-6" /> Reply to {displaySender}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...replyForm}>
                <form onSubmit={replyForm.handleSubmit(handleReply)} className="space-y-4">
                  <FormField
                    control={replyForm.control}
                    name="replyContent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Reply</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Type your reply here..." {...field} rows={4} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700">
                    <Reply className="w-4 h-4 mr-2" /> Send Reply
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ViewMessage;