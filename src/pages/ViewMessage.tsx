import { useEffect, useState } from 'react';
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
import { Reply, User, Mail, MessageSquare, Tag, Zap, Smile, ArrowLeft, CheckCheck } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Profile, Message } from '@/types/supabase'; // Import Message type from supabase.ts
import { fetchProfileById } from '@/lib/supabaseHelpers'; // Import fetchProfileById
import { cn, formatDateTimeForMessageView } from '@/lib/utils'; // Import cn and the new utility function
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Import Avatar components
import { Session } from '@supabase/supabase-js'; // Import Session type for user object

const replyFormSchema = z.object({
  replyContent: z.string().min(1, { message: 'Reply cannot be empty.' }).max(1000, { message: 'Reply is too long.' }),
});

// Moved renderMessageContent outside the component
const renderMessageContent = (msg: Message, currentUser: Session['user'] | null, isReply = false) => {
  const isSentByCurrentUser = msg.sender_id === currentUser?.id;
  const senderName = isSentByCurrentUser ? 'You' : msg.senderProfile?.username || msg.senderProfile?.email || 'Unknown Sender';
  const receiverName = isSentByCurrentUser ? msg.receiverProfile?.username || msg.receiverProfile?.email || 'Unknown Partner' : 'You';
  const formattedDateTime = formatDateTimeForMessageView(msg.created_at);

  // Determine which avatar to show
  const avatarUrl = isSentByCurrentUser ? currentUser?.user_metadata.avatar_url : msg.senderProfile?.avatar_url;
  const avatarFallbackText = isSentByCurrentUser ? currentUser?.user_metadata.nickname?.charAt(0).toUpperCase() || currentUser?.email?.charAt(0).toUpperCase() : msg.senderProfile?.username?.charAt(0).toUpperCase() || msg.senderProfile?.email?.charAt(0).toUpperCase();

  return (
    <div
      key={msg.id}
      className={cn(
        "flex w-full items-end gap-2", // Align items to the bottom for consistent avatar alignment
        isSentByCurrentUser ? "justify-end flex-row-reverse" : "justify-start flex-row" // Reverse order for sent messages
      )}
    >
      <Avatar className="w-10 h-10 flex-shrink-0">
        <AvatarImage src={avatarUrl || ''} alt={`${senderName}'s Avatar`} />
        <AvatarFallback>{avatarFallbackText}</AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "max-w-[70%] p-4 rounded-xl shadow-md",
          isSentByCurrentUser
            ? "bg-blue-600 text-white dark:bg-blue-800 rounded-br-none" // Removed text-right here
            : "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100 rounded-bl-none",
          isReply ? "mt-2" : "" // Add margin top for replies
        )}
      >
        <p className={cn("text-sm mt-1", isSentByCurrentUser ? "text-blue-100 dark:text-blue-200" : "text-gray-600 dark:text-gray-300")}> {/* Removed text-right/left here, it will default to left */}
          From: {senderName} | To: {receiverName} | Sent: {formattedDateTime}
        </p>
        {msg.read_at && isSentByCurrentUser && (
          <p className="text-xs flex items-center gap-1 mt-1 text-blue-200 dark:text-blue-300"> {/* Removed justify-end here, it will default to left */}
            <CheckCheck className="w-3 h-3" /> Read on: {formatDateTimeForMessageView(msg.read_at)}
          </p>
        )}
        <Separator className={cn("my-3", isSentByCurrentUser ? "bg-blue-500 dark:bg-blue-700" : "bg-gray-300 dark:bg-gray-600")} />
        <p className="whitespace-pre-wrap text-base">{msg.content}</p> {/* This will now default to left-aligned */}
      </div>
    </div>
  );
};

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

  const fetchMessageAndReplies = async () => {
    if (sessionLoading || !user || !id) {
      setLoadingMessage(false);
      return;
    }

    setLoadingMessage(true);
    try {
      // Fetch the main message
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Supabase Error fetching message:', error.message, error);
        toast.error('Failed to load message: ' + error.message);
        setMessage(null);
        setLoadingMessage(false);
        return;
      }
      if (!data) {
        setMessage(null);
        toast.error('Message not found.');
        setLoadingMessage(false);
        return;
      }

      // Fetch replies to this message
      const { data: repliesData, error: repliesError } = await supabase
        .from('messages')
        .select('*')
        .eq('parent_message_id', id)
        .order('created_at', { ascending: true });

      if (repliesError) {
        console.error('Supabase Error fetching replies:', repliesError.message, repliesError);
        toast.error('Failed to load replies: ' + repliesError.message);
      }

      // Collect all unique user IDs from the main message and its replies
      const allRelatedUserIds = new Set<string>();
      allRelatedUserIds.add(data.sender_id);
      allRelatedUserIds.add(data.receiver_id);
      repliesData?.forEach(reply => {
        allRelatedUserIds.add(reply.sender_id);
        allRelatedUserIds.add(reply.receiver_id);
      });

      // Fetch profiles for all related users
      const profilesMap = new Map<string, Profile>();
      for (const userId of Array.from(allRelatedUserIds)) {
        const profile = await fetchProfileById(userId);
        if (profile) {
          profilesMap.set(userId, profile);
        }
      }

      // Map profiles to replies
      const processedReplies: Message[] = repliesData?.map(reply => ({
        ...reply,
        senderProfile: profilesMap.get(reply.sender_id) || null,
        receiverProfile: profilesMap.get(reply.receiver_id) || null,
      })) || [];

      const fetchedMessage: Message = {
        ...data,
        senderProfile: profilesMap.get(data.sender_id) || null,
        receiverProfile: profilesMap.get(data.receiver_id) || null,
        replies: processedReplies, // Attach replies to the main message
      };
      setMessage(fetchedMessage);

      // Mark message as read if current user is the receiver and it's unread (or read_at is null)
      if (fetchedMessage.receiver_id === user.id && !fetchedMessage.read_at) {
        const { error: updateError } = await supabase
          .from('messages')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('id', id);
        if (updateError) {
          console.error('Supabase Error marking message as read:', updateError.message, updateError);
        } else {
          setMessage(prev => prev ? { ...prev, is_read: true, read_at: new Date().toISOString() } : null);
        }
      }
    } catch (error: any) {
      console.error('Unexpected error fetching message and replies:', error.message, error);
      toast.error('An unexpected error occurred while loading the message.');
    } finally {
      setLoadingMessage(false);
    }
  };

  useEffect(() => {
    fetchMessageAndReplies();

    // Realtime subscription for new replies to this message
    const channel = supabase
      .channel(`message_replies_${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `parent_message_id=eq.${id}`
        },
        async (payload) => {
          console.log('Realtime: New reply received:', payload.new);
          const newReply = payload.new as Message;
          // Use fetchProfileById to ensure correct type for profiles
          const senderProfile = await fetchProfileById(newReply.sender_id);
          const receiverProfile = await fetchProfileById(newReply.receiver_id);

          setMessage(prev => {
            if (!prev) return null;
            const updatedReplies = [...(prev.replies || []), { ...newReply, senderProfile, receiverProfile }];
            return { ...prev, replies: updatedReplies };
          });
          toast.info(`New reply received from ${senderProfile?.username || senderProfile?.email || 'Your Partner'}!`);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, user, sessionLoading]); // Re-run effect if message ID, user, or session loading changes

  const handleReply = async (values: z.infer<typeof replyFormSchema>) => {
    if (!user || !message) {
      toast.error('Cannot send reply: User or message not identified.');
      return;
    }

    const replyReceiverId = message.sender_id === user.id ? message.receiver_id : message.sender_id;

    if (!replyReceiverId) {
      toast.error('Cannot determine recipient for reply.');
      return;
    }

    try {
      const { data, error } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: replyReceiverId,
        subject: `Re: ${message.subject}`,
        content: values.replyContent,
        message_type: 'Reply',
        priority: 'Medium',
        mood: 'Neutral',
        parent_message_id: message.id, // Set the parent_message_id
      }).select().single(); // Select the inserted data to get its ID and created_at

      if (error) {
        toast.error(error.message);
        console.error('Supabase Error sending reply:', error.message, error);
      } else if (data) {
        toast.success('Reply sent successfully!');
        replyForm.reset();

        // Manually add the new reply to the state for instant display
        setMessage(prev => {
          if (!prev) return null;

          const newReply: Message = {
            ...data, // Use the data returned from the insert operation
            senderProfile: prev.receiverProfile, // If current user is sender, their profile is receiverProfile of main message
            receiverProfile: prev.senderProfile, // If current user is sender, partner's profile is senderProfile of main message
          };

          // Determine sender/receiver profiles for the new reply based on who sent it
          const isCurrentUserSenderOfReply = newReply.sender_id === user.id;
          newReply.senderProfile = isCurrentUserSenderOfReply ? { id: user.id, username: user.user_metadata.nickname, email: user.email, avatar_url: user.user_metadata.avatar_url } : message.senderProfile;
          newReply.receiverProfile = isCurrentUserSenderOfReply ? message.senderProfile : { id: user.id, username: user.user_metadata.nickname, email: user.email, avatar_url: user.user_metadata.avatar_url };


          const updatedReplies = [...(prev.replies || []), newReply];
          return { ...prev, replies: updatedReplies };
        });
      }
    } catch (error: any) {
      console.error('Unexpected error sending reply:', error.message, error);
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-950 p-4 text-center pt-20">
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

  const conversationPartnerProfile = message.sender_id === user.id
    ? message.receiverProfile
    : message.senderProfile;

  const conversationPartnerName = conversationPartnerProfile?.username || conversationPartnerProfile?.email || 'Your Partner';

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-950 text-foreground p-4 pt-20">
      <div className="w-full max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link to="/messages">
            <Button variant="outline" className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">
              <ArrowLeft className="w-5 h-5 mr-2" /> Back to Messages
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-2 border-blue-500 dark:border-purple-400">
              <AvatarImage src={conversationPartnerProfile?.avatar_url || ''} alt="Partner Avatar" />
              <AvatarFallback>{conversationPartnerName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                {conversationPartnerName}
              </h1>
              <p className="text-xl text-muted-foreground mt-1">
                {message.message_type}
              </p>
            </div>
          </div>
        </div>

        {/* Main Message */}
        {message && renderMessageContent(message, user)}

        {/* Replies Section */}
        {message && message.replies && message.replies.length > 0 && (
          <div className="mt-8">
            <div className="space-y-4">
              {message.replies.map(reply => renderMessageContent(reply, user, true))}
            </div>
          </div>
        )}

        {/* Reply Section */}
        {message && ( // Always show reply form on a message view
          <Card className="bg-white dark:bg-gray-800 shadow-lg mt-8 w-full">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white text-2xl flex items-center gap-2">
                <Reply className="w-6 h-6" /> Reply to {conversationPartnerName}
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
              </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ViewMessage;