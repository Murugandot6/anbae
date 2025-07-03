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
import { Reply, User, Mail, MessageSquare, Tag, Zap, Smile, ArrowLeft, CheckCheck, Plus, Paperclip, XCircle, Send } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Profile, Message } from '@/types/supabase';
import { fetchProfileById } from '@/lib/supabaseHelpers';
import { cn, formatDateTimeForMessageView } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Session } from '@supabase/supabase-js';
import BackgroundWrapper from '@/components/BackgroundWrapper'; // Updated import
import EmojiPickerPopover from '@/components/EmojiPickerPopover';
import { Badge } from '@/components/ui/badge';

const replyFormSchema = z.object({
  replyContent: z.string().min(1, { message: 'Reply cannot be empty.' }).max(1000, { message: 'Reply is too long.' }),
});

const renderMessageContent = (msg: Message, currentUser: Session['user'] | null, isReply = false) => {
  const isSentByCurrentUser = msg.sender_id === currentUser?.id;
  const formattedDateTime = formatDateTimeForMessageView(msg.created_at);

  return (
    <div
      key={msg.id}
      className={cn(
        "flex w-full",
        isSentByCurrentUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[70%] p-4 rounded-xl shadow-md",
          isSentByCurrentUser
            ? "bg-blue-600 text-white dark:bg-blue-800 rounded-br-none"
            : "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100 rounded-bl-none",
          isReply ? "mt-2" : ""
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
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  const replyForm = useForm<z.infer<typeof replyFormSchema>>({
    resolver: zodResolver(replyFormSchema),
    defaultValues: {
      replyContent: '',
    },
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessageAndReplies = async () => {
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

      const { data: repliesData, error: repliesError } = await supabase
        .from('messages')
        .select('*')
        .eq('parent_message_id', id)
        .order('created_at', { ascending: true });

      if (repliesError) {
        toast.error('Failed to load replies: ' + repliesError.message);
      }

      const allRelatedUserIds = new Set<string>();
      allRelatedUserIds.add(data.sender_id);
      allRelatedUserIds.add(data.receiver_id);
      repliesData?.forEach(reply => {
        allRelatedUserIds.add(reply.sender_id);
        allRelatedUserIds.add(reply.receiver_id);
      });

      const profilesMap = new Map<string, Profile>();
      for (const userId of Array.from(allRelatedUserIds)) {
        const profile = await fetchProfileById(userId);
        if (profile) {
          profilesMap.set(userId, profile);
        }
      }

      const processedReplies: Message[] = repliesData?.map(reply => ({
        ...reply,
        senderProfile: profilesMap.get(reply.sender_id) || null,
        receiverProfile: profilesMap.get(reply.receiver_id) || null,
      })) || [];

      const fetchedMessage: Message = {
        ...data,
        senderProfile: profilesMap.get(data.sender_id) || null,
        receiverProfile: profilesMap.get(data.receiver_id) || null,
        replies: processedReplies,
      };
      setMessage(fetchedMessage);

      if (fetchedMessage.receiver_id === user.id && !fetchedMessage.read_at) {
        const { error: updateError } = await supabase
          .from('messages')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('id', id);
        if (updateError) {
          console.error('Supabase Error marking message as read:', updateError.message);
        } else {
          setMessage(prev => prev ? { ...prev, is_read: true, read_at: new Date().toISOString() } : null);
        }
      }
    } catch (error: any) {
      toast.error('An unexpected error occurred while loading the message.');
    } finally {
      setLoadingMessage(false);
    }
  };

  useEffect(() => {
    fetchMessageAndReplies();

    const channel = supabase
      .channel(`message_view_${id}`) // Unique channel name for this view
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'messages',
          filter: `id=eq.${id}.or.parent_message_id=eq.${id}` // Filter for the main message OR its replies
        },
        async (payload) => {
          if (payload.eventType === 'UPDATE' && payload.old.id === id) {
            // This is an update to the main message
            const updatedMessage = payload.new as Message;
            setMessage(prev => {
              if (!prev) return null;
              return { ...prev, ...updatedMessage }; // Update the main message's properties
            });
            if (updatedMessage.status === 'closed') {
                toast.info('This conversation has been closed by the sender.');
            }
          } else if (payload.eventType === 'INSERT' && payload.new.parent_message_id === id) {
            // This is a new reply
            const newReply = payload.new as Message;
            const senderProfile = await fetchProfileById(newReply.sender_id);
            const receiverProfile = await fetchProfileById(newReply.receiver_id);

            setMessage(prev => {
              if (!prev) return null;
              const updatedReplies = [...(prev.replies || []), { ...newReply, senderProfile, receiverProfile }];
              return { ...prev, replies: updatedReplies };
            });
            toast.info(`New reply received from ${senderProfile?.username || senderProfile?.email || 'Your Partner'}!`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, user, sessionLoading]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [message]);

  const handleEmojiSelect = (emoji: string) => {
    const currentContent = replyForm.getValues('replyContent');
    replyForm.setValue('replyContent', currentContent + emoji, { shouldValidate: true });
  };

  const handleReply = async (values: z.infer<typeof replyFormSchema>) => {
    if (!user || !message) {
      toast.error('Cannot send reply: User or message not identified.');
      return;
    }

    if (message.status === 'closed') {
      toast.error('Cannot reply to a closed message.');
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
        parent_message_id: message.id,
      }).select().single();

      if (error) {
        toast.error(error.message);
      } else if (data) {
        toast.success('Reply sent successfully!');
        replyForm.reset();

        setMessage(prev => {
          if (!prev) return null;

          const isCurrentUserSenderOfReply = data.sender_id === user.id; // Use data.sender_id for the new reply
          
          const newReply: Message = {
            ...data,
            senderProfile: isCurrentUserSenderOfReply
              ? {
                  id: user.id,
                  username: user.user_metadata.nickname ?? null, // Fix: Use nullish coalescing
                  email: user.email ?? null, // Fix: Use nullish coalescing
                  avatar_url: user.user_metadata.avatar_url ?? null, // Fix: Use nullish coalescing
                }
              : prev.senderProfile, // If not current user, it's the original sender
            receiverProfile: isCurrentUserSenderOfReply
              ? prev.receiverProfile // If current user is sender, receiver is original receiver
              : {
                  id: user.id,
                  username: user.user_metadata.nickname ?? null, // Fix: Use nullish coalescing
                  email: user.email ?? null, // Fix: Use nullish coalescing
                  avatar_url: user.user_metadata.avatar_url ?? null, // Fix: Use nullish coalescing
                },
          };

          const updatedReplies = [...(prev.replies || []), newReply];
          return { ...prev, replies: updatedReplies };
        });
      }
    } catch (error: any) {
      toast.error('An unexpected error occurred while sending the reply.');
    }
  };

  const handleCloseMessage = async () => {
    if (!user || !message || message.sender_id !== user.id || message.status === 'closed') {
      toast.error('Cannot close message: Not your message, or already closed.');
      return;
    }

    try {
      const { error } = await supabase
        .from('messages')
        .update({ status: 'closed' })
        .eq('id', message.id);

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Message closed successfully!');
        setMessage(prev => prev ? { ...prev, status: 'closed' } : null);
      }
    } catch (error: any) {
      toast.error('An unexpected error occurred while closing the message.');
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

  const isMessageSentByCurrentUser = message.sender_id === user.id;
  const canCloseMessage = isMessageSentByCurrentUser && message.status === 'open';
  const canReply = message.status === 'open';

  return (
    <BackgroundWrapper className="pt-20"> {/* Updated component name */}
      <div className="w-full max-w-3xl mx-auto flex flex-col h-[calc(100vh-80px)]">
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
            <div className="text-right">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                {conversationPartnerName}
              </h1>
              <p className="text-xl text-muted-foreground mt-1 flex items-center justify-end gap-2">
                {message.message_type}
                {message.status === 'closed' && (
                  <Badge variant="secondary" className="ml-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200">Closed</Badge>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-y-4 pb-[120px]">
          {message && renderMessageContent(message, user)}

          {message && message.replies && message.replies.length > 0 && (
            <div className="space-y-4">
              {message.replies.map(reply => renderMessageContent(reply, user, true))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {message && canReply && (
          <div className="fixed bottom-0 left-0 right-0 z-50 w-full max-w-3xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-t-lg p-2">
            <Form {...replyForm}>
              <form onSubmit={replyForm.handleSubmit(handleReply)}>
                <div className="flex items-center gap-2 border rounded-full px-2 py-1 bg-white dark:bg-gray-800 shadow-sm">
                  <EmojiPickerPopover
                    isOpen={isEmojiPickerOpen}
                    onOpenChange={setIsEmojiPickerOpen}
                    onEmojiSelect={handleEmojiSelect}
                  >
                    <Button variant="ghost" size="icon" className="flex-shrink-0 w-8 h-8 text-blue-500 dark:text-blue-400" aria-label="Open emoji picker">
                      <Smile className="w-4 h-4" />
                    </Button>
                  </EmojiPickerPopover>
                  <FormField
                    control={replyForm.control}
                    name="replyContent"
                    render={({ field }) => (
                      <FormItem className="flex-1 mb-0">
                        <FormControl>
                          <Textarea
                            placeholder="Type a message..."
                            {...field}
                            rows={1}
                            className="resize-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent shadow-none p-0 py-1 h-auto"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                replyForm.handleSubmit(handleReply)();
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {canCloseMessage && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0 w-8 h-8 text-red-500 dark:text-red-400"
                      onClick={handleCloseMessage}
                      aria-label="Close message"
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  )}
                  <Button type="submit" variant="ghost" size="icon" className="flex-shrink-0 w-8 h-8 text-blue-500 dark:text-blue-400">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}
      </div>
    </BackgroundWrapper>
  );
};

export default ViewMessage;