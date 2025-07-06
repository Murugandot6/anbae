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
import { Button } from '@/components/ui/button';
import MessageTimeline from '@/components/MessageTimeline';
import { Badge } from '@/components/ui/badge';
import ScoreAndMessageCharts from '@/components/ScoreAndMessageCharts';
import Sidebar from '@/components/Sidebar';
import MoodCalendar from '@/components/MoodCalendar';

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
        toast.error('Failed to log out: ' + error.message);
      } else {
        toast.success('Logged out successfully!');
        navigate('/login');
      }
    } catch (error: any) {
      toast.error('An unexpected error occurred during logout.');
    }
  };

  useEffect(() => {
    const fetchUserAndPartnerProfiles = async () => {
      if (!user) {
        setFetchingProfiles(false);
        return;
      }

      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, email, partner_email, partner_nickname, avatar_url, lifetime_score')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          toast.error('Failed to load your profile: ' + profileError.message);
        } else if (profileData) {
          setCurrentUserProfile(profileData);
          if (profileData.partner_email) {
            const { data: partnerData, error: partnerError } = await supabase
              .from('profiles')
              .select('id, username, email, avatar_url, lifetime_score')
              .eq('email', profileData.partner_email)
              .single();

            if (partnerError && partnerError.code !== 'PGRST116') {
              toast.error('Failed to load partner profile: ' + partnerError.message);
            } else if (partnerData) {
              setPartnerProfile(partnerData);
            } else {
              setPartnerProfile(null);
            }
          } else {
            setPartnerProfile(null);
          }
        } else {
          setCurrentUserProfile(null);
        }
      } catch (error: any) {
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
        const { data: allTopLevelMessages, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .is('parent_message_id', null)
          .order('created_at', { ascending: false });

        if (messagesError) {
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-background/80 text-foreground">
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
        <Sidebar
          currentUserProfile={currentUserProfile}
          partnerProfile={partnerProfile}
          user={user}
          handleLogout={handleLogout}
          onMessagesCleared={() => setRefreshMessagesTrigger(prev => prev + 1)}
        />

        <div className="flex-1 flex flex-col items-center p-4 md:p-8 relative">
          <div className="w-full max-w-4xl mx-auto animate-fade-in mt-16 md:mt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 sm:gap-0">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground text-center sm:text-left">Welcome, {user.user_metadata.nickname || user.email}!</h1>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-8">
              {/* Current User Profile Card */}
              <Card className="bg-card/60 backdrop-blur-md border border-border/50 shadow-lg p-6 flex flex-col items-center text-center w-full md:w-1/2 lg:w-1/3 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] rounded-xl">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-xl font-semibold text-foreground">You</CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex flex-col items-center">
                  <div className="relative mb-4">
                    <CircularProgressAvatar
                      score={currentUserProfile?.lifetime_score ?? 100}
                      avatarUrl={currentUserProfile?.avatar_url || user.user_metadata.avatar_url || ''}
                      fallbackText={user.user_metadata.nickname?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'Y'}
                      altText="Your Avatar"
                      size="lg" // Increased size
                    />
                    {currentUserProfile?.lifetime_score !== undefined && currentUserProfile?.lifetime_score !== null && (
                      <Badge className="absolute top-0 left-0 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-bold shadow-md">
                        I
                      </Badge>
                    )}
                  </div>
                  <p className="font-semibold text-lg text-foreground">
                    {user.user_metadata.nickname || user.email}
                  </p>
                  <p className="text-base font-semibold text-muted-foreground">
                    Lifetime Score: {currentUserProfile?.lifetime_score !== undefined && currentUserProfile?.lifetime_score !== null ? currentUserProfile.lifetime_score : 'N/A'}
                  </p>
                </CardContent>
              </Card>

              <div className="flex-shrink-0">
                <Heart className="w-12 h-12 text-primary dark:text-secondary" /> {/* Larger heart icon */}
              </div>

              {/* Partner Profile Card */}
              <Card className="bg-card/60 backdrop-blur-md border border-border/50 shadow-lg p-6 flex flex-col items-center text-center w-full md:w-1/2 lg:w-1/3 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] rounded-xl">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-xl font-semibold text-foreground">Partner</CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex flex-col items-center">
                  {partnerProfile ? (
                    <>
                      <div className="relative mb-4">
                        <CircularProgressAvatar
                          score={partnerProfile.lifetime_score ?? 100}
                          avatarUrl={partnerProfile.avatar_url}
                          fallbackText={partnerProfile.username?.charAt(0).toUpperCase() || partnerProfile.email?.charAt(0).toUpperCase() || 'P'}
                          altText="Partner Avatar"
                          size="lg" // Increased size
                        />
                        {partnerProfile.lifetime_score !== undefined && partnerProfile.lifetime_score !== null && (
                          <Badge className="absolute bottom-0 right-0 transform -translate-x-1/4 -translate-y-1/4 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-bold shadow-md">
                            U
                          </Badge>
                        )}
                      </div>
                      <p className="font-semibold text-lg text-foreground">
                        {partnerProfile.username || partnerProfile.email}
                      </p>
                      <p className="text-base font-semibold text-muted-foreground">
                        Lifetime Score: {partnerProfile.lifetime_score !== undefined && partnerProfile.lifetime_score !== null ? partnerProfile.lifetime_score : 'N/A'}
                      </p>
                    </>
                  ) : (
                    <p className="text-muted-foreground text-base py-8">No partner profile linked or found.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Mood Calendar */}
            <MoodCalendar />

            {/* Communication Insights Charts */}
            <ScoreAndMessageCharts
              currentUserProfile={currentUserProfile}
              partnerProfile={partnerProfile}
              sentMessages={sentMessages}
              receivedMessages={receivedMessages}
            />

            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6 mt-8">Recent Messages</h2>
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