import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Mail, Send, MessageSquare, Tag, Zap, Smile, User, ArrowLeft, CheckCheck, Plus } from 'lucide-react';
import { Profile, Message } from '@/types/supabase';
import { fetchProfileById } from '@/lib/supabaseHelpers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatMessageDate, cn, formatDateTimeForMessageView } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import BackgroundWrapper from '@/components/BackgroundWrapper';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Helmet } from 'react-helmet-async';
import LoadingPulsar from '@/components/LoadingPulsar';

const Messages = () => {
  const { user, loading: sessionLoading } = useSession();
  const navigate = useNavigate();
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [receivedMessages, setReceivedMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [profilesMap, setProfilesMap] = useState<Map<string, Profile>>(new Map());

  // Helper to fetch a single profile if not already in map
  const getOrFetchProfile = async (profileId: string) => {
    if (profilesMap.has(profileId)) {
      return profilesMap.get(profileId);
    }
    const profile = await fetchProfileById(profileId);
    if (profile) {
      setProfilesMap(prev => new Map(prev).set(profileId, profile));
    }
    return profile;
  };

  useEffect(() => {
    const fetchAllMessagesAndProfiles = async () => {
      if (!user) {
        setMessagesLoading(false);
        return;
      }

      setMessagesLoading(true);
      try {
        const { data: sentData, error: sentError } = await supabase
          .from('messages')
          .select('*')
          .eq('sender_id', user.id)
          .is('parent_message_id', null)
          .order('created_at', { ascending: false });

        if (sentError) {
          toast.error('Failed to load sent messages: ' + sentError.message);
        }

        const { data: receivedData, error: receivedError } = await supabase
          .from('messages')
          .select('*')
          .eq('receiver_id', user.id)
          .is('parent_message_id', null)
          .order('created_at', { ascending: false });

        if (receivedError) {
          toast.error('Failed to load received messages: ' + receivedError.message);
        }

        const allRelatedUserIds = new Set<string>();
        sentData?.forEach(msg => allRelatedUserIds.add(msg.receiver_id));
        receivedData?.forEach(msg => allRelatedUserIds.add(msg.sender_id));
        allRelatedUserIds.add(user.id);

        const fetchedProfiles: Profile[] = [];
        for (const id of Array.from(allRelatedUserIds)) {
          const profile = await fetchProfileById(id);
          if (profile) {
            fetchedProfiles.push(profile);
          }
        }

        const initialProfilesMap = new Map<string, Profile>();
        fetchedProfiles.forEach(profile => {
          initialProfilesMap.set(profile.id, profile);
        });
        setProfilesMap(initialProfilesMap);

        const combinedSentMessages = sentData?.map(msg => ({
          ...msg,
          receiverProfile: initialProfilesMap.get(msg.receiver_id) || null,
        })) || [];

        const combinedReceivedMessages = receivedData?.map(msg => ({
          ...msg,
          senderProfile: initialProfilesMap.get(msg.sender_id) || null,
        })) || [];

        setSentMessages(combinedSentMessages);
        setReceivedMessages(combinedReceivedMessages);

      } catch (error: any) {
        toast.error('An unexpected error occurred while loading messages.');
      } finally {
        setMessagesLoading(false);
      }
    };

    if (!sessionLoading && user) {
      fetchAllMessagesAndProfiles();
    } else if (!sessionLoading && !user) {
      navigate('/login');
    }

    const channel = supabase
      .channel('messages-list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${user?.id}.or.receiver_id=eq.${user?.id}`
        },
        async (payload) => {
          const newMessage = payload.new as Message;

          if (newMessage.parent_message_id !== null) {
            return;
          }

          if (payload.eventType === 'INSERT') {
            const senderProfile = await getOrFetchProfile(newMessage.sender_id);
            const receiverProfile = await getOrFetchProfile(newMessage.receiver_id);

            const messageWithProfiles = {
              ...newMessage,
              senderProfile,
              receiverProfile,
            };

            if (newMessage.receiver_id === user?.id) {
              setReceivedMessages(prev => [messageWithProfiles, ...prev]);
              toast.info(`New message from ${senderProfile?.username || senderProfile?.email || 'Your Partner'}!`);
            } else if (newMessage.sender_id === user?.id) {
              setSentMessages(prev => [messageWithProfiles, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            setReceivedMessages(prev =>
              prev.map(msg => (msg.id === newMessage.id ? { ...msg, ...newMessage } : msg))
            );
            setSentMessages(prev =>
              prev.map(msg => (msg.id === newMessage.id ? { ...msg, ...newMessage } : msg))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, sessionLoading, navigate]);

  if (sessionLoading || messagesLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-background/80 text-foreground">
        <LoadingPulsar />
        <p className="text-xl mt-4">Loading messages...</p>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  const getMessageTypeClasses = (messageType: string) => {
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
        return 'bg-card/20 dark:bg-card/20 border-border/50 dark:border-border/50';
    }
  };

  const getMessageTypeEmoji = (messageType: string) => {
    switch (messageType) {
      case 'Grievance':
        return '💔';
      case 'Compliment':
        return '💖';
      case 'Good Memory':
        return '✨';
      case 'How I Feel':
        return '🤔';
      default:
        return '';
    }
  };

  const getMessageTypeEmojiBackgroundClasses = (messageType: string) => {
    return getMessageTypeClasses(messageType);
  };

  return (
    <>
      <Helmet>
        <title>Messages - Anbae</title>
        <meta name="description" content="View your sent and received messages with your partner on Anbae. Keep track of your conversations." />
      </Helmet>
      <BackgroundWrapper className="pt-0 md:pt-0">
        <div className="w-full max-w-2xl mx-auto pt-8 mt-16 md:mt-8 px-4">
          <div className="flex justify-between items-center mb-6">
            <div className="absolute top-3 left-3 z-10">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-9 h-9 sm:w-10 sm:h-10 text-foreground border-border hover:bg-accent hover:text-accent-foreground rounded-full shadow-md"
                    onClick={() => {
                      navigate('/dashboard', { replace: true });
                    }}
                  >
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Back to Dashboard
                </TooltipContent>
              </Tooltip>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mx-auto">Your Messages</h1>
          </div>

          <Link to="/send-message" className="block w-full mb-6 sm:mb-8">
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-base sm:text-lg py-2.5 sm:py-3 rounded-lg shadow-md">
              <Plus className="w-5 h-5 mr-2" /> Express
            </Button>
          </Link>

          <Tabs defaultValue="inbox" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 bg-card/60 backdrop-blur-md border border-border/50 rounded-xl h-10 sm:h-12">
              <TabsTrigger value="inbox" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-lg transition-all duration-200 text-sm sm:text-base">
                <Mail className="w-4 h-4 mr-1 sm:mr-2" /> Inbox ({receivedMessages.length})
              </TabsTrigger>
              <TabsTrigger value="outbox" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-lg transition-all duration-200 text-sm sm:text-base">
                <Send className="w-4 h-4 mr-1 sm:mr-2" /> Outbox ({sentMessages.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="inbox">
              <Card className="bg-card/60 dark:bg-card/60 shadow-lg backdrop-blur-md border border-border/50 rounded-xl">
                <CardHeader className="p-3 sm:p-4">
                  <CardTitle className="text-foreground text-lg sm:text-xl">Received Messages</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground p-3 sm:p-4 pt-0">
                  {receivedMessages.length > 0 ? (
                    <ul className="space-y-3 sm:space-y-4">
                      {receivedMessages.map((message) => (
                        <li key={message.id} className={cn("relative border-b border-border/30 pb-2 last:border-b-0 max-w-full mx-auto p-2 rounded-xl transition-all duration-300 hover:scale-[1.01] hover:shadow-md", getMessageTypeClasses(message.message_type))}>
                          <Link to={`/messages/${message.id}`} className="block hover:bg-opacity-80 rounded-md transition-colors flex items-center gap-2 sm:gap-3">
                            <span className={cn(
                              "absolute -top-3 -left-3 text-xl sm:text-2xl z-10 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full shadow-md",
                              getMessageTypeEmojiBackgroundClasses(message.message_type)
                            )}>
                              {getMessageTypeEmoji(message.message_type)}
                            </span>
                            <Avatar className="w-10 h-10 sm:w-12 sm:h-12 ml-6 sm:ml-8 border-2 border-primary">
                              <AvatarImage src={message.senderProfile?.avatar_url || ''} alt="Sender Avatar" />
                              <AvatarFallback className="bg-primary text-primary-foreground text-sm sm:text-base">{message.senderProfile?.username?.charAt(0).toUpperCase() || message.senderProfile?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-semibold text-base sm:text-lg text-foreground mb-0.5 sm:mb-1 flex items-center justify-between gap-1 sm:gap-2">
                                <span className="flex items-center gap-1 sm:gap-2">
                                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                                  {message.subject}
                                </span>
                                <span className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground flex-shrink-0">
                                  {!message.is_read && (
                                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" title="New Message"></div>
                                  )}
                                  {message.status === 'closed' && (
                                    <Badge variant="secondary" className="bg-muted text-muted-foreground text-xs px-2 py-0.5">Closed</Badge>
                                  )}
                                </span>
                              </p>
                              <p className="text-xs sm:text-sm text-foreground line-clamp-2">
                                {message.content}
                              </p>
                              <div className="text-xs text-muted-foreground mt-0.5 sm:mt-1">
                                {formatDateTimeForMessageView(message.created_at)}
                              </div>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm sm:text-base">No messages received yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="outbox">
              <Card className="bg-card/60 dark:bg-card/60 shadow-lg backdrop-blur-md border border-border/50 rounded-xl">
                <CardHeader className="p-3 sm:p-4">
                  <CardTitle className="text-foreground text-lg sm:text-xl">Sent Messages</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground p-3 sm:p-4 pt-0">
                  {sentMessages.length > 0 ? (
                    <ul className="space-y-3 sm:space-y-4">
                      {sentMessages.map((message) => (
                        <li key={message.id} className={cn("relative border-b border-border/30 pb-2 last:border-b-0 max-w-full mx-auto p-2 rounded-xl transition-all duration-300 hover:scale-[1.01] hover:shadow-md", getMessageTypeClasses(message.message_type))}>
                          <Link to={`/messages/${message.id}`} className="block hover:bg-opacity-80 rounded-md transition-colors flex items-center gap-2 sm:gap-3">
                            <span className={cn(
                              "absolute -top-3 -left-3 text-xl sm:text-2xl z-10 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full shadow-md",
                              getMessageTypeEmojiBackgroundClasses(message.message_type)
                            )}>
                              {getMessageTypeEmoji(message.message_type)}
                            </span>
                            <Avatar className="w-10 h-10 sm:w-12 sm:h-12 ml-6 sm:ml-8 border-2 border-primary">
                              <AvatarImage src={message.receiverProfile?.avatar_url || ''} alt="Receiver Avatar" />
                              <AvatarFallback className="bg-primary text-primary-foreground text-sm sm:text-base">{message.receiverProfile?.username?.charAt(0).toUpperCase() || message.receiverProfile?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-semibold text-base sm:text-lg text-foreground mb-0.5 sm:mb-1 flex items-center justify-between gap-1 sm:gap-2">
                                <span className="flex items-center gap-1 sm:gap-2">
                                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                                  {message.subject}
                                </span>
                                <span className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground flex-shrink-0">
                                  {message.read_at && (
                                    <Badge className="bg-accent text-accent-foreground text-xs font-bold px-2 py-0.5 flex items-center gap-1">
                                      <CheckCheck className="w-3 h-3" /> Read
                                    </Badge>
                                  )}
                                  {message.status === 'closed' && (
                                    <Badge variant="secondary" className="bg-muted text-muted-foreground text-xs px-2 py-0.5">Closed</Badge>
                                  )}
                                </span>
                              </p>
                              <p className="text-xs sm:text-sm text-foreground line-clamp-2">
                                {message.content}
                              </p>
                              <div className="text-xs text-muted-foreground mt-0.5 sm:mt-1">
                                {formatDateTimeForMessageView(message.created_at)}
                              </div>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm sm:text-base">No messages sent yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </BackgroundWrapper>
    </>
  );
};

export default Messages;