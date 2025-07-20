import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Settings, MessageSquare, Inbox, Heart, Menu } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import ClearMessagesDialog from '@/components/ClearMessagesDialog';
import BackgroundWrapper from '@/components/BackgroundWrapper';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatMessageDate } from '@/lib/utils';
import { Profile, Message, JournalEntry } from '@/types/supabase'; // Import JournalEntry
import CircularProgressAvatar from '@/components/CircularProgressAvatar';
import { Button } from '@/components/ui/button';
import MessageTimeline from '@/components/MessageTimeline';
import { Badge } from '@/components/ui/badge';
import ScoreAndMessageCharts from '@/components/ScoreAndMessageCharts';
import Sidebar from '@/components/Sidebar';
import CalendarView from '@/components/CalendarView';
import { format, isSameDay } from 'date-fns';
import JournalEntryCard from '@/components/JournalEntryCard'; // Import the renamed component
import { Helmet } from 'react-helmet-async'; // Import Helmet
import LoadingPulsar from '@/components/LoadingPulsar';
import { useIsMobile } from '@/hooks/use-mobile';
import SharedQuoteCard from '@/components/SharedQuoteCard'; // New import

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
  const [journalEntriesMap, setJournalEntriesMap] = useState<Record<string, JournalEntry>>({});
  const [todayJournalEntry, setTodayJournalEntry] = useState<JournalEntry | null>(null); // State for today's entry
  const [refreshJournalTrigger, setRefreshJournalTrigger] = useState(0);
  const isMobile = useIsMobile();

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
        const { data: allMessages, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (messagesError) {
          toast.error('Failed to load messages: ' + messagesError.message);
          setMessagesLoading(false);
          return;
        }

        const topLevelMessages = allMessages.filter(m => m.parent_message_id === null);
        const replies = allMessages.filter(m => m.parent_message_id !== null);

        const repliesMap = new Map<string, Message[]>();
        replies.forEach(reply => {
          const parentId = reply.parent_message_id!;
          if (!repliesMap.has(parentId)) {
            repliesMap.set(parentId, []);
          }
          repliesMap.get(parentId)!.push(reply);
        });

        const processedTopLevelMessages = topLevelMessages.map(msg => {
          const messageReplies = repliesMap.get(msg.id) || [];
          const hasUnreadReplies = messageReplies.some(
            reply => reply.receiver_id === user.id && !reply.is_read
          );
          return { ...msg, hasUnreadReplies };
        });

        const allRelatedUserIds = new Set<string>();
        processedTopLevelMessages.forEach(msg => {
          allRelatedUserIds.add(msg.sender_id);
          allRelatedUserIds.add(msg.receiver_id);
        });
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

        const sent = processedTopLevelMessages
          .filter(msg => msg.sender_id === user.id)
          .map(msg => ({
            ...msg,
            receiverProfile: profilesMap.get(msg.receiver_id) || null,
          }));

        const received = processedTopLevelMessages
          .filter(msg => msg.receiver_id === user.id)
          .map(msg => ({
            ...msg,
            senderProfile: profilesMap.get(msg.sender_id) || null,
          }));

        setSentMessages(sent);
        setReceivedMessages(received);

      } catch (error: any) {
        toast.error('An unexpected error occurred while loading messages.');
      } finally {
        setMessagesLoading(false);
      }
    };

    const fetchJournalData = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('journal_entries')
        .select('id, created_at, emoji, heading, content, mood, user_id') // Select user_id
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Failed to load journal entries for calendar.');
        console.error(error);
      } else {
        const entriesMap: Record<string, JournalEntry> = {};
        let latestTodayEntry: JournalEntry | null = null;
        const today = new Date();

        data.forEach(entry => {
          const entryDate = new Date(entry.created_at);
          const dateKey = format(entryDate, 'yyyy-MM-dd');
          entriesMap[dateKey] = entry; // Store the latest entry for each day

          if (isSameDay(entryDate, today) && (!latestTodayEntry || entryDate > new Date(latestTodayEntry.created_at))) {
            latestTodayEntry = entry;
          }
        });
        setJournalEntriesMap(entriesMap);
        setTodayJournalEntry(latestTodayEntry); // Set today's specific entry
      }
    };

    if (!sessionLoading && user) {
      fetchMessagesAndProfiles();
      fetchJournalData();
    }
  }, [user, sessionLoading, refreshMessagesTrigger, refreshJournalTrigger]);

  const handleDayClick = (date: Date) => {
    navigate('/journal', { state: { selectedDate: date.toISOString() } });
  };

  const handleJournalEntryUpdated = (entry: JournalEntry) => {
    // Update today's entry if it's for today
    if (isSameDay(new Date(entry.created_at), new Date())) {
      setTodayJournalEntry(entry);
    }
    setRefreshJournalTrigger(prev => prev + 1); // Trigger re-fetch for calendar
  };

  if (sessionLoading || fetchingProfiles || messagesLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-background/80 text-foreground">
        <LoadingPulsar />
        <p className="text-xl mt-4">Loading user session and profiles...</p>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Dashboard - Anbae</title>
        <meta name="description" content="Your Anbae dashboard: view relationship insights, recent messages, journal entries, and manage your profile." />
      </Helmet>
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
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-4 sm:gap-0">
                <h1 className="text-2xl md:text-4xl font-bold text-foreground text-center sm:text-left">Welcome, {user.user_metadata.nickname || user.email}!</h1>
              </div>

              <div className="grid grid-cols-3 items-center justify-center gap-4 mb-8">
                {/* Current User Profile */}
                <div className="relative flex flex-col items-center text-center">
                  <CircularProgressAvatar
                    score={currentUserProfile?.lifetime_score ?? 100}
                    avatarUrl={currentUserProfile?.avatar_url || user.user_metadata.avatar_url || ''}
                    fallbackText={user.user_metadata.nickname?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'Y'}
                    altText="Your Avatar"
                    size={isMobile ? 'sm' : 'md'}
                  />
                  <p className="font-semibold text-base sm:text-lg text-foreground mt-2">
                    {user.user_metadata.nickname || user.email}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Lifetime Score: {currentUserProfile?.lifetime_score !== undefined && currentUserProfile?.lifetime_score !== null ? currentUserProfile.lifetime_score : 'N/A'}
                  </p>
                </div>

                {/* Heart Icon */}
                <div className="flex items-center justify-center">
                  <Heart className="w-10 h-10 sm:w-12 sm:h-12 text-primary dark:text-secondary" />
                </div>

                {/* Partner Profile */}
                <div className="relative flex flex-col items-center text-center">
                  {partnerProfile ? (
                    <>
                      <CircularProgressAvatar
                        score={partnerProfile.lifetime_score ?? 100}
                        avatarUrl={partnerProfile.avatar_url}
                        fallbackText={partnerProfile.username?.charAt(0).toUpperCase() || partnerProfile.email?.charAt(0).toUpperCase() || 'P'}
                        altText="Partner Avatar"
                        size={isMobile ? 'sm' : 'md'}
                      />
                      <p className="font-semibold text-base sm:text-lg text-foreground mt-2">
                        {partnerProfile.username || partnerProfile.email}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Lifetime Score: {partnerProfile.lifetime_score !== undefined && partnerProfile.lifetime_score !== null ? partnerProfile.lifetime_score : 'N/A'}
                      </p>
                    </>
                  ) : (
                    <p className="text-muted-foreground text-sm sm:text-base py-8">No partner profile linked or found.</p>
                  )}
                </div>
              </div>

              {/* Shared Quote Section */}
              <div className="mb-8"> {/* Added margin-bottom for spacing */}
                <SharedQuoteCard
                  currentUserId={user.id}
                  partnerId={partnerProfile?.id || null}
                  currentUserProfile={currentUserProfile}
                  partnerProfile={partnerProfile}
                />
              </div>

              {/* Journal Entry Card and Mood Calendar - Now stacked vertically */}
              <div className="flex flex-col gap-4 mb-8">
                <div>
                  <JournalEntryCard user={user} initialEntry={todayJournalEntry} onEntryUpdated={handleJournalEntryUpdated} selectedDate={new Date()} />
                </div>
                <div>
                  <CalendarView entries={journalEntriesMap} onDayClick={handleDayClick} />
                </div>
              </div>

              {/* Communication Insights Charts */}
              <div className="mt-8">
                <ScoreAndMessageCharts
                  currentUserProfile={currentUserProfile}
                  partnerProfile={partnerProfile}
                  sentMessages={sentMessages}
                  receivedMessages={receivedMessages}
                />
              </div>

              <h2 className="text-xl md:text-3xl font-bold text-foreground mb-6 mt-8">Recent Messages</h2>
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
    </>
  );
};

export default Dashboard;