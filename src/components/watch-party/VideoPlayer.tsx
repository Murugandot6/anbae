"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import ReactPlayer from 'react-player/lazy';
import { OnProgressProps } from 'react-player/base';
import { VideoState, VideoAction, ChatMessage, User } from '@/types/watchParty';
import { Play, Pause, Volume2, VolumeX, Maximize, Film, MessageSquare, WifiOff } from 'lucide-react';
import { Heart, Angry, PartyPopper, Flame, Laugh, Frown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button'; // Import Button component

interface VideoPlayerProps {
  videoState: VideoState;
  sendVideoAction: (action: VideoAction) => void;
  messages: ChatMessage[]; // Still needed for reactions, but not for chat display
  sendMessage: (text: string) => void; // Still needed for reactions, but not for chat display
  currentUser: User;
  sendVideoReaction: (emoji: string) => void;
  activeReactions: { id: string; emoji: string; timestamp: number; }[];
  isConnectedToRealtime: boolean;
  onToggleFullscreen: () => void;
  isTheaterFullscreen: boolean;
  className?: string;
  isChatOpen: boolean; // New prop
  onToggleChat: () => void; // New prop
  isMobile: boolean; // New prop
}

const formatTime = (timeInSeconds: number) => {
  if (isNaN(timeInSeconds) || timeInSeconds < 0) return '00:00';
  const minutes = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
  const seconds = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoState, sendVideoAction, messages, sendMessage, currentUser, sendVideoReaction, activeReactions, isConnectedToRealtime, onToggleFullscreen, isTheaterFullscreen, className, isChatOpen, onToggleChat, isMobile }) => {
  const playerRef = useRef<ReactPlayer>(null);
  
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<number | null>(null);

  const [isSeeking, setIsSeeking] = useState(false);
  const [seekingTime, setSeekingTime] = useState(0); 

  const [displayTime, setDisplayTime] = useState(videoState.time);

  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);

  const isSyncingSeekRef = useRef(false);
  const throttleTimeoutRef = useRef<number | null>(null);

  const sliderTime = isSeeking ? seekingTime : displayTime;
  
  useEffect(() => {
    setDisplayTime(videoState.time);

    if (videoState.isPlaying) {
      const interval = setInterval(() => {
        const elapsed = (Date.now() - videoState.timestamp) / 1000;
        const newDisplayTime = Math.min(videoState.time + elapsed, videoState.duration);
        setDisplayTime(newDisplayTime);
      }, 250);
      return () => clearInterval(interval);
    }
  }, [videoState.isPlaying, videoState.time, videoState.timestamp, videoState.duration]);

  useEffect(() => {
    const player = playerRef.current;
    if (!isPlayerReady || isSeeking || !player) {
      return;
    }

    let masterTime = videoState.time;
    if (videoState.isPlaying) {
        const elapsed = (Date.now() - videoState.timestamp) / 1000;
        masterTime = videoState.time + elapsed;
    }

    const localTime = player.getCurrentTime();
    const timeDifference = Math.abs(localTime - masterTime);
    
    const driftThreshold = 1.0;

    if (timeDifference > driftThreshold) {
      isSyncingSeekRef.current = true; 
      player.seekTo(masterTime, 'seconds');
    }
  }, [videoState, isPlayerReady, isSeeking]);

  const handlePlayPause = () => {
    if (!isPlayerReady) return;
    const currentTime = playerRef.current?.getCurrentTime() ?? videoState.time;
    sendVideoAction({ type: videoState.isPlaying ? 'pause' : 'play', payload: currentTime });
  };

  const throttledSeek = useCallback((time: number) => {
      if (throttleTimeoutRef.current === null) {
          sendVideoAction({ type: 'seek', payload: time });
          throttleTimeoutRef.current = window.setTimeout(() => {
              throttleTimeoutRef.current = null;
          }, 200);
      }
  }, [sendVideoAction]);
  
  const handleSeekMouseDown = () => {
    if (!isPlayerReady || !!playerError) return;
    setIsSeeking(true);
    setSeekingTime(sliderTime);
    if (videoState.isPlaying) {
        sendVideoAction({ type: 'pause', payload: playerRef.current?.getCurrentTime() ?? videoState.time });
    }
  };
  
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isPlayerReady || !!playerError) return;
    const newTime = parseFloat(e.target.value);
    setSeekingTime(newTime);
    throttledSeek(newTime);
  };
  
  const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
    if (!isPlayerReady || !!playerError) return;
    
    if (throttleTimeoutRef.current) {
        window.clearTimeout(throttleTimeoutRef.current);
        throttleTimeoutRef.current = null;
    }
    
    const newTime = parseFloat(e.currentTarget.value);
    setIsSeeking(false);
    sendVideoAction({ type: 'seek', payload: newTime });
  };
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };

  const handleFullscreen = () => {
    onToggleFullscreen();
  };

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (videoState.isPlaying && !isTheaterFullscreen) {
        setShowControls(false);
      }
    }, 3000);
  }, [videoState.isPlaying, isTheaterFullscreen]);

  const playerWrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = playerWrapperRef.current;
    container?.addEventListener('mousemove', handleMouseMove);
    return () => container?.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);
  
  const handleProgress = () => {};
  
  const handlePlayerSeek = (seconds: number) => {
    isSyncingSeekRef.current = false;
    setDisplayTime(seconds);
  };

  const isPlayerActionDisabled = !isPlayerReady || !!playerError || !isConnectedToRealtime;

  return (
    <div ref={playerWrapperRef} className={cn(
      "relative w-full bg-black rounded-xl overflow-hidden group shadow-lg", // Removed aspect-video here
      className
    )}>
      {videoState.source ? (
        <>
          <ReactPlayer
            ref={playerRef}
            url={videoState.source}
            width="100%"
            height="100%"
            playing={videoState.isPlaying}
            volume={volume}
            muted={isMuted}
            controls={false}
            onReady={() => setIsPlayerReady(true)}
            onDuration={(duration: number) => sendVideoAction({ type: 'durationchange', payload: duration })}
            onProgress={handleProgress}
            onSeek={handlePlayerSeek}
            progressInterval={500}
            onError={(e: any, data?: any) => {
                let errorMessage = 'Could not load video. The URL may be invalid, the video is private, or the format is not supported.';
                
                const errorCode = typeof data === 'number' ? data : typeof e === 'number' ? e : null;

                if (errorCode !== null) {
                    switch (errorCode) {
                        case 2: errorMessage = 'The video request contains an invalid parameter. Please check the URL.'; break;
                        case 5: errorMessage = 'An HTML5 player error occurred. The video may not be compatible.'; break;
                        case 100: 
                        case 101: 
                        case 150: 
                            errorMessage = 'The video owner has disabled playback on other websites. Please choose another video.'; break;
                        default:
                            break;
                    }
                } else if (e instanceof Error) {
                    errorMessage = e.message;
                } else if (typeof e === 'string' && e.length > 0) {
                    errorMessage = e;
                }

                setPlayerError(errorMessage);
                if (videoState.isPlaying) {
                    sendVideoAction({ type: 'pause', payload: playerRef.current?.getCurrentTime() });
                }
            }}
          />
          
          {!isPlayerReady && !playerError && (
            <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-30">
                <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-3 sm:mt-4 text-white text-sm sm:text-base">Loading Player...</p>
            </div>
          )}

          {playerError && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-30 p-4 text-center">
                <p className="text-destructive text-base sm:text-lg font-semibold">Video Error</p>
                <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">{playerError}</p>
            </div>
          )}

          <div 
            className={cn("absolute inset-0 w-full h-full z-10", isPlayerActionDisabled ? 'cursor-not-allowed' : 'cursor-pointer')}
            onClick={handlePlayPause}
            onMouseMove={handleMouseMove}
          ></div>

          {/* Fullscreen button - always visible */}
          <button 
            onClick={handleFullscreen} 
            disabled={isPlayerActionDisabled} 
            className="absolute top-3 right-3 z-30 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Toggle fullscreen"
          >
            <Maximize className="w-4 h-4 sm:w-5 h-5" />
          </button>

          {/* Video Reactions Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            {activeReactions.map(reaction => (
              <span 
                key={reaction.id} 
                className={cn(
                  "absolute text-5xl sm:text-6xl md:text-8xl animate-fade-in-out"
                )}
                style={{ 
                  animationDuration: '5s',
                  top: `${Math.random() * 80 + 10}%`,
                  left: `${Math.random() * 80 + 10}%`
                }}
              >
                {reaction.emoji}
              </span>
            ))}
          </div>

          <div className={cn("absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300 z-20", showControls || isTheaterFullscreen ? 'opacity-100' : 'opacity-0')}>
            <div className="flex flex-col gap-2">
              <input
                  type="range"
                  min="0"
                  max={videoState.duration || 100}
                  step="0.1"
                  value={sliderTime}
                  onMouseDown={handleSeekMouseDown}
                  onChange={handleSeekChange}
                  onMouseUp={handleSeekMouseUp}
                  disabled={isPlayerActionDisabled}
                  className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer range-sm accent-primary disabled:bg-muted/50 disabled:accent-muted-foreground disabled:cursor-not-allowed"
                />
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-3 sm:gap-4">
                  <button onClick={handlePlayPause} disabled={isPlayerActionDisabled} className="hover:text-primary transition-colors disabled:text-muted-foreground disabled:cursor-not-allowed">
                    {videoState.isPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                      <button onClick={toggleMute} disabled={isPlayerActionDisabled} className="hover:text-primary transition-colors disabled:text-muted-foreground disabled:cursor-not-allowed">
                          {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5"/> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5"/>}
                      </button>
                      <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          disabled={isPlayerActionDisabled}
                          className="w-16 sm:w-20 h-1 bg-muted rounded-lg appearance-none cursor-pointer range-sm accent-primary disabled:bg-muted/50 disabled:accent-muted-foreground disabled:cursor-not-allowed"
                        />
                  </div>
                </div>
                {/* Reaction Buttons */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button onClick={() => sendVideoReaction('❤️')} disabled={isPlayerActionDisabled} className="hover:text-red-500 transition-colors disabled:text-muted-foreground disabled:cursor-not-allowed">
                    <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button onClick={() => sendVideoReaction('😂')} disabled={isPlayerActionDisabled} className="hover:text-yellow-400 transition-colors disabled:text-muted-foreground disabled:cursor-not-allowed">
                    <Laugh className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button onClick={() => sendVideoReaction('😭')} disabled={isPlayerActionDisabled} className="hover:text-blue-400 transition-colors disabled:text-muted-foreground disabled:cursor-not-allowed">
                    <Frown className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button onClick={() => sendVideoReaction('😡')} disabled={isPlayerActionDisabled} className="hover:text-red-600 transition-colors disabled:text-muted-foreground disabled:cursor-not-allowed">
                    <Angry className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button onClick={() => sendVideoReaction('🔥')} disabled={isPlayerActionDisabled} className="hover:text-orange-500 transition-colors disabled:text-muted-foreground disabled:cursor-not-allowed">
                    <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button onClick={() => sendVideoReaction('🎉')} disabled={isPlayerActionDisabled} className="hover:text-purple-400 transition-colors disabled:text-muted-foreground disabled:cursor-not-allowed">
                    <PartyPopper className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                  <span className="text-xs sm:text-sm font-mono text-muted-foreground">{formatTime(sliderTime)} / {formatTime(videoState.duration)}</span>
                  {!isMobile && ( // Removed !isTheaterFullscreen condition
                    <Button
                      onClick={onToggleChat}
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 sm:w-8 sm:h-8 text-white hover:bg-white/20"
                      aria-label={isChatOpen ? "Close Chat" : "Open Chat"}
                      disabled={isPlayerActionDisabled}
                    >
                      <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-30 p-4 text-center">
            <Film className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-xl font-bold text-foreground">No Video Selected</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">To start the party, paste a video URL in the field above and click "Set Video".</p>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;