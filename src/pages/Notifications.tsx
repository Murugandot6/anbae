import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Bell, CheckCircle, ExternalLink } from 'lucide-react';
import { Notification, Profile } from '@/types/supabase';
import { fetchProfileById } from '@/lib/supabaseHelpers';
import BackgroundWrapper from '@/components/BackgroundWrapper';
import { formatDateTimeForMessageView } from '@/lib/utils';
import { Helmet } from 'react-helmet-async';
import LoadingPulsar from '@/components/LoadingPulsar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Notifications: React.FC = () => {
  const { user, loading: sessionLoading } = useSession();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [profilesMap, setProfilesMap] = useState<Map<string, Profile>>(new Map());

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
    const fetchNotifications = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          toast.error('Failed to load notifications: ' + error.message);
          setNotifications([]);
          return;
        }

        const allActorIds = new Set<string>();
        data.forEach(notif => allActorIds.add(notif.actor_id));

        const fetchedProfiles: Profile[] = [];
        for (const id of Array.from(allActorIds)) {
          const profile = await getOrFetchProfile(id);
          if (profile) {
            fetchedProfiles.push(profile);
          }
        }
        const initialProfilesMap = new Map<string, Profile>();
        fetchedProfiles.forEach(profile => {
          initialProfilesMap.set(profile.id, profile);
        });
        setProfilesMap(initialProfilesMap);

        const notificationsWithProfiles = data.map(notif => ({
          ...notif,
          actorProfile: initialProfilesMap.get(notif.actor_id) || null,
        }));

        setNotifications(notificationsWithProfiles);
      } catch (error: any) {
        toast.error('An unexpected error occurred while loading notifications.');
      } finally {
        setLoading(false);
      }
    };

    if (!sessionLoading && user) {
      fetchNotifications();
    } else if (!sessionLoading && !user) {
      navigate('/login');
    }

    const channel = supabase
      .channel(`public:notifications:user_id=eq.${user?.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user?.id}`,
        },
        async (payload) => {
          const newOrUpdatedNotification = payload.new as Notification;
          const actorProfile = await getOrFetchProfile(newOrUpdatedNotification.actor_id);
          const notificationWithProfile = { ...newOrUpdatedNotification, actorProfile };

          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [notificationWithProfile, ...prev]);
            toast.info(`New notification: ${newOrUpdatedNotification.message}`);
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev =>
              prev.map(notif => (notif.id === notificationWithProfile.id ? notificationWithProfile : notif))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, sessionLoading, navigate]);

  const handleMarkAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      toast.error('Failed to mark as read: ' + error.message);
    } else {
      setNotifications(prev =>
        prev.map(notif => (notif.id === notificationId ? { ...notif, is_read: true } : notif))
      );
      toast.success('Notification marked as read!');
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  if (sessionLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-background/80 text-foreground">
        <LoadingPulsar />
        <p className="text-xl mt-4">Loading notifications...</p>
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
        <title>Notifications - Anbae</title>
        <meta name="description" content="View and manage all your Anbae notifications and alerts." />
      </Helmet>
      <BackgroundWrapper className="pt-0 md:pt-0">
        <div className="w-full max-w-2xl mx-auto pt-8 mt-16 md:mt-8 px-4">
          <div className="flex justify-between items-center mb-6">
            <div className="absolute top-3 left-3 z-10">
              <Link to="/dashboard">
                <Button variant="outline" size="icon" className="w-9 h-9 sm:w-10 sm:h-10 text-foreground border-border hover:bg-accent hover:text-accent-foreground rounded-full shadow-md">
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mx-auto">Notifications</h1>
          </div>

          <div className="space-y-4">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`bg-card/60 backdrop-blur-md border border-border/50 rounded-xl shadow-lg transition-all duration-200 ${
                    !notification.is_read ? 'bg-primary/10 dark:bg-primary/20 border-primary/50' : ''
                  }`}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <Avatar className="w-10 h-10 border-2 border-primary">
                      <AvatarImage src={notification.actorProfile?.avatar_url || ''} alt="Actor Avatar" />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {notification.actorProfile?.username?.charAt(0).toUpperCase() || notification.actorProfile?.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base text-foreground font-medium truncate">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDateTimeForMessageView(notification.created_at)}
                      </p>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2">
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 text-primary hover:bg-primary/20"
                          onClick={() => handleMarkAsRead(notification.id)}
                          title="Mark as Read"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                      {notification.link && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 text-accent hover:bg-accent/20"
                          onClick={() => handleNotificationClick(notification)}
                          title="Go to Link"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-base sm:text-lg">No new notifications.</p>
                <p className="text-sm mt-1">You're all caught up!</p>
              </div>
            )}
          </div>
        </div>
      </BackgroundWrapper>
    </>
  );
};

export default Notifications;