import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Mail, Send, MessageSquare, Tag, Zap, Smile, User, ArrowLeft, CheckCheck } from 'lucide-react'; // Added CheckCheck icon

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
  read_at: string | null; // Added read_at
  senderProfile?: Profile | null;
  receiverProfile?: Profile | null;
}

// Removed MessagesProps interface as messagesRefreshKey is no longer a prop
const Messages = () => {
  const { user, loading: sessionLoading } = useSession();
  const navigate = useNavigate();
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [receivedMessages, setReceivedMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [profilesMap, setProfilesMap] = useState<Map<string, Profile>>(new Map());
  // Removed local refreshTrigger as it's now handled by parent component

  // Helper to fetch a single profile if not already in map
  const fetchProfile = async (profileId: string) => {
    if (profilesMap.has(profileId)) {
      return profilesMap.get(profileId);
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, email') // Now selecting 'id' to match Profile interface
        .eq('id', profileId)
        .single();
      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Supabase Error fetching sender profile:', error.message, error);
        return null;
      }
      if (data) {
        setProfilesMap(prev => new Map(prev).set(profileId, data));
        return data;
      }
      return null;
    } catch (error: any) {
      console.error('Unexpected error fetching profile:', error.message, error);
      return null;
    }
  };

  // Removed handleRefreshMessages as it's now handled by parent component

  useEffect(() => {
    console.log('Messages component useEffect triggered. Fetching data...'); // Added for debugging
    const fetchAllMessagesAndProfiles = async () => {
      if (!user) {
        setMessagesLoading(false); // Set loading to false if no user
        return;
      }

      setMessagesLoading(true); // Set loading to true at the start of fetch
      try {
        // Fetch all sent messages
        const { data: sentData, error: sentError } = await supabase
          .from('messages')
          .select('*') // Select all columns from messages, no direct join here
          .eq('sender_id', user.id)
          .order('created_at', { ascending: false });

        if (sentError) {
          console.error('Supabase Error fetching sent messages:', sentError.message, sentError);
          toast.error('Failed to load sent messages: ' + sentError.message);
        }

        // Fetch all received messages
        const { data: receivedData, error: receivedError } = await supabase
          .from('messages')
          .select('*') // Select all columns from messages, no direct join here
          .eq('receiver_id', user.id)
          .order('created_at', { ascending: false });

        if (receivedError) {
          console.error('Supabase Error fetching received messages:', receivedError.message, receivedError);
          toast.error('Failed to load received messages: ' + receivedError.message);
        }

        const allRelatedUserIds = new Set<string>();
        sentData?.forEach(msg => allRelatedUserIds.add(msg.receiver_id));
        receivedData?.forEach(msg => allRelatedUserIds.add(msg.sender_id));
        allRelatedUserIds.add(user.id);

        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, email')
          .in('id', Array.from(allRelatedUserIds));

        if (profilesError) {
          console.error('Supabase Error fetching profiles for messages:', profilesError.message, profilesError);
          toast.error('Failed to load associated profiles: ' + profilesError.message);
          return;
        }

        const initialProfilesMap = new Map<string, Profile>();
        profilesData?.forEach(profile => {
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
        console.error('Unexpected error fetching messages:', error.message, error);
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
          console.log('Realtime message payload:', payload);
          const newMessage = payload.new as Message;

          if (payload.eventType === 'INSERT') {
            const senderProfile = await fetchProfile(newMessage.sender_id);
            const receiverProfile = await fetchProfile(newMessage.receiver_id);

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
            // Update existing messages with new data, especially read_at
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
  }, [user, sessionLoading, navigate, fetchProfile]); // Removed messagesRefreshKey from dependencies

  if (sessionLoading || messagesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-950 text-foreground">
        <p className="text-xl">Loading messages...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-950 text-foreground p-4 pt-20">
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Your Messages</h1>
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
            <Card className="bg-white dark:bg-gray-800 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Received Messages</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                {receivedMessages.length > 0 ? (
                  <ul className="space-y-4">
                    {receivedMessages.map((message) => (
                      <li key={message.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
                        <Link to={`/messages/${message.id}`} className="block hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-md transition-colors">
                          <p className="font-semibold text-lg text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" /> Subject: {message.subject}
                            {message.is_read ? null : <span className="ml-2 text-xs font-bold text-blue-600 dark:text-blue-400">NEW!</span>}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                            <User className="w-4 h-4" /> From: {message.senderProfile?.username || message.senderProfile?.email || 'Unknown Sender'} | Received: {new Date(message.created_at).toLocaleString()}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {message.message_type}</span>
                            <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {message.priority}</span>
                            <span className="flex items-center gap-1"><Smile className="w-3 h-3" /> {message.mood}</span>
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
            <Card className="bg-white dark:bg-gray-800 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white">Sent Messages</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground">
                {sentMessages.length > 0 ? (
                  <ul className="space-y-4">
                    {sentMessages.map((message) => (
                      <li key={message.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
                        <Link to={`/messages/${message.id}`} className="block hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-md transition-colors">
                          <p className="font-semibold text-lg text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" /> Subject: {message.subject}
                            {message.read_at && (
                              <span className="ml-2 text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                <CheckCheck className="w-4 h-4" /> Read
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
                            <Mail className="w-4 h-4" /> To: {message.receiverProfile?.username || message.receiverProfile?.email || 'Unknown Partner'} | Sent: {new Date(message.created_at).toLocaleString()}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {message.message_type}</span>
                            <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {message.priority}</span>
                            <span className="flex items-center gap-1"><Smile className="w-3 h-3" /> {message.mood}</span>
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
    </div>
  );
};

export default Messages;