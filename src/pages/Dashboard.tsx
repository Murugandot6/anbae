import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Settings, MessageSquare, Inbox, Heart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import ClearMessagesDialog from '@/components/ClearMessagesDialog';
import { ThemeToggle } from "@/components/ThemeToggle";

interface Profile {
  id: string;
  username: string | null;
  email: string | null;
  partner_email?: string | null;
  partner_nickname?: string | null;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  subject: string;
  content: string;
  created_at: string;
  is_read: boolean;
  senderProfile?: Profile | null;
  receiverProfile?: Profile | null;
}

const Dashboard = () => {
  const { user, loading: sessionLoading } = useSession();
  const navigate = useNavigate();
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [receivedMessages, setReceivedMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<Profile | null>(null);
  const [fetchingProfiles, setFetchingProfiles] = useState(true);
  const [refreshMessagesTrigger, setRefreshMessagesTrigger] = useState(0);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase Logout error:', error.message, error);
        toast.error('Failed to log out: ' + error.message);
      } else {
        toast.success('Logged out successfully!');
        navigate('/login');
      }
    } catch (error: any) {
      console.error('Unexpected logout error:', error.message, error);
      toast.error('An unexpected error occurred during logout.');
    }
  };

  useEffect(() => {
    const fetchUserAndPartnerProfiles = async () => {
      if (!user) {
        setFetchingProfiles(false);
        return;
      }

      console.log('Dashboard: Fetching current user profile for user ID:', user.id);
      try {
        // Fetch current user's profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, email, partner_email, partner_nickname')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows found
          console.error('Dashboard: Supabase Error fetching current user profile:', profileError.message, profileError);
          toast.error('Failed to load your profile: ' + profileError.message);
        } else if (profileData) {
          console.log('Dashboard: Current user profile fetched:', profileData);
          setCurrentUserProfile(profileData);
          // Now fetch partner's profile using partner_email from current user's profile
          if (profileData.partner_email) {
            console.log('Dashboard: Attempting to fetch partner profile for email:', profileData.partner_email);
            const { data: partnerData, error: partnerError } = await supabase
              .from('profiles')
              .select('id, username, email')
              .eq('email', profileData.partner_email)
              .single();

            if (partnerError && partnerError.code !== 'PGRST116') {
              console.error('Dashboard: Supabase Error fetching partner profile:', partnerError.message, partnerError);
              toast.error('Failed to load partner profile: ' + partnerError.message);
            } else if (partnerData) {
              console.log('Dashboard: Partner profile fetched:', partnerData);
              setPartnerProfile(partnerData);
            } else {
              console.log('Dashboard: Partner profile not found for email:', profileData.partner_email);
              setPartnerProfile(null); // Explicitly set to null if not found
            }
          } else {
            console.log('Dashboard: Current user does not have a partner email set.');
            setPartnerProfile(null); // No partner email set
          }
        } else {
          console.log('Dashboard: Current user profile not found for ID:', user.id);
          setCurrentUserProfile(null);
        }
      } catch (error: any) {
        console.error('Dashboard: Unexpected error fetching user/partner profiles:', error.message, error);
        toast.error('An unexpected error occurred while loading profiles.');
      } finally {
        setFetchingProfiles(false);
      }
    };

    if (!sessionLoading && user) {
      fetchUserAndPartnerProfiles();
    }
  }, [user, sessionLoading]);


  useEffect(() => {
    const fetchMessagesAndProfiles = async () => {
      if (!user) {
        setMessagesLoading(false); // Set loading to false if no user
        return;
      }

      setMessagesLoading(true); // Set loading to true at the start of fetch
      try {
        // Fetch latest 3 sent messages (only top-level messages)
        console.log('Dashboard: Fetching sent messages for user ID:', user.id);
        const { data: sentData, error: sentError } = await supabase
          .from('messages')
          .select('*') // Select all columns from messages
          .eq('sender_id', user.id)
          .is('parent_message_id', null) // Filter out replies
          .order('created_at', { ascending: false })
          .limit(3);

        if (sentError) {
          console.error('Dashboard: Supabase Error fetching sent messages:', sentError.message, sentError);
          toast.error('Failed to load sent messages: ' + sentError.message);
        } else {
          console.log('Dashboard: Sent messages data:', sentData);
        }

        // Fetch latest 3 received messages (only top-level messages)
        console.log('Dashboard: Fetching received messages for user ID:', user.id);
        const { data: receivedData, error: receivedError } = await supabase
          .from('messages')
          .select('*') // Select all columns from messages
          .eq('receiver_id', user.id)
          .is('parent_message_id', null) // Filter out replies
          .order('created_at', { ascending: false })
          .limit(3);

        if (receivedError) {
          console.error('Dashboard: Supabase Error fetching received messages:', receivedError.message, receivedError);
          toast.error('Failed to load received messages: ' + receivedError.message);
        } else {
          console.log('Dashboard: Received messages data:', receivedData);
        }

        const allRelatedUserIds = new Set<string>();
        sentData?.forEach(msg => allRelatedUserIds.add(msg.receiver_id));
        receivedData?.forEach(msg => allRelatedUserIds.add(msg.sender_id));
        allRelatedUserIds.add(user.id); // Include current user's ID for their own profile if needed

        console.log('Dashboard: Fetching profiles for related user IDs:', Array.from(allRelatedUserIds));
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, email')
          .in('id', Array.from(allRelatedUserIds));

        if (profilesError) {
          console.error('Dashboard: Supabase Error fetching profiles for messages:', profilesError.message, profilesError);
          toast.error('Failed to load associated profiles: ' + profilesError.message);
          return;
        } else {
          console.log('Dashboard: Profiles data for messages:', profilesData);
        }

        const profilesMap = new Map<string, Profile>();
        profilesData?.forEach(profile => {
          profilesMap.set(profile.id, profile);
        });

        const combinedSentMessages = sentData?.map(msg => ({
          ...msg,
          receiverProfile: profilesMap.get(msg.receiver_id) || null,
        })) || [];

        const combinedReceivedMessages = receivedData?.map(msg => ({
          ...msg,
          senderProfile: profilesMap.get(msg.sender_id) || null,
        })) || [];

        setSentMessages(combinedSentMessages);
        setReceivedMessages(combinedReceivedMessages);

      } catch (error: any) {
        console.error('Dashboard: Unexpected error fetching messages:', error.message, error);
        toast.error('An unexpected error occurred while loading messages.');
      } finally {
        setMessagesLoading(false);
      }
    };

    if (!sessionLoading && user) {
      fetchMessagesAndProfiles();
    }
  }, [user, sessionLoading, refreshMessagesTrigger]);

  if (sessionLoading || fetchingProfiles || messagesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-950 text-foreground">
        <p className="text-xl">Loading user session and profiles...</p>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4 pt-20 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-950 text-foreground relative">
      <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-4xl mx-auto">
          {/* Horizontal container for action icons */}
          <div className="flex flex-wrap justify-center sm:justify-start gap-4 mb-8">
            <Link to="/send-message">
              <Button variant="outline" size="icon" className="w-10 h-10 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                <MessageSquare className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/messages">
              <Button variant="outline" size="icon" className="w-10 h-10 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                <Inbox className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/edit-profile">
              <Button variant="outline" size="icon" className="w-10 h-10 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
            <Button onClick={handleLogout} size="icon" className="w-10 h-10 bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-800 rounded-full">
              <LogOut className="w-5 h-5" />
            </Button>
            {user && (
              <ClearMessagesDialog
                partnerId={partnerProfile?.id || null}
                partnerNickname={partnerProfile?.username || currentUserProfile?.partner_nickname || null}
                currentUserId={user.id}
                onMessagesCleared={() => setRefreshMessagesTrigger(prev => prev + 1)}
              />
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 sm:gap-0">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white text-center sm:text-left">Welcome, {user.user_metadata.nickname || user.email}!</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-white dark:bg-gray-800 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white text-xl flex items-center gap-2">
                  <Heart className="w-6 h-6 text-pink-600 dark:text-purple-400" /> Your Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-base">
                <p><strong>Nickname:</strong> {user.user_metadata.nickname || 'Not set'}</p>
                <p><strong>Email:</strong> {user.email}</p>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-gray-800 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white text-xl flex items-center gap-2">
                  <Heart className="w-6 h-6 text-pink-600 dark:text-purple-400" /> Partner Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-base">
                <p><strong>Partner Email:</strong> {user.user_metadata.partner_email || 'Not set'}</p>
                <p><strong>Partner Alias:</strong> {user.user_metadata.partner_nickname || 'Not set'}</p>
              </CardContent>
            </Card>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">Recent Messages</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white dark:bg-gray-800 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white text-xl">Outbox ({sentMessages.length})</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-base">
                {sentMessages.length > 0 ? (
                  <ul className="space-y-2">
                    {sentMessages.map((message, index) => (
                      <li
                        key={message.id}
                        className={`border-b border-gray-200 dark:border-gray-700 pb-2 last:border-b-0 ${
                          index === 0 ? 'bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700 p-2 rounded-md' : ''
                        }`}
                      >
                        <Link to={`/messages/${message.id}`} className="block hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-md transition-colors">
                          <p className="font-semibold text-gray-900 dark:text-white text-lg">Subject: {message.subject}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            To: {message.receiverProfile?.username || message.receiverProfile?.email || 'Unknown Partner'} | Sent: {new Date(message.created_at).toLocaleString()}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No messages sent yet.</p>
                )}
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-gray-800 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-white text-xl">Inbox ({receivedMessages.length})</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-base">
                {receivedMessages.length > 0 ? (
                  <ul className="space-y-2">
                    {receivedMessages.map((message, index) => (
                      <li
                        key={message.id}
                        className={`border-b border-gray-20:0 dark:border-gray-700 pb-2 last:border-b-0 ${
                          index === 0 ? 'bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700 p-2 rounded-md' : ''
                        }`}
                      >
                        <Link to={`/messages/${message.id}`} className="block hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-md transition-colors">
                          <p className="font-semibold text-gray-900 dark:text-white text-lg">Subject: {message.subject}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            From: {message.senderProfile?.username || message.senderProfile?.email || 'Unknown Sender'} | Received: {new Date(message.created_at).toLocaleString()}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No messages received yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
    </div>
  );
};

export default Dashboard;