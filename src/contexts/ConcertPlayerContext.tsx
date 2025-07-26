import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Station } from '@/features/concert/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useSession } from '@/contexts/SessionContext';
import { fetchProfileByEmail } from '@/lib/supabaseHelpers'; // Import helper to fetch profile by email

interface ConcertPlayerContextType {
  currentStation: Station | null;
  isPlaying: boolean;
  roomCode: string | null;
  setRoom: (code: string | null) => void;
  setStation: (station: Station) => void;
  togglePlay: () => void;
  clearStation: () => void;
  isConnectedToRoom: boolean;
}

const ConcertPlayerContext = createContext<ConcertPlayerContextType | undefined>(undefined);

export const ConcertPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useSession();
  const navigate = useNavigate();
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(null);
  const [localUserHasInteracted, setLocalUserHasInteracted] = useState(false);
  const [isConnectedToRoom, setIsConnectedToRoom] = useState(false);
  const [partnerId, setPartnerId] = useState<string | null>(null); // State to store partner's ID

  const channelRef = useRef<RealtimeChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Ref to store the current user's ID to avoid processing their own broadcasts
  const userIdRef = useRef<string | null>(null);
  useEffect(() => {
    userIdRef.current = user?.id || null;
  }, [user]);

  // Fetch partner's ID once when user session loads
  useEffect(() => {
    const getPartnerId = async () => {
      if (user?.user_metadata?.partner_email) {
        const partnerProfile = await fetchProfileByEmail(user.user_metadata.partner_email);
        setPartnerId(partnerProfile?.id || null);
      } else {
        setPartnerId(null);
      }
    };
    getPartnerId();
  }, [user]);

  // Function to update the database AND broadcast the state
  const syncState = useCallback(async (station: Station | null, playStatus: boolean) => {
    if (!activeRoomCode || !user) return;

    // Clean the station object before saving to DB and broadcasting
    const stationToSave = station ? {
        stationuuid: station.stationuuid,
        name: station.name,
        url_resolved: station.url_resolved,
        favicon: station.favicon,
        country: station.country,
        language: station.language,
        tags: station.tags,
    } : null;

    // Update database for persistence
    const { error: dbError } = await supabase
      .from('wave_rooms')
      .update({ current_station: stationToSave, is_playing: playStatus, updated_at: new Date().toISOString() })
      .eq('code', activeRoomCode);
    
    if (dbError) {
        toast.error(`Failed to save room state: ${dbError.message}`);
    }

    // Broadcast state to other clients
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'concert_state_update',
        payload: { newState: stationToSave, isPlaying: playStatus, senderId: user.id },
      });
    }
  }, [activeRoomCode, user]);

  // Effect to setup and teardown the real-time subscription
  useEffect(() => {
    const setupRoom = async (code: string) => {
      // 1. Fetch initial state from DB for new joiners
      const { data, error } = await supabase
        .from('wave_rooms')
        .select('current_station, is_playing')
        .eq('code', code)
        .single();

      if (error || !data) {
        toast.error(`Could not join room ${code}. It may not exist.`);
        navigate('/concert');
        return;
      }

      setCurrentStation(data.current_station);
      setIsPlaying(data.is_playing);
      setIsConnectedToRoom(true);

      // 2. Subscribe to BROADCAST messages for real-time updates
      const channel = supabase.channel(`room:${code}`, { config: { presence: { key: user?.id } } })
        .on('broadcast', { event: 'concert_state_update' }, (payload) => {
          // Only update if the broadcast came from another user
          if (payload.payload.senderId !== userIdRef.current) {
            setCurrentStation(payload.payload.newState);
            setIsPlaying(payload.payload.isPlaying);
          }
        })
        .on('presence', { event: 'join' }, ({ newPresences }) => {
          newPresences.forEach((p: any) => {
            if (p.user_id && p.user_id !== userIdRef.current && p.user_id === partnerId) {
              toast.info(`${p.user_name || 'Your partner'} joined the concert room.`);
            }
          });
        })
        .on('presence', { event: 'leave' }, async ({ leftPresences }) => {
          for (const p of leftPresences) {
            if (p.user_id && p.user_id !== userIdRef.current && p.user_id === partnerId) {
              // Partner left, create a notification for the current user
              const { error: notificationError } = await supabase.from('notifications').insert({
                user_id: userIdRef.current,
                actor_id: p.user_id,
                type: 'CONCERT_ROOM_LEFT',
                message: `${p.user_name || 'Your partner'} has left the concert room.`,
                link: `/concert/${code}`,
              });
              if (notificationError) {
                console.error('Error creating partner left notification:', notificationError.message);
              }
              toast.info(`${p.user_name || 'Your partner'} has left the concert room.`);
            }
          }
        })
        .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
                setIsConnectedToRoom(true);
                // Track presence when subscribed
                if (user) {
                  channel.track({ user_id: user.id, user_name: user.user_metadata.nickname || user.email?.split('@')[0] || 'Guest' });
                }
            }
            if (status === 'CHANNEL_ERROR' || err) {
                const errorMessage = (err as Error)?.message || 'An unknown error occurred. Please refresh.';
                toast.error(`Connection to room lost: ${errorMessage}`);
                setIsConnectedToRoom(false);
            }
        });

      channelRef.current = channel;
    };

    const leaveRoom = () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnectedToRoom(false);
    };

    if (activeRoomCode && user) {
      setupRoom(activeRoomCode);
    } else {
      leaveRoom();
    }

    return () => {
      leaveRoom();
    };
  }, [activeRoomCode, user, navigate, partnerId]); // Added partnerId to dependencies

  // Effect to control the HTMLAudioElement
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentStation?.url_resolved) {
      if (audio.src !== currentStation.url_resolved) {
        audio.src = currentStation.url_resolved;
        audio.load();
      }
      if (isPlaying) {
        audio.play().catch(error => {
          if (error.name === 'NotAllowedError') {
            toast.info("Audio paused. Click play to start.");
            setIsPlaying(false); 
            syncState(currentStation, false);
          } else {
            toast.error("Audio playback failed.");
            setIsPlaying(false); 
            syncState(currentStation, false);
          }
        });
      } else {
        audio.pause();
      }
    } else {
      audio.pause();
      audio.src = '';
    }
  }, [currentStation, isPlaying, syncState]);

  // Action: Set a new station
  const setStation = useCallback((station: Station) => {
    setLocalUserHasInteracted(false);
    setCurrentStation(station);
    setIsPlaying(true);
    syncState(station, true);
  }, [syncState]);

  // Action: Toggle play/pause
  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!currentStation) return;

    if (!localUserHasInteracted) {
        setLocalUserHasInteracted(true);
    }

    let newPlayStatus = !isPlaying; 

    if (audio) {
        try {
            if (newPlayStatus) {
                await audio.play(); 
            } else {
                await audio.pause(); 
            }
            setIsPlaying(newPlayStatus); 
        } catch (e: any) {
            if (e.name === 'NotAllowedError') {
                toast.info("Audio paused. Click play to start.");
            } else {
                toast.error("Audio playback failed.");
            }
            newPlayStatus = false; 
            setIsPlaying(false); 
        }
    } else {
        setIsPlaying(newPlayStatus);
    }

    syncState(currentStation, newPlayStatus);
  }, [currentStation, isPlaying, syncState, localUserHasInteracted]); 

  // Action: Clear the player
  const clearStation = useCallback(async () => { // Made async
    setCurrentStation(null);
    setIsPlaying(false);
    if (activeRoomCode) {
        await syncState(null, false); // Ensure state is synced before potentially leaving

        // NEW: Send notification to partner if they exist and current user is leaving
        if (user && partnerId) {
            const { error: notificationError } = await supabase.from('notifications').insert({
                user_id: partnerId, // Notification for the partner
                actor_id: user.id, // Current user is the actor
                type: 'CONCERT_ROOM_LEFT',
                message: `${user.user_metadata.nickname || user.email?.split('@')[0] || 'A user'} has left the concert room: ${activeRoomCode}.`,
                link: `/concert/${activeRoomCode}`,
            });
            if (notificationError) {
                console.error('Error creating partner left notification:', notificationError.message);
            }
        }
    }
  }, [activeRoomCode, syncState, user, partnerId]); // Added user and partnerId to dependencies

  const setRoom = useCallback((code: string | null) => {
    setActiveRoomCode(code);
  }, []);

  const value = {
    currentStation,
    isPlaying,
    roomCode: activeRoomCode,
    setRoom,
    setStation,
    togglePlay,
    clearStation,
    isConnectedToRoom,
  };

  return (
    <ConcertPlayerContext.Provider value={value}>
      <audio ref={audioRef} crossOrigin="anonymous" preload="auto" />
      {children}
    </ConcertPlayerContext.Provider>
  );
};

export const useConcertPlayer = () => {
  const context = useContext(ConcertPlayerContext);
  if (context === undefined) {
    throw new Error('useConcertPlayer must be used within a ConcertPlayerProvider');
  }
  return context;
};