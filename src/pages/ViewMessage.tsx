import React, { useEffect, useState, useRef } from 'react';
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
import { Reply, User, Mail, MessageSquare, Tag, Zap, Smile, ArrowLeft, CheckCheck, Plus } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Profile, Message } from '@/types/supabase'; // Import Message type from supabase.ts
import { fetchProfileById } from '@/lib/supabaseHelpers'; // Import fetchProfileById
import { cn, formatDateTimeForMessageView } from '@/lib/utils'; // Import cn and the new utility function
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Import Avatar components
import { Session } from '@supabase/supabase-js'; // Import Session type for user object
import BackgroundImageWrapper from '@/components/BackgroundImageWrapper'; // Import BackgroundImageWrapper
import EmojiPickerPopover from '@/components/EmojiPickerPopover'; // Import the new EmojiPickerPopover

const replyFormSchema = z.object({
  replyContent: z.string().min(1, { message: 'Reply cannot be empty.' }).max(1000, { message: 'Reply is too long.' }),
});

// Moved renderMessageContent outside the component
const renderMessageContent = (msg: Message, currentUser: Session['user'] | null, isReply = false) => {
  const isSentByCurrentUser = msg.sender_id === currentUser?.id;
  const formattedDateTime = formatDateTimeForMessageView(msg.created_at);

  return (
    <div
      key={msg.id}
      className={cn(
        "flex w-full", // This outer div now takes full width
        isSentByCurrentUser ? "justify-end" : "justify-start" // Justify content within the full width
      )}
    >
      <div
        className={cn(
          "max-w-[70%] p-4 rounded-xl shadow-md",
          isSentByCurrentUser
            ? "bg-blue-600 text-white dark:bg-blue-800 rounded-br-none"
            : "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100 rounded-bl-none",
          isReply ? "mt-2" : "" // Add margin top for replies
        )}
      >
        <p className={cn("whitespace-pre-wrap text-base text-left", isSentByCurrentUser ? "text-white" : "text-gray-900 dark:text-gray-100")}>{msg.content}</p>
        <div className={cn("text-xs mt-2", isSentByCurrentUser ? "text-blue-100 dark:text-blue-200 text-right" : "text-gray-600 dark:text-gray-300 text-left")}>
          {formattedDateTime}
          {msg.read_at && isSentByCurrentUser && (
            <span className="ml-2 flex items-center justify-end gap-1">
              <CheckCheck className="w-3 h-3" /> Read
            </span>
          )}
        </div>
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
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false); // State for emoji picker

  const replyForm = useForm<z.infer<typeof replyFormSchema>>({
    resolver: zodResolver(replyFormSchema),
    defaultValues: {
      replyContent: '',
    },
  });

  const messagesEndRef = useRef<HTMLDivElement>(null); // Ref for auto-scrolling

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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [message]); // Trigger scroll when message (and thus replies) updates

  const handleEmojiSelect = (emoji: string) => {
    const currentContent = replyForm.getValues('replyContent');
    replyForm.setValue('replyContent', currentContent + emoji, { shouldValidate: true });
  };

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
    <BackgroundImageWrapper className="pt-20"> {/* Use BackgroundImageWrapper here */}
      <div className="w-full max-w-3xl mx-auto flex flex-col h-[calc(100vh-80px)]"> {/* Adjusted height to account for pt-20 (80px) */}
        <div className="flex items-center justify-between mb-8 flex-shrink-0">
          <Link to="/messages">
            <Button variant="outline" size="icon" className="w-10 h-10 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-2 border-blue-500 dark:border-purple-400">
              <AvatarImage src={conversationPartnerProfile?.avatar_url || ''} alt="Partner Avatar" />
              <AvatarFallback>{conversationPartnerName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="text-right"> {/* Added text-right here */}
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                {conversationPartnerName}
              </h1>
              <p className="text-xl text-muted-foreground mt-1">
                {message.message_type}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Message Area */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-y-4 pb-[120px]"> {/* Added flex flex-col gap-y-4 */}
          {/* Main Message */}
          {message && renderMessageContent(message, user)}

          {/* Replies Section */}
          {message && message.replies && message.replies.length > 0 && (
            <div className="space-y-4">
              {message.replies.map(reply => renderMessageContent(reply, user, true))}
            </div>
          )}
          <div ref={messagesEndRef} /> {/* Scroll target */}
        </div>

        {/* Reply Section - Fixed at bottom */}
        {message && (
          <Card className="fixed bottom-0 left-0 right-0 z-50 w-full max-w-3xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-t-lg rounded-b-none p-4">
            {/* Removed CardHeader and CardTitle */}
            <CardContent className="p-0">
              <Form {...replyForm}>
                <form onSubmit={replyForm.handleSubmit(handleReply)} className="space-y-4">
                  <div className="flex items-center gap-2 border rounded-lg p-2 bg-gray-100 dark:bg-gray-700">
                    <EmojiPickerPopover
                      isOpen={isEmojiPickerOpen}
                      onOpenChange={setIsEmojiPickerOpen}
                      onEmojiSelect={handleEmojiSelect}
                    >
                      <Button variant="ghost" size="icon" className="flex-shrink-0" aria-label="Open emoji picker">
                        <Smile className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      </Button>
                    </EmojiPickerPopover>
                    <FormField
                      control={replyForm.control}
                      name="replyContent"
                      render={({ field }) => (
                        <FormItem className="flex-1 mb-0"> {/* flex-1 to make it grow, mb-0 to remove default margin */}
                          <FormControl>
                            <Textarea
                              placeholder="Type something..."
                              {...field}
                              rows={1} // Start with 1 row
                              className="resize-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent shadow-none p-0" // Remove default textarea styling
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  replyForm.handleSubmit(handleReply)();
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage /> {/* Keep FormMessage for validation errors */}
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700">
                      Send
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>
    </BackgroundImageWrapper>
  );
};

export default ViewMessage;