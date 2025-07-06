import React, { useRef, useEffect, useState, useCallback } from 'react';
import ReactPlayer from 'react-player/lazy';
import { OnProgressProps } from 'react-player/base';
import { VideoState, VideoAction, ChatMessage, User } from '@/types/watchParty';
import { PlayIcon, PauseIcon, VolumeUpIcon, VolumeOffIcon, MaximizeIcon, FilmIcon } from '@/components/watch-party/icons';
import Chat from '@/components/watch-party/Chat'; // Import Chat component
import { MessageSquare, Smile, Heart, Frown } from 'lucide-react'; // Import MessageSquare, Smile, Heart, Frown icons
import { cn } from '@/lib/utils'; // Import cn for conditional classes

interface VideoPlayerProps {
  videoState: VideoState;
  sendVideoAction: (action: VideoAction) => void;
  messages: ChatMessage[];
  sendMessage: (text: string) => void;
  currentUser: User;
  sendVideoReaction: (emoji: string) => void; // New prop for sending reactions
  activeReactions: { id: string; emoji: string; timestamp: number; }[]; // New prop for displaying reactions
}

const formatTime = (timeInSeconds: number) => {
  if (isNaN(timeInSeconds) || timeInSeconds < 0) return '00:00';
  const minutes = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
  const seconds = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoState, sendVideoAction, messages, sendMessage, currentUser, sendVideoReaction, activeReactions }) => {
  const playerRef = useRef<ReactPlayer>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  
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

  const [isFullScreen, setIsFullScreen] = useState(false); // New state to track fullscreen
  const [showFullscreenChat, setShowFullscreenChat] = useState(false);

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

  useEffect(() => {
      setPlayerError(null);
      setIsPlayerReady(false);
      setSeekingTime(0);
      setDisplayTime(0);
  }, [videoState.source]);

  // New useEffect to handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
      if (!document.fullscreenElement) {
        setShowFullscreenChat(false); // Exit chat overlay when exiting fullscreen
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

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
    if (playerContainerRef.current) {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            playerContainerRef.current.requestFullscreen();
        }
    }
  };

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (videoState.isPlaying && !isFullScreen) { // Only hide controls if not in fullscreen
        setShowControls(false);
      }
    }, 3000);
  }, [videoState.isPlaying, isFullScreen]);

  useEffect(() => {
    const container = playerContainerRef.current;
    container?.addEventListener('mousemove', handleMouseMove);
    return () => container?.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);
  
  const handleProgress = () => {};
  
  const handlePlayerSeek = (seconds: number) => {
    isSyncingSeekRef.current = false;
    setDisplayTime(seconds);
  };

  // Determine player and chat container classes based on fullscreen and chat visibility
  const playerWrapperClasses = cn(
    "relative w-full bg-black rounded-xl overflow-hidden group shadow-lg",
    !isFullScreen && "aspect-video", // Only apply aspect-video when not in fullscreen
    isFullScreen && "fixed inset-0 z-50 rounded-none flex", // Always flex in fullscreen
  );

  const reactPlayerContainerClasses = cn(
    "w-full h-full",
    isFullScreen && showFullscreenChat ? "flex-grow" : "flex-1" // Use flex-1 if not showing chat, flex-grow if showing
  );

  const chatContainerClasses = cn(
    "bg-card/90 backdrop-blur-md rounded-xl shadow-lg",
    isFullScreen && showFullscreenChat ? "absolute inset-y-0 right-0 w-80 flex-shrink-0 pb-20" : "hidden" // Added pb-20 here
  );

  return (
    <div ref={playerContainerRef} className={playerWrapperClasses}>
      {videoState.source ? (
        <>
          <div className={reactPlayerContainerClasses}> {/* Wrap ReactPlayer in this div */}
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
                  console.error('Player Error:', e, data);
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
          </div>
          
          {!isPlayerReady && !playerError && (
            <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-30">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-white">Loading Player...</p>
            </div>
          )}

          {playerError && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-30 p-4 text-center">
                <p className="text-destructive text-lg font-semibold">Video Error</p>
                <p className="text-muted-foreground mt-2">{playerError}</p>
            </div>
          )}

          <div 
            className={`absolute inset-0 w-full h-full z-10 ${!isPlayerReady || !!playerError ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={handlePlayPause}
            onMouseMove={handleMouseMove}
          ></div>

          {/* Chat Toggle Button (Top-Right, only in Fullscreen) */}
          {isFullScreen && (
            <div className="absolute top-4 right-4 z-30">
              <button onClick={() => setShowFullscreenChat(prev => !prev)} disabled={!isPlayerReady || !!playerError} className="hover:text-primary transition-colors disabled:text-muted-foreground disabled:cursor-not-allowed text-white">
                <MessageSquare className="w-6 h-6" />
              </button>
            </div>
          )}

          {/* Video Reactions Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            {activeReactions.map(reaction => (
              <span 
                key={reaction.id} 
                className={cn(
                  "absolute text-6xl md:text-8xl animate-fade-in-out"
                )}
                style={{ 
                  animationDuration: '5s',
                  top: `${Math.random() * 80 + 10}%`, // Random vertical position
                  left: `${Math.random() * 80 + 10}%` // Random horizontal position
                }}
              >
                {reaction.emoji}
              </span>
            ))}
          </div>

          <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300 z-20 ${showControls || isFullScreen ? 'opacity-100' : 'opacity-0'}`}>
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
                  disabled={!isPlayerReady || !!playerError}
                  className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer range-sm accent-primary disabled:bg-muted/50 disabled:accent-muted-foreground disabled:cursor-not-allowed"
                />
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-4">
                  <button onClick={handlePlayPause} disabled={!isPlayerReady || !!playerError} className="hover:text-primary transition-colors disabled:text-muted-foreground disabled:cursor-not-allowed">
                    {videoState.isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
                  </button>
                  <div className="flex items-center gap-2">
                      <button onClick={toggleMute} disabled={!isPlayerReady || !!playerError} className="hover:text-primary transition-colors disabled:text-muted-foreground disabled:cursor-not-allowed">
                          {isMuted ? <VolumeOffIcon className="w-6 h-6"/> : <VolumeUpIcon className="w-6 h-6"/>}
                      </button>
                      <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          disabled={!isPlayerReady || !!playerError}
                          className="w-20 h-1.5 bg-muted rounded-lg appearance-none cursor-pointer range-sm accent-primary disabled:bg-muted/50 disabled:accent-muted-foreground disabled:cursor-not-allowed"
                        />
                  </div>
                </div>
                {/* Reaction Buttons */}
                <div className="flex items-center gap-2">
                  <button onClick={() => sendVideoReaction('❤️')} disabled={!isPlayerReady || !!playerError} className="hover:text-red-500 transition-colors disabled:text-muted-foreground disabled:cursor-not-allowed">
                    <Heart className="w-6 h-6" />
                  </button>
                  <button onClick={() => sendVideoReaction('😂')} disabled={!isPlayerReady || !!playerError} className="hover:text-yellow-400 transition-colors disabled:text-muted-foreground disabled:cursor-not-allowed">
                    <Smile className="w-6 h-6" />
                  </button>
                  <button onClick={() => sendVideoReaction('😢')} disabled={!isPlayerReady || !!playerError} className="hover:text-blue-400 transition-colors disabled:text-muted-foreground disabled:cursor-not-allowed">
                    <Frown className="w-6 h-6" />
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-mono text-muted-foreground">{formatTime(sliderTime)} / {formatTime(videoState.duration)}</span>
                  <button onClick={handleFullscreen} disabled={!isPlayerReady || !!playerError} className="hover:text-primary transition-colors disabled:text-muted-foreground disabled:cursor-not-allowed">
                    <MaximizeIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Fullscreen Chat - now part of the flex container */}
          {isFullScreen && showFullscreenChat && (
            <div className={chatContainerClasses}>
              <Chat messages={messages} sendMessage={sendMessage} currentUser={currentUser} isOverlay={true} onClose={() => setShowFullscreenChat(false)} />
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-30 p-4 text-center">
            <FilmIcon className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-bold text-foreground">No Video Selected</h3>
            <p className="text-muted-foreground mt-2">To start the party, paste a video URL in the field above and click "Set Video".</p>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;