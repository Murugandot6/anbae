import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Settings, MessageSquare, Inbox, Heart, Menu } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import ClearMessagesDialog from '@/components/ClearMessagesDialog';
import { ThemeToggle } from "@/components/ThemeToggle";
import BackgroundWrapper from '@/components/BackgroundWrapper';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatMessageDate } from '@/lib/utils';
import { Profile, Message } from '@/types/supabase';
import CircularProgressAvatar from '@/components/CircularProgressAvatar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import Sidebar from '@/components/Sidebar';
import MessageTimeline from '@/components/MessageTimeline';
import { Badge } from '@/components/ui/badge';

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
              console.log('Dashboard: Partner lifetime score:', partnerData.lifetime_score);
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
        // Fetch all top-level messages (not replies) for the current user, both sent and received
        const { data: allTopLevelMessages, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .is('parent_message_id', null)
          .order('created_at', { ascending: false });

        if (messagesError) {
          console.error('Dashboard: Supabase Error fetching all top-level messages:', messagesError.message, messagesError);
          toast.error('Failed to load messages: ' + messagesError.message);
          setMessagesLoading(false);
          return;
        }

        const sent = allTopLevelMessages?.filter(msg => msg.sender_id === user.id) || [];
        const received = allTopLevelMessages?.filter(msg => msg.receiver_id === user.id) || [];

        const allRelatedUserIds = new Set<string>();
        sent.forEach(msg => allRelatedUserIds.add(msg.receiver_id));
        received.forEach(msg => allRelatedUserIds.add(msg.sender_id));
        allRelatedUserIds.add(user.id);

        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, email, avatar_url, lifetime_score')
          .in('id', Array.from(allRelatedUserIds));

        if (profilesError) {
          console.error('Dashboard: Supabase Error fetching profiles for messages:', profilesError.message, profilesError);
          toast.error('Failed to load associated profiles: ' + profilesError.message);
          setMessagesLoading(false);
          return;
        }

        const profilesMap = new Map<string, Profile>();
        profilesData?.forEach(profile => {
          profilesMap.set(profile.id, profile);
        });

        const combinedSentMessages = sent.map(msg => ({
          ...msg,
          receiverProfile: profilesMap.get(msg.receiver_id) || null,
        }));

        const combinedReceivedMessages = received.map(msg => ({
          ...msg,
          senderProfile: profilesMap.get(msg.sender_id) || null,
        }));

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
    <BackgroundWrapper className="pt-0 md:pt-0">
      <div className="flex min-h-screen w-full">
        {!isMobile && (
          <Sidebar
            currentUserProfile={currentUserProfile}
            partnerProfile={partnerProfile}
            user={user}
            handleLogout={handleLogout}
            onMessagesCleared={() => setRefreshMessagesTrigger(prev => prev + 1)}
          />
        )}

        <div className="flex-1 flex flex-col items-center p-4 md:p-8 relative md:ml-64">
          {isMobile && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="absolute top-4 left-4 z-10 w-10 h-10 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border-r border-white/30 dark:border-gray-600/30 p-4 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  {user && (
                    <ClearMessagesDialog
                      partnerId={partnerProfile?.id || null}
                      partnerNickname={partnerProfile?.username || currentUserProfile?.partner_nickname || null}
                      currentUserId={user.id}
                      onMessagesCleared={() => setRefreshMessagesTrigger(prev => prev + 1)}
                    />
                  )}
                  <ThemeToggle />
                </div>
                <div className="flex items-center gap-3 mb-6">
                  <Avatar className="w-16 h-16 border-2 border-blue-500 dark:border-purple-400">
                    <AvatarImage src={currentUserProfile?.avatar_url || user.user_metadata.avatar_url || ''} alt="Your Avatar" />
                    <AvatarFallback>{user.user_metadata.nickname?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'Y'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-lg text-gray-900 dark:text-white">{user.user_metadata.nickname || user.email}</p>
                    <p className="text-base font-semibold text-gray-700 dark:text-gray-300">Lifetime Score: {currentUserProfile?.lifetime_score !== undefined && currentUserProfile?.lifetime_score !== null ? currentUserProfile.lifetime_score : 'N/A'}</p>
                  </div>
                </div >
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
                  <Button onClick={handleLogout} variant="destructive" className="w-full justify-start">
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

            {/* Flex container for profiles and heart - now always a row */}
            <div className="flex items-center justify-center gap-4 mb-8 flex-wrap"> {/* Added flex-wrap for smaller screens if needed */}
              <div className="flex flex-col items-center text-center p-4 rounded-xl">
                <div className="relative mb-4">
                  <CircularProgressAvatar
                    score={currentUserProfile?.lifetime_score ?? 100}
                    avatarUrl={currentUserProfile?.avatar_url || user.user_metadata.avatar_url || ''}
                    fallbackText={user.user_metadata.nickname?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'Y'}
                    altText="Your Avatar"
                    size="md"
                  />
                  {currentUserProfile?.lifetime_score !== undefined && currentUserProfile?.lifetime_score !== null && (
                    <Badge className="absolute top-0 left-0 transform translate-x-3/4 translate-y-3/4 bg-blue-500 text-white dark:bg-blue-700 dark:text-white px-3 py-1 rounded-full text-sm font-bold shadow-md">
                      I
                    </Badge>
                  )}
                </div>
                <p className="font-semibold text-lg text-gray-900 dark:text-white">
                  {user.user_metadata.nickname || user.email}
                </p>
                <p className="text-base font-semibold text-gray-700 dark:text-gray-300">
                  Lifetime Score: {currentUserProfile?.lifetime_score !== undefined && currentUserProfile?.lifetime_score !== null ? currentUserProfile.lifetime_score : 'N/A'}
                </p>
              </div>

              {/* Heart icon in between */}
              <div className="flex-shrink-0">
                <Heart className="w-12 h-12 text-pink-500 dark:text-purple-400" />
              </div>

              <div className="flex flex-col items-center text-center p-4 rounded-xl">
                {partnerProfile ? (
                  <>
                    <div className="relative mb-4">
                      <CircularProgressAvatar
                        score={partnerProfile.lifetime_score ?? 100}
                        avatarUrl={partnerProfile.avatar_url}
                        fallbackText={partnerProfile.username?.charAt(0).toUpperCase() || partnerProfile.email?.charAt(0).toUpperCase() || 'P'}
                        altText="Partner Avatar"
                        size="md"
                      />
                      {partnerProfile.lifetime_score !== undefined && partnerProfile.lifetime_score !== null && (
                        <Badge className="absolute bottom-0 right-0 transform -translate-x-1/4 -translate-y-1/4 bg-blue-500 text-white dark:bg-blue-700 dark:text-white px-3 py-1 rounded-full text-sm font-bold shadow-md">
                          U
                        </Badge>
                      )}
                    </div>
                    <p className="font-semibold text-lg text-gray-900 dark:text-white">
                      {partnerProfile.username || partnerProfile.email}
                    </p>
                    <p className="text-base font-semibold text-gray-700 dark:text-gray-300">
                      Lifetime Score: {partnerProfile.lifetime_score !== undefined && partnerProfile.lifetime_score !== null ? partnerProfile.lifetime_score : 'N/A'}
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground text-base">No partner profile linked or found.</p>
                )}
              </div>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">Recent Messages</h2>
            {user && (
              <MessageTimeline
                sentMessages={sentMessages}
                receivedMessages={receivedMessages}
                currentUserId={user.id}
                currentUserProfile={currentUserProfile}
                partnerProfile={partnerProfile}
              />
            )}
          </div>
        </div>
      </div>
    </BackgroundWrapper>
  );
};

export default Dashboard;