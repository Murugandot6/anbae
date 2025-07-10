"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Room, User } from '@/types/watchParty';
import VideoPlayer from '@/components/watch-party/VideoPlayer';
import Chat from '@/components/watch-party/Chat';
import { useSupabaseRealtime } from '@/hooks/watch-party/useSupabaseRealtime';
import { Copy, Link as LinkIcon, ArrowLeft, LogOut } from 'lucide-react';
import VideoHistory from '@/components/watch-party/VideoHistory';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useNavigate as useReactRouterNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useIsMobile } from '@/hooks/use-mobile'; // Import useIsMobile

interface TheaterProps {
  room: Room;
  user: User;
  onLeaveRoom: () => void;
}

const Theater: React.FC<TheaterProps> = ({ room, user, onLeaveRoom }) => {
  const navigate = useReactRouterNavigate();
  const { videoState, sendVideoAction, messages, sendMessage, sendVideoReaction, changeVideoSource, videoHistory, activeReactions, isConnectedToRealtime } = useSupabaseRealtime(room.id, room.videoUrl, user);
  const [copyStatus, setCopyStatus] = useState('Copy Code');
  const [newVideoUrl, setNewVideoUrl] = useState('');

  const [isTheaterFullscreen, setIsTheaterFullscreen] = useState(false);
  const theaterContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile(); // Use the hook

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsTheaterFullscreen(!!document.fullscreenElement);
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

  const handleToggleFullscreen = useCallback(() => {
    if (theaterContainerRef.current) {
      if (!document.fullscreenElement) {
        theaterContainerRef.current.requestFullscreen().catch(err => {
          toast.error(`Error entering fullscreen: ${err.message}`);
        });
      } else {
        document.exitFullscreen();
      }
    }
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.room_code);
    setCopyStatus('Copied!');
    toast.success("Room code copied to clipboard!");
    setTimeout(() => setCopyStatus('Copy Code'), 2000);
  };

  const handleSetVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (newVideoUrl.trim()) {
      changeVideoSource(newVideoUrl.trim());
      setNewVideoUrl('');
    }
  };

  // This comment is added to force a re-evaluation by the build system.
  return (
    <div 
      ref={theaterContainerRef}
      className={clsx(
        "flex flex-col h-full w-full", // Base styles for the container
        isTheaterFullscreen ? "fixed inset-0 z-50 rounded-none bg-black" : "bg-background text-foreground"
      )}
    >
      <div className={clsx(
        "w-full flex flex-col flex-grow min-h-0 p-3 sm:p-4 md:p-6",
        {
          "max-w-full mx-0": isTheaterFullscreen // In fullscreen, remove max-width and margin
        }
      )}>
        {/* Header elements - conditionally hide when fullscreen */}
        {!isTheaterFullscreen && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 flex-shrink-0">
            <div className="flex items-center justify-between w-full sm:w-auto mb-3 sm:mb-0">
              <div className="flex-shrink-0">
                <Button
                  onClick={() => navigate('/dashboard')}
                  variant="outline"
                  size="icon"
                  className="w-9 h-9 sm:w-10 sm:h-10 text-foreground border-border hover:bg-accent hover:text-accent-foreground rounded-full shadow-md"
                  aria-label="Back to Dashboard"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>
              <h1 className="text-xl sm:text-3xl font-bold tracking-tighter text-foreground ml-auto sm:ml-4">Theater</h1>
            </div>
            <div className="flex items-center justify-between w-full sm:w-auto gap-2 sm:gap-4">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:inline">Share Code:</p>
                <p className="text-sm sm:text-lg font-mono text-primary bg-input/50 px-2 py-0.5 sm:px-3 sm:py-1 rounded-md border border-border/50">{room.room_code}</p>
                <Button onClick={handleCopyCode} variant="ghost" size="sm" className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground bg-input/50 hover:bg-accent/50 px-2 py-0.5 sm:px-3 sm:py-1 rounded-md transition-colors h-auto">
                  <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                  {copyStatus}
                </Button>
              </div>
              <Button onClick={onLeaveRoom} variant="destructive" size="icon" className="w-9 h-9 sm:w-10 sm:h-10 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full shadow-md">
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Main Video Player and Chat Row */}
        <div className={clsx(
          "flex flex-grow min-h-0 gap-6 sm:gap-8", // This container fills available vertical space
          {
            "flex-col": isMobile, // Stack on mobile
            "sm:flex-row": !isMobile, // Side-by-side on desktop
          }
        )}>
          {/* Left Column: Video Player */}
          <div className={clsx(
            "relative w-full rounded-xl overflow-hidden",
            {
              "flex-grow": isMobile, // On mobile, video takes full width and grows to fill half height
              "sm:flex-[3] sm:h-full": !isMobile, // On desktop, video takes 3 parts of width and full height
            }
          )}>
            <VideoPlayer
              videoState={videoState}
              sendVideoAction={sendVideoAction}
              messages={messages}
              sendMessage={sendMessage}
              currentUser={user}
              sendVideoReaction={sendVideoReaction}
              activeReactions={activeReactions}
              isConnectedToRealtime={isConnectedToRealtime}
              onToggleFullscreen={handleToggleFullscreen}
              isTheaterFullscreen={isTheaterFullscreen}
              className="w-full h-full" // ReactPlayer fills its parent
            />
          </div>

          {/* Right Column: Chat Panel */}
          <div
            className={clsx(
              "w-full flex flex-col", // Removed min-h-[300px]
              {
                "flex-grow": isMobile, // On mobile, chat takes full width and grows to fill half height
                "sm:flex-[1] sm:h-full sm:min-w-[320px]": !isMobile, // On desktop, chat takes 1 part of width, full height, and min-width
              }
            )}
          >
            <Chat
              messages={messages}
              sendMessage={sendMessage}
              currentUser={user}
              isTheaterFullscreen={isTheaterFullscreen}
              isMobile={isMobile}
            />
          </div>
        </div>

        {/* Form and History (moved below the main video/chat row) */}
        {!isTheaterFullscreen && (
          <div className="flex flex-col gap-4 sm:gap-6 mt-6 sm:mt-8 flex-shrink-0">
            <form onSubmit={handleSetVideo} className={clsx(
              "bg-card/60 backdrop-blur-md border border-border/50 p-3 sm:p-4 rounded-xl flex flex-col sm:flex-row items-center gap-2 sm:gap-3 shadow-lg"
            )}>
              <label htmlFor="video-url-input" className="font-semibold text-foreground sr-only">Video URL</label>
              <div className="relative w-full">
                  <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                      <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <input
                      id="video-url-input"
                      type="url"
                      value={newVideoUrl}
                      onChange={(e) => { setNewVideoUrl(e.target.value); }}
                      placeholder="Enter YouTube or video URL to start or change the video"
                      className="w-full bg-input/50 border border-border/50 text-foreground text-xs sm:text-sm rounded-lg focus:ring-primary focus:border-primary block ps-9 p-2 sm:ps-10 sm:p-2.5"
                      required
                  />
              </div>
              <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg text-xs sm:text-sm px-4 py-2 sm:px-5 sm:py-2.5 text-center h-auto">
                  Set Video
              </Button>
            </form>

            <div>
              <VideoHistory history={videoHistory} onSelectVideo={changeVideoSource} className="flex-shrink-0" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Theater;