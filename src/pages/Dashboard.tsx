import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Settings, MessageSquare, Inbox, Heart, Menu } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import ClearMessagesDialog from '@/components/ClearMessagesDialog';
import { ThemeToggle } from "@/components/ThemeToggle";
import AppBackground from '@/components/AppBackground';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatMessageDate } from '@/lib/utils';
import { Profile, Message } from '@/types/supabase';
import CircularProgressAvatar from '@/components/CircularProgressAvatar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import Sidebar from '@/components/Sidebar'; // Import the new Sidebar component

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
  const isMobile = useIsMobile();

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
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, email, partner_email, partner_nickname, avatar_url, lifetime_score')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Dashboard: Supabase Error fetching current user profile:', profileError.message, profileError);
          toast.error('Failed to load your profile: ' + profileError.message);
        } else if (profileData) {
          console.log('Dashboard: Current user profile fetched:', profileData);
          setCurrentUserProfile(profileData);
          if (profileData.partner_email) {
            console.log('Dashboard: Attempting to fetch partner profile for email:', profileData.partner_email);
            const { data: partnerData, error: partnerError } = await supabase
              .from('profiles')
              .select('id, username, email, avatar_url, lifetime_score')
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
              setPartnerProfile(null);
            }
          } else {
            console.log('Dashboard: Current user does not have a partner email set.');
            setPartnerProfile(null);
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
          .order('created_at', { ascending: false })
          .limit(3);

        if (sentError) {
          console.error('Dashboard: Supabase Error fetching sent messages:', sentError.message, sentError);
          toast.error('Failed to load sent messages: ' + sentError.message);
        }

        const { data: receivedData, error: receivedError } = await supabase
          .from('messages')
          .select('*')
          .eq('receiver_id', user.id)
          .is('parent_message_id', null)
          .order('created_at', { ascending: false })
          .limit(3);

        if (receivedError) {
          console.error('Dashboard: Supabase Error fetching received messages:', receivedError.message, receivedError);
          toast.error('Failed to load received messages: ' + receivedError.message);
        }

        const allRelatedUserIds = new Set<string>();
        sentData?.forEach(msg => allRelatedUserIds.add(msg.receiver_id));
        receivedData?.forEach(msg => allRelatedUserIds.add(msg.sender_id));
        allRelatedUserIds.add(user.id);

        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, email, avatar_url, lifetime_score')
          .in('id', Array.from(allRelatedUserIds));

        if (profilesError) {
          console.error('Dashboard: Supabase Error fetching profiles for messages:', profilesError.message, profilesError);
          toast.error('Failed to load associated profiles: ' + profilesError.message);
          return;
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
    <AppBackground className="pt-0 md:pt-0"> {/* Adjust padding for desktop sidebar */}
      <div className="flex min-h-screen w-full"> {/* Flex container for sidebar and main content */}
        {!isMobile && (
          <Sidebar
            currentUserProfile={currentUserProfile}
            partnerProfile={partnerProfile}
            user={user}
            handleLogout={handleLogout}
            onMessagesCleared={() => setRefreshMessagesTrigger(prev => prev + 1)}
          />
        )}

        <div className="flex-1 flex flex-col items-center p-4 md:p-8 relative md:ml-64"> {/* Main content area */}
          {/* Removed the ThemeToggle from here */}

          {isMobile && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="absolute top-4 left-4 z-10 w-10 h-10 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 bg-white/30 dark:bg-gray-800/30 backdrop-blur-md border-r border-white/30 dark:border-gray-600/30 p-4 flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <Avatar className="w-16 h-16 border-2 border-blue-500 dark:border-purple-400">
                    <AvatarImage src={currentUserProfile?.avatar_url || user.user_metadata.avatar_url || ''} alt="Your Avatar" />
                    <AvatarFallback>{user.user_metadata.nickname?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'Y'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-lg text-gray-900 dark:text-white">{user.user_metadata.nickname || user.email}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Lifetime Score: {currentUserProfile?.lifetime_score !== undefined && currentUserProfile?.lifetime_score !== null ? currentUserProfile.lifetime_score : 'N/A'}</p>
                  </div>
                </div>
                <nav className="flex flex-col gap-2 mb-auto">
                  <Link to="/dashboard">
                    <Button variant="ghost" className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Heart className="w-5 h-5 mr-2" /> Dashboard
                    </Button>
                  </Link>
                  <Link to="/send-message">
                    <Button variant="ghost" className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                      <MessageSquare className="w-5 h-5 mr-2" /> Send Message
                    </Button>
                  </Link>
                  <Link to="/messages">
                    <Button variant="ghost" className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Inbox className="w-5 h-5 mr-2" /> Messages
                    </Button>
                  </Link>
                  <Link to="/edit-profile">
                    <Button variant="ghost" className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Settings className="w-5 h-5 mr-2" /> Edit Profile
                    </Button>
                  </Link>
                </nav>
                <div className="mt-auto flex flex-col gap-2">
                  {user && (
                    <ClearMessagesDialog
                      partnerId={partnerProfile?.id || null}
                      partnerNickname={partnerProfile?.username || currentUserProfile?.partner_nickname || null}
                      currentUserId={user.id}
                      onMessagesCleared={() => setRefreshMessagesTrigger(prev => prev + 1)}
                    />
                  )}
                  <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900">
                    <LogOut className="w-5 h-5 mr-2" /> Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          )}

          <div className="w-full max-w-4xl mx-auto animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 sm:gap-0">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white text-center sm:text-left">Welcome, {user.user_metadata.nickname || user.email}!</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card className="bg-white/30 dark:bg-gray-800/30 p-8 rounded-xl shadow-lg backdrop-blur-sm border border-white/30 dark:border-gray-600/30">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white text-xl flex items-center gap-2">
                    <Heart className="w-6 h-6 text-pink-600 dark:text-purple-400" /> Your Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground text-base flex flex-col items-center text-center gap-2">
                  <CircularProgressAvatar
                    score={currentUserProfile?.lifetime_score !== undefined && currentUserProfile?.lifetime_score !== null ? currentUserProfile.lifetime_score : 100}
                    avatarUrl={currentUserProfile?.avatar_url || user.user_metadata.avatar_url || ''}
                    fallbackText={user.user_metadata.nickname?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'Y'}
                    altText="Your Avatar"
                    className="mb-2"
                  />
                  <p className="font-semibold text-lg text-gray-900 dark:text-white">
                    {user.user_metadata.nickname || user.email}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Lifetime Score: {currentUserProfile?.lifetime_score !== undefined && currentUserProfile?.lifetime_score !== null ? currentUserProfile.lifetime_score : 'N/A'}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-white/30 dark:bg-gray-800/30 p-8 rounded-xl shadow-lg backdrop-blur-sm border border-white/30 dark:border-gray-600/30">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white text-xl flex items-center gap-2">
                    <Heart className="w-6 h-6 text-pink-600 dark:text-purple-400" /> Partner Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground text-base flex flex-col items-center text-center gap-2">
                  {partnerProfile ? (
                    <>
                      <CircularProgressAvatar
                        score={partnerProfile.lifetime_score !== undefined && partnerProfile.lifetime_score !== null ? partnerProfile.lifetime_score : 100}
                        avatarUrl={partnerProfile.avatar_url}
                        fallbackText={partnerProfile.username?.charAt(0).toUpperCase() || partnerProfile.email?.charAt(0).toUpperCase() || 'P'}
                        altText="Partner Avatar"
                        className="mb-2"
                      />
                      <p className="font-semibold text-lg text-gray-900 dark:text-white">
                        {partnerProfile.username || partnerProfile.email}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Lifetime Score: {partnerProfile.lifetime_score !== undefined && partnerProfile.lifetime_score !== null ? partnerProfile.lifetime_score : 'N/A'}
                      </p>
                    </>
                  ) : (
                    <p>No partner profile linked or found.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">Recent Messages</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white/30 dark:bg-gray-800/30 p-8 rounded-xl shadow-lg backdrop-blur-sm border border-white/30 dark:border-gray-600/30">
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
                          <Link to={`/messages/${message.id}`} className="block hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-md transition-colors flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={message.receiverProfile?.avatar_url || ''} alt="Receiver Avatar" />
                                <AvatarFallback>{message.receiverProfile?.username?.charAt(0).toUpperCase() || message.receiverProfile?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white text-lg">
                                  {message.receiverProfile?.username || message.receiverProfile?.email || 'Unknown Partner'}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {message.message_type}
                                </p>
                              </div>
                            </div >
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                              {formatMessageDate(message.created_at)}
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
              <Card className="bg-white/30 dark:bg-gray-800/30 p-8 rounded-xl shadow-lg backdrop-blur-sm border border-white/30 dark:border-gray-600/30">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white text-xl">Inbox ({receivedMessages.length})</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground text-base">
                  {receivedMessages.length > 0 ? (
                    <ul className="space-y-2">
                      {receivedMessages.map((message, index) => (
                        <li
                          key={message.id}
                          className={`border-b border-gray-200 dark:border-gray-700 pb-2 last:border-b-0 ${
                            index === 0 ? 'bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700 p-2 rounded-md' : ''
                          }`}
                        >
                          <Link to={`/messages/${message.id}`} className="block hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-md transition-colors flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={message.senderProfile?.avatar_url || ''} alt="Sender Avatar" />
                                <AvatarFallback>{message.senderProfile?.username?.charAt(0).toUpperCase() || message.senderProfile?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white text-lg">
                                  {message.senderProfile?.username || message.senderProfile?.email || 'Unknown Sender'}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {message.message_type}
                                </p>
                              </div>
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
                              {formatMessageDate(message.created_at)}
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
            </div>
          </div>
        </div>
      </div>
    </AppBackground>
  );
};

export default Dashboard;