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
import AppBackground from '@/components/AppBackground'; // Import AppBackground

const Messages = () => {
  const { user, loading: sessionLoading } = useSession();
  const navigate = useNavigate();
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [receivedMessages, setReceivedMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [profilesMap, setProfilesMap] = useState<Map<string, Profile>>(new Map());

  console.log('Messages Component: Rendered. sessionLoading:', sessionLoading, 'messagesLoading:', messagesLoading);
  console.log('Messages Component: Current user:', user?.id);

  // Helper to fetch a single profile if not already in map
  const getOrFetchProfile = async (profileId: string) => {
    if (profilesMap.has(profileId)) {
      console.log('Messages: Profile found in map for ID:', profileId);
      return profilesMap.get(profileId);
    }
    console.log('Messages: Fetching profile by ID:', profileId);
    const profile = await fetchProfileById(profileId);
    if (profile) {
      setProfilesMap(prev => new Map(prev).set(profileId, profile));
      console.log('Messages: Profile fetched and added to map:', profile);
    } else {
      console.log('Messages: Profile not found for ID:', profileId);
    }
    return profile;
  };

  useEffect(() => {
    const fetchAllMessagesAndProfiles = async () => {
      if (!user) {
        setMessagesLoading(false); // Set loading to false if no user
        console.log('Messages: No user session, skipping message fetch.');
        return;
      }

      setMessagesLoading(true); // Set loading to true at the start of fetch
      console.log('Messages: Fetching all messages for user ID:', user.id);
      try {
        // Fetch all sent messages that are NOT replies (parent_message_id is null)
        const { data: sentData, error: sentError } = await supabase
          .from('messages')
          .select('*') // Select all columns, including 'status'
          .eq('sender_id', user.id)
          .is('parent_message_id', null) // Only top-level messages
          .order('created_at', { ascending: false });

        if (sentError) {
          console.error('Messages: Supabase Error fetching sent messages:', sentError.message, sentError);
          toast.error('Failed to load sent messages: ' + sentError.message);
        } else {
          console.log('Messages: Raw sent messages data from initial fetch:', sentData);
        }

        // Fetch all received messages that are NOT replies (parent_message_id is null)
        const { data: receivedData, error: receivedError } = await supabase
          .from('messages')
          .select('*') // Select all columns, including 'status'
          .eq('receiver_id', user.id)
          .is('parent_message_id', null) // Only top-level messages
          .order('created_at', { ascending: false });

        if (receivedError) {
          console.error('Messages: Supabase Error fetching received messages:', receivedError.message, receivedError);
          toast.error('Failed to load received messages: ' + receivedError.message);
        } else {
          console.log('Messages: Raw received messages data from initial fetch:', receivedData);
        }

        const allRelatedUserIds = new Set<string>();
        sentData?.forEach(msg => allRelatedUserIds.add(msg.receiver_id));
        receivedData?.forEach(msg => allRelatedUserIds.add(msg.sender_id));
        allRelatedUserIds.add(user.id); // Include current user's ID for their own profile if needed

        console.log('Messages: Fetching profiles for related user IDs:', Array.from(allRelatedUserIds));
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
        console.log('Messages: Initial profiles map created:', initialProfilesMap);

        const combinedSentMessages = sentData?.map(msg => ({
          ...msg,
          receiverProfile: initialProfilesMap.get(msg.receiver_id) || null,
        })) || [];
        console.log('Messages: Combined sent messages after initial fetch:', combinedSentMessages);

        const combinedReceivedMessages = receivedData?.map(msg => ({
          ...msg,
          senderProfile: initialProfilesMap.get(msg.sender_id) || null,
        })) || [];
        console.log('Messages: Combined received messages after initial fetch:', combinedReceivedMessages);

        setSentMessages(combinedSentMessages);
        setReceivedMessages(combinedReceivedMessages);

      } catch (error: any) {
        console.error('Messages: Unexpected error fetching messages:', error.message, error);
        toast.error('An unexpected error occurred while loading messages.');
      } finally {
        setMessagesLoading(false);
        console.log('Messages: Message fetching completed. messagesLoading set to false.');
      }
    };

    if (!sessionLoading && user) {
      fetchAllMessagesAndProfiles();
    } else if (!sessionLoading && !user) {
      console.log('Messages: User not authenticated, navigating to login.');
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
          console.log('Messages: Realtime message payload:', payload);
          const newMessage = payload.new as Message;

          // Only process top-level messages for the main list
          if (newMessage.parent_message_id !== null) {
            console.log('Realtime: Skipping reply message for main list:', newMessage);
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
              console.log('Realtime: Adding new RECEIVED message to state:', messageWithProfiles);
              setReceivedMessages(prev => {
                const newState = [messageWithProfiles, ...prev];
                console.log('Realtime: New receivedMessages state:', newState);
                return newState;
              });
              toast.info(`New message from ${senderProfile?.username || senderProfile?.email || 'Your Partner'}!`);
            } else if (newMessage.sender_id === user?.id) {
              console.log('Realtime: Adding new SENT message to state:', messageWithProfiles);
              setSentMessages(prev => {
                const newState = [messageWithProfiles, ...prev];
                console.log('Realtime: New sentMessages state:', newState);
                return newState;
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            console.log('Realtime: Updating message in state:', newMessage);
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
      console.log('Messages: Unsubscribing from messages_channel.');
      supabase.removeChannel(channel);
    };
  }, [user, sessionLoading, navigate]);

  console.log('Messages Component: State before rendering JSX - sentMessages:', sentMessages.length, 'receivedMessages:', receivedMessages.length);

  if (sessionLoading || messagesLoading) {
    console.log('Messages Component: Displaying loading state.');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-950 text-foreground">
        <p className="text-xl">Loading messages...</p>
      </div>
    );
  }

  if (!user) {
    console.log('Messages Component: User not found, navigating to login.');
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

  return (
    <AppBackground className="justify-start items-start">
      <div className="w-full max-w-2xl mx-auto pt-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Your Messages</h1>
          <Link to="/dashboard">
            <Button variant="outline" className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">
              <ArrowLeft className="w-5 h-5 mr-2" /> Back to Dashboard
            </Button>
          </Link>
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
                  <ul className="space-y-2">
                    {receivedMessages.map((message) => (
                      <li key={message.id} className={cn("border-b pb-2 last:border-b-0 max-w-2xl mx-auto p-2 rounded-xl", getMessageTypeClasses(message.message_type))}>
                        <Link to={`/messages/${message.id}`} className="block hover:bg-opacity-80 rounded-md transition-colors flex items-center gap-3">
                          <Avatar className="w-12 h-12">
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
                  <ul className="space-y-2">
                    {sentMessages.map((message) => (
                      <li key={message.id} className={cn("border-b pb-2 last:border-b-0 max-w-2xl mx-auto p-2 rounded-xl", getMessageTypeClasses(message.message_type))}>
                        <Link to={`/messages/${message.id}`} className="block hover:bg-opacity-80 rounded-md transition-colors flex items-center gap-3">
                          <Avatar className="w-12 h-12">
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
    </AppBackground>
  );
};

export default Messages;