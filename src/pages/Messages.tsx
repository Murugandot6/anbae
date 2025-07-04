import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Mail, Send, MessageSquare, Tag, Zap, Smile, User, ArrowLeft, CheckCheck } from 'lucide-react';
import { Profile, Message } from '@/types/supabase'; // Import shared types
import { fetchProfileById } from '@/lib/supabaseHelpers'; // Import shared helper
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Import Avatar components
import { formatMessageDate, cn, formatDateTimeForMessageView } from '@/lib/utils'; // Import formatMessageDate, cn, and formatDateTimeForMessageView
import { Badge } from '@/components/ui/badge'; // Import Badge component
import BackgroundWrapper from '@/components/BackgroundWrapper'; // Updated import
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'; // Import Tooltip components

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
        setMessagesLoading(false); // Set loading to false if no user
        return;
      }

      setMessagesLoading(true); // Set loading to true at the start of fetch
      try {
        // Fetch all top-level messages (not replies) for the current user, both sent and received
        const { data: sentData, error: sentError } = await supabase
          .from('messages')
          .select('*') // Select all columns, including 'status'
          .eq('sender_id', user.id)
          .is('parent_message_id', null) // Only top-level messages
          .order('created_at', { ascending: false });

        if (sentError) {
          toast.error('Failed to load sent messages: ' + sentError.message);
        }

        // Fetch all received messages that are NOT replies (parent_message_id is null)
        const { data: receivedData, error: receivedError } = await supabase
          .from('messages')
          .select('*') // Select all columns, including 'status'
          .eq('receiver_id', user.id)
          .is('parent_message_id', null) // Only top-level messages
          .order('created_at', { ascending: false });

        if (receivedError) {
          toast.error('Failed to load received messages: ' + receivedError.message);
        }

        const allRelatedUserIds = new Set<string>();
        sentData?.forEach(msg => allRelatedUserIds.add(msg.receiver_id));
        receivedData?.forEach(msg => allRelatedUserIds.add(msg.sender_id));
        allRelatedUserIds.add(user.id); // Include current user's ID for their own profile if needed

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
      .channel('messages_channel')
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

          // Only process top-level messages for the main list
          if (newMessage.parent_message_id !== null) {
            return; // Do not add replies to the main inbox/outbox lists
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-950 text-foreground">
        <p className="text-xl">Loading messages...</p>
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
        return 'bg-red-100 dark:bg-red-950 border-red-300 dark:border-red-700';
      case 'Compliment':
        return 'bg-green-100 dark:bg-green-950 border-green-300 dark:border-green-700';
      case 'Good Memory':
        return 'bg-yellow-100 dark:bg-yellow-950 border-yellow-300 dark:border-yellow-700';
      case 'How I Feel':
        return 'bg-blue-100 dark:bg-blue-950 border-blue-300 dark:border-blue-700';
      default:
        return 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600';
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
    <BackgroundWrapper className="justify-start items-start">
      <div className="w-full max-w-2xl mx-auto pt-8">
        <div className="flex justify-between items-center mb-6">
          {/* Back to Dashboard Button (now on left, icon-only) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="w-10 h-10 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                onClick={() => {
                  navigate('/dashboard', { replace: true }); // Added replace: true
                }}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Back to Dashboard
            </TooltipContent>
          </Tooltip>
          {/* Your Messages Title (now on right) */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Your Messages</h1>
        </div>

        <Tabs defaultValue="inbox" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="inbox">
              <Mail className="w-4 h-4 mr-2" /> Inbox ({receivedMessages.length})
            </TabsTrigger>
            <TabsTrigger value="outbox">
              <Send className="w-4 h-4 mr-2" /> Outbox ({sentMessages.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="inbox">
            <Card className="bg-white/30 dark:bg-gray-800/30 shadow-lg backdrop-blur-sm border border-white/30 dark:border-gray-600/30">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Received Messages</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                {receivedMessages.length > 0 ? (
                  <ul className="space-y-4"> {/* Changed space-y-2 to space-y-4 */}
                    {receivedMessages.map((message) => (
                      <li key={message.id} className={cn("relative border-b pb-2 last:border-b-0 max-w-2xl mx-auto p-2 rounded-xl", getMessageTypeClasses(message.message_type))}>
                        <Link to={`/messages/${message.id}`} className="block hover:bg-opacity-80 rounded-md transition-colors flex items-center gap-3">
                          {/* Emoji positioned above avatar */}
                          <span className={cn(
                            "absolute -top-4 -left-4 text-2xl z-10 w-10 h-10 flex items-center justify-center rounded-full shadow-md", // Emoji position
                            getMessageTypeEmojiBackgroundClasses(message.message_type)
                          )}>
                            {getMessageTypeEmoji(message.message_type)}
                          </span>
                          <Avatar className="w-12 h-12 ml-8"> {/* Adjusted ml-12 to ml-8 */}
                            <AvatarImage src={message.senderProfile?.avatar_url || ''} alt="Sender Avatar" />
                            <AvatarFallback>{message.senderProfile?.username?.charAt(0).toUpperCase() || message.senderProfile?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold text-lg text-gray-900 dark:text-white mb-1 flex items-center justify-between gap-2">
                              <span className="flex items-center gap-2">
                                <MessageSquare className="w-5 h-5" />
                                {message.subject}
                              </span>
                              <span className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                                {message.is_read ? null : <span className="text-xs font-bold text-blue-600 dark:text-blue-400">NEW!</span>}
                                {message.status === 'closed' && (
                                  <Badge variant="secondary" className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200">Closed</Badge>
                                )}
                              </span>
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                              {message.content}
                            </p>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {formatDateTimeForMessageView(message.created_at)}
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No messages received yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="outbox">
            <Card className="bg-white/30 dark:bg-gray-800/30 shadow-lg backdrop-blur-sm border border-white/30 dark:border-gray-600/30">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Sent Messages</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                {sentMessages.length > 0 ? (
                  <ul className="space-y-4"> {/* Changed space-y-2 to space-y-4 */}
                    {sentMessages.map((message) => (
                      <li key={message.id} className={cn("relative border-b pb-2 last:border-b-0 max-w-2xl mx-auto p-2 rounded-xl", getMessageTypeClasses(message.message_type))}>
                        <Link to={`/messages/${message.id}`} className="block hover:bg-opacity-80 rounded-md transition-colors flex items-center gap-3">
                          {/* Emoji positioned above avatar */}
                          <span className={cn(
                            "absolute -top-4 -left-4 text-2xl z-10 w-10 h-10 flex items-center justify-center rounded-full shadow-md", // Emoji position
                            getMessageTypeEmojiBackgroundClasses(message.message_type)
                          )}>
                            {getMessageTypeEmoji(message.message_type)}
                          </span>
                          <Avatar className="w-12 h-12 ml-8"> {/* Adjusted ml-12 to ml-8 */}
                            <AvatarImage src={message.receiverProfile?.avatar_url || ''} alt="Receiver Avatar" />
                            <AvatarFallback>{message.receiverProfile?.username?.charAt(0).toUpperCase() || message.receiverProfile?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold text-lg text-gray-900 dark:text-white mb-1 flex items-center justify-between gap-2">
                              <span className="flex items-center gap-2">
                                <MessageSquare className="w-5 h-5" />
                                {message.subject}
                              </span>
                              <span className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                                {message.read_at && (
                                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                    <CheckCheck className="w-4 h-4" /> Read
                                  </span>
                                )}
                                {message.status === 'closed' && (
                                  <Badge variant="secondary" className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200">Closed</Badge>
                                )}
                              </span>
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                              {message.content}
                            </p>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {formatDateTimeForMessageView(message.created_at)}
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No messages sent yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </BackgroundWrapper>
  );
};

export default Messages;