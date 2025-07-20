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
import { Reply, User, Mail, MessageSquare, Tag, Zap, Smile, ArrowLeft, CheckCheck, Plus, XCircle, Send, Clock, AlertCircle, Check } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Profile, Message } from '@/types/supabase';
import { fetchProfileById } from '@/lib/supabaseHelpers';
import { cn, formatDateTimeForMessageView } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Session } from '@supabase/supabase-js';
import BackgroundWrapper from '@/components/BackgroundWrapper';
import { Badge } from '@/components/ui/badge';
import EmojiPickerPopover from '@/components/EmojiPickerPopover';
import { Helmet } from 'react-helmet-async'; // Import Helmet
import LoadingPulsar from '@/components/LoadingPulsar';

const replyFormSchema = z.object({
  replyContent: z.string().min(1, { message: 'Reply cannot be empty.' }).max(1000, { message: 'Reply is too long.' }),
});

const renderMessageContent = (msg: Message, currentUser: Session['user'] | null, isReply = false) => {
  const isSentByCurrentUser = msg.sender_id === currentUser?.id;
  const formattedDateTime = formatDateTimeForMessageView(msg.created_at);

  const renderStatusIcon = () => {
    if (!isSentByCurrentUser) return null;

    if (msg.sendingStatus === 'sending') {
      return <Clock className="w-4 h-4 ml-2" />;
    }
    if (msg.sendingStatus === 'failed') {
      return <AlertCircle className="w-4 h-4 ml-2 text-destructive" />;
    }
    if (msg.read_at) {
      return <CheckCheck className="w-4 h-4 ml-2" />;
    }
    // If sent successfully (or it's an existing message from DB)
    return <Check className="w-4 h-4 ml-2" />;
  };

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
          "max-w-[85%] sm:max-w-[70%] p-3 sm:p-4 rounded-xl shadow-md",
          isSentByCurrentUser
            ? "bg-primary text-primary-foreground rounded-br-none"
            : "bg-secondary text-secondary-foreground dark:bg-muted-foreground/20 rounded-bl-none",
          isReply ? "mt-2" : ""
        )}
      >
        <p className={cn("whitespace-pre-wrap text-sm sm:text-base text-left", isSentByCurrentUser ? "text-primary-foreground" : "text-secondary-foreground dark:text-foreground")}>{msg.content}</p>
        <div className={cn("text-xs mt-1 sm:mt-2 flex items-center", isSentByCurrentUser ? "justify-end text-primary-foreground/80" : "justify-start text-secondary-foreground/80 dark:text-muted-foreground")}>
          <span>{formattedDateTime}</span>
          {renderStatusIcon()}
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

      // Mark parent message and all unread replies as read
      const idsToMarkAsRead: string[] = [];
      if (data.receiver_id === user.id && !data.is_read) {
        idsToMarkAsRead.push(data.id);
      }
      repliesData?.forEach(reply => {
        if (reply.receiver_id === user.id && !reply.is_read) {
          idsToMarkAsRead.push(reply.id);
        }
      });

      if (idsToMarkAsRead.length > 0) {
        const { error: updateError } = await supabase
          .from('messages')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .in('id', idsToMarkAsRead);

        if (updateError) {
          console.error('Supabase Error marking messages as read:', updateError.message);
        } else {
          // Optimistically update local state to reflect the change immediately
          setMessage(prev => {
            if (!prev) return null;
            const readTimestamp = new Date().toISOString();
            const updatedReplies = prev.replies?.map(r =>
              idsToMarkAsRead.includes(r.id) ? { ...r, is_read: true, read_at: readTimestamp } : r
            );
            const updatedParent = idsToMarkAsRead.includes(prev.id) ? { ...prev, is_read: true, read_at: readTimestamp } : prev;
            return { ...updatedParent, replies: updatedReplies };
          });
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
      .channel(`message_view_${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `id=eq.${id}.or.parent_message_id=eq.${id}`
        },
        async (payload) => {
          if (payload.eventType === 'UPDATE' && payload.old.id === id) {
            const updatedMessage = payload.new as Message;
            setMessage(prev => {
              if (!prev) return null;
              return { ...prev, ...updatedMessage };
            });
            if (updatedMessage.status === 'closed') {
                toast.info('This conversation has been closed by the sender.');
            }
          } else if (payload.eventType === 'INSERT' && payload.new.parent_message_id === id) {
            const newReply = payload.new as Message;
            const senderProfile = await fetchProfileById(newReply.sender_id);
            const receiverProfile = await fetchProfileById(newReply.receiver_id);

            setMessage(prev => {
              if (!prev) return null;
              if (prev.replies?.some(r => r.id === newReply.id)) {
                return prev;
              }
              const updatedReplies = [...(prev.replies || []), { ...newReply, senderProfile, receiverProfile } as Message]; // Explicit cast
              return { ...prev, replies: updatedReplies };
            });
            if (newReply.receiver_id === user?.id) {
                toast.info(`New reply received from ${senderProfile?.username || senderProfile?.email || 'Your Partner'}!`);
            }
          } else if (payload.eventType === 'UPDATE' && payload.new.parent_message_id === id) {
            const updatedReply = payload.new as Message;
            setMessage(prev => {
              if (!prev || !prev.replies) return prev;
              
              const updatedReplies = prev.replies.map(reply => 
                reply.id === updatedReply.id ? { ...reply, ...updatedReply } as Message : reply // Explicit cast
              );

              return { ...prev, replies: updatedReplies };
            });
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

    const authorName = user.user_metadata.nickname || user.email || 'Unknown User';
    const tempId = `temp_${Date.now()}`;

    const optimisticReply: Message = {
      id: tempId,
      user_id: user.id, // Added missing user_id
      content: values.replyContent,
      created_at: new Date().toISOString(),
      sender_id: user.id,
      receiver_id: replyReceiverId,
      author_name: authorName,
      subject: `Re: ${message.subject}`,
      message_type: 'Reply',
      priority: 'Medium',
      mood: 'Neutral',
      parent_message_id: message.id,
      is_read: false,
      read_at: null,
      status: 'open',
      sendingStatus: 'sending',
    };

    setMessage(prev => {
      if (!prev) return null;
      const updatedReplies = [...(prev.replies || []), optimisticReply];
      return { ...prev, replies: updatedReplies };
    });
    replyForm.reset();

    try {
      const { data, error } = await supabase.from('messages').insert({
        user_id: user.id,
        sender_id: user.id,
        receiver_id: replyReceiverId,
        author_name: authorName,
        subject: `Re: ${message.subject}`,
        content: values.replyContent,
        message_type: 'Reply',
        priority: 'Medium',
        mood: 'Neutral',
        parent_message_id: message.id,
      }).select().single();

      if (error) throw error;

      setMessage(prev => {
        if (!prev) return null;
        const updatedReplies = prev.replies?.map(r => 
          r.id === tempId ? { ...r, ...data, sendingStatus: 'sent' } as Message : r // Explicit cast
        ) || [];
        return { ...prev, replies: updatedReplies };
      });

    } catch (error: any) {
      toast.error('Failed to send reply: ' + error.message);
      setMessage(prev => {
        if (!prev) return null;
        const updatedReplies = prev.replies?.map(r => 
          r.id === tempId ? { ...r, sendingStatus: 'failed' } as Message : r // Explicit cast
        ) || [];
        return { ...prev, replies: updatedReplies };
      });
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-background/80 text-foreground">
        <LoadingPulsar />
        <p className="text-xl mt-4">Loading message...</p>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  if (!message) {
    return (
      <>
        <Helmet>
          <title>Message Not Found - Anbae</title>
          <meta name="description" content="The message you are looking for does not exist or you do not have permission to view it." />
        </Helmet>
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-background/80 p-4 text-center pt-20">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3 sm:mb-4">Message Not Found</h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-5 sm:mb-6">The message you are looking for does not exist or you do not have permission to view it.</p>
          <Link to="/messages">
            <Button variant="outline" className="text-foreground border-border hover:bg-accent hover:text-accent-foreground text-sm sm:text-base px-4 py-2 sm:px-6 sm:py-3">
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> Back to Messages
            </Button>
          </Link>
        </div>
      </>
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
    <>
      <Helmet>
        <title>{`Message with ${conversationPartnerName} - Anbae`}</title>
        <meta name="description" content={`View your conversation with ${conversationPartnerName} about ${message.subject}.`} />
      </Helmet>
      <BackgroundWrapper className="pt-16 sm:pt-20"> {/* Adjusted top padding */}
        <div className="w-full max-w-xl sm:max-w-3xl mx-auto flex flex-col h-[calc(100vh-64px)] sm:h-[calc(100vh-80px)] px-4"> {/* Adjusted height and added horizontal padding */}
          {/* Ensure positioning is absolute for top-left corner */}
          <div className="absolute top-3 left-3 z-10">
            <Link to="/messages">
              <Button variant="outline" size="icon" className="w-9 h-9 sm:w-10 sm:h-10 text-foreground border-border hover:bg-accent hover:text-accent-foreground rounded-full shadow-md">
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-end mb-6 sm:mb-8 flex-shrink-0"> {/* Adjusted margin-bottom */}
            {/* The back button is now outside this flex container */}
            <div className="flex-grow"></div> {/* Spacer to push content to center/right */}
            <div className="flex items-center gap-3 sm:gap-4"> {/* Adjusted gap */}
              <Avatar className="w-12 h-12 sm:w-16 h-16 border-2 border-primary dark:border-primary-foreground"> {/* Adjusted avatar size */}
                <AvatarImage src={conversationPartnerProfile?.avatar_url || ''} alt="Partner Avatar" />
                <AvatarFallback className="bg-primary text-primary-foreground text-base sm:text-xl">{conversationPartnerName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="text-right">
                <h1 className="text-2xl sm:text-4xl font-bold text-foreground"> {/* Adjusted font size */}
                  {conversationPartnerName}
                </h1>
                <p className="text-base sm:text-xl text-muted-foreground mt-0.5 sm:mt-1 flex items-center justify-end gap-1 sm:gap-2"> {/* Adjusted font size and gap */}
                  {message.message_type}
                  {message.status === 'closed' && (
                    <Badge variant="secondary" className="ml-1 sm:ml-2 bg-muted text-muted-foreground text-xs sm:text-sm px-2 py-0.5">Closed</Badge>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 sm:p-4 flex flex-col gap-y-3 sm:gap-y-4 pb-24 sm:pb-28"> {/* Adjusted padding and gap */}
            {message && renderMessageContent(message, user)}

            {message && message.replies && message.replies.length > 0 && (
              <div className="space-y-3 sm:space-y-4"> {/* Adjusted gap */}
                {message.replies.map(reply => renderMessageContent(reply, user, true))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {message && canReply && (
            <div className="fixed bottom-0 left-0 right-0 z-50 w-full max-w-xl sm:max-w-3xl mx-auto p-2 bg-transparent"> {/* Adjusted max-width and padding */}
              <Form {...replyForm}>
                <form onSubmit={replyForm.handleSubmit(handleReply)} className="w-full">
                  <div className="flex items-center gap-1 sm:gap-2 rounded-full px-2 py-1 bg-card/80 dark:bg-card/80 shadow-lg border border-border/50 backdrop-blur-md"> {/* Adjusted gap and padding */}
                    <EmojiPickerPopover
                      isOpen={isEmojiPickerOpen}
                      onOpenChange={setIsEmojiPickerOpen}
                      onEmojiSelect={handleEmojiSelect}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        aria-label="Open emoji picker"
                      >
                        <Smile className="w-4 h-4" />
                      </Button>
                    </EmojiPickerPopover>
                    <FormField
                      control={replyForm.control}
                      name="replyContent"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Textarea
                              placeholder="Type a message..."
                              {...field}
                              rows={1}
                              className="w-full min-h-0 resize-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent shadow-none p-0 py-1 h-auto text-foreground text-sm sm:text-base"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  replyForm.handleSubmit(handleReply)();
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage className="hidden" />
                        </FormItem>
                      )}
                    />
                    {canCloseMessage && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full text-destructive hover:bg-destructive/20"
                        onClick={handleCloseMessage}
                        aria-label="Close message"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      type="submit"
                      variant="default"
                      size="icon"
                      className="rounded-full flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-primary hover:bg-primary/90 text-primary-foreground"
                      disabled={!replyForm.formState.isValid || replyForm.formState.isSubmitting}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="px-4 pt-1">
                    <FormMessage className="text-xs text-destructive">{replyForm.formState.errors.replyContent?.message}</FormMessage>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </div>
      </BackgroundWrapper>
    </>
  );
};

export default ViewMessage;