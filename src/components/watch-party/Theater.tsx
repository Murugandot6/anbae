import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Room, User } from '@/types/watchParty';
import VideoPlayer from '@/components/watch-party/VideoPlayer';
import Chat from '@/components/watch-party/Chat';
import { useSupabaseRealtime } from '@/hooks/watch-party/useSupabaseRealtime';
import { ClipboardCopyIcon, LinkIcon } from '@/components/watch-party/icons';
import VideoHistory from '@/components/watch-party/VideoHistory';
import { ArrowLeft, LogOut } from 'lucide-react'; // Import LogOut icon
import { Button } from '@/components/ui/button'; // Import shadcn Button
import { toast } from 'sonner'; // Import sonner toast
import { useNavigate as useReactRouterNavigate } from 'react-router-dom'; // Import useNavigate with alias
import clsx from 'clsx'; // Import clsx for conditional classes

interface TheaterProps {
  room: Room;
  user: User;
  onLeaveRoom: () => void;
}

const Theater: React.FC<TheaterProps> = ({ room, user, onLeaveRoom }) => {
  const navigate = useReactRouterNavigate(); // Initialize useNavigate with alias
  const { videoState, sendVideoAction, messages, sendMessage, sendVideoReaction, changeVideoSource, videoHistory, activeReactions, isConnectedToRealtime } = useSupabaseRealtime(room.id, room.videoUrl, user);
  const [copyStatus, setCopyStatus] = useState('Copy Code');
  const [newVideoUrl, setNewVideoUrl] = useState('');

  // Fullscreen state and ref for the entire theater container
  const [isTheaterFullscreen, setIsTheaterFullscreen] = useState(false);
  const theaterContainerRef = useRef<HTMLDivElement>(null);

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

  return (
    // Main container for the Theater, now handling fullscreen
    <div 
      ref={theaterContainerRef}
      className={clsx(
        "flex flex-col h-full", // This is the root of Theater, should take full height of its parent (main)
        {
          "fullscreen:h-screen fullscreen:flex fullscreen:fixed fullscreen:inset-0 fullscreen:z-50 fullscreen:rounded-none": true, // Always apply fullscreen styles to the container itself
          "bg-background text-foreground": !isTheaterFullscreen, // Apply background only when not fullscreen
          "bg-black": isTheaterFullscreen // Black background when fullscreen
        }
      )}
    >
      {/* This inner div now conditionally adjusts its max-width and margin based on fullscreen state */}
      <div className={clsx(
        "w-full flex flex-col flex-grow min-h-0 p-4 md:p-6", // flex-grow here is key
        {
          "max-w-full mx-0": isTheaterFullscreen
        }
      )}>
        {/* Header elements - conditionally hide when fullscreen */}
        {!isTheaterFullscreen && (
          <div className="flex items-center justify-between mb-4 flex-shrink-0"> {/* flex-shrink-0 is important */}
            {/* Back button on the left */}
            <div className="flex-shrink-0">
              <Button
                onClick={() => navigate('/dashboard')}
                variant="outline"
                size="icon"
                className="w-10 h-10 text-foreground border-border hover:bg-accent hover:text-accent-foreground rounded-full shadow-md"
                aria-label="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Page Title */}
            <h1 className="text-3xl font-bold text-foreground mx-auto">Watch Party</h1>

            {/* Room code and Leave button on the right */}
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <p className="text-muted-foreground">Share Code:</p>
                <p className="text-primary font-mono text-lg bg-input/50 px-3 py-1 rounded-md border border-border/50">{room.room_code}</p>
                <Button onClick={handleCopyCode} variant="ghost" size="sm" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground bg-input/50 hover:bg-accent/50 px-3 py-1 rounded-md transition-colors">
                  <ClipboardCopyIcon className="h-4 w-4" />
                  {copyStatus}
                </Button>
              </div>
              <Button onClick={onLeaveRoom} variant="destructive" size="icon" className="w-10 h-10 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full shadow-md">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Video Player and Chat Container - This is the main flex container for the two columns */}
        <div className={clsx(
          "flex items-stretch min-h-0 gap-6", // flex-grow removed from here
          {
            "flex-col md:flex-row": !isTheaterFullscreen, // Stack on mobile, row on desktop when not fullscreen
            "flex-row h-full": isTheaterFullscreen, // Row and full height when fullscreen
            "h-[calc(100vh-176px)]": !isTheaterFullscreen, // Fixed height for non-fullscreen, adjust as needed
          }
        )}>
          {/* Left Column: Video Player, Input Form, Video History */}
          <div className={clsx(
            "relative w-full flex flex-col space-y-4", // flex-col and space-y-4 for its children
            "flex-1 min-h-0", // flex-1 and min-h-0 are crucial for equal height and scrolling
            {
              "md:w-2/3": !isTheaterFullscreen,
            }
          )}>
            {/* Video Player Wrapper with Aspect Ratio Hack */}
            <div className={clsx(
              "relative w-full rounded-xl overflow-hidden",
              "flex-1 min-h-0", // This div should take up the remaining height in its column
              {
                "h-0 pb-[56.25%]": !isTheaterFullscreen, // Apply aspect ratio hack when not fullscreen
                "flex-grow": isTheaterFullscreen, // Allow it to grow in fullscreen
                "h-full": isTheaterFullscreen // Take full height in fullscreen
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
                className={clsx({
                  "absolute top-0 left-0 w-full h-full": !isTheaterFullscreen, // Position absolutely within aspect ratio parent
                  "w-full h-full": isTheaterFullscreen // Fill parent when fullscreen
                })}
              />
            </div>

            {/* Input Form - moved inside video column */}
            <form onSubmit={handleSetVideo} className={clsx(
              "bg-card/60 backdrop-blur-md border border-border/50 p-4 rounded-xl flex flex-col sm:flex-row items-center gap-3 shadow-lg flex-shrink-0",
              { "hidden": isTheaterFullscreen } // Hide when fullscreen
            )}>
              <label htmlFor="video-url-input" className="font-semibold text-foreground sr-only">Video URL</label>
              <div className="relative w-full">
                  <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                      <LinkIcon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <input
                      id="video-url-input"
                      type="url"
                      value={newVideoUrl}
                      onChange={(e) => { setNewVideoUrl(e.target.value); }}
                      placeholder="Enter YouTube or video URL to start or change the video"
                      className="w-full bg-input/50 border border-border/50 text-foreground text-sm rounded-lg focus:ring-primary focus:border-primary block ps-10 p-2.5"
                      required
                  />
              </div>
              <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg text-sm px-5 py-2.5 text-center">
                  Set Video
              </Button>
            </form>

            {/* Video History - moved inside video column */}
            <div className={clsx({ "hidden": isTheaterFullscreen })}>
              <VideoHistory history={videoHistory} onSelectVideo={changeVideoSource} className="flex-shrink-0" />
            </div>
          </div>

          {/* Right Column: Chat Panel */}
          {!isTheaterFullscreen && (
            <div
              className={clsx(
                "w-full md:w-1/3 md:max-w-sm flex-shrink-0 flex flex-col",
                "flex-1 min-h-0", // This column grows to match video height
              )}
            >
              <Chat
                messages={messages}
                sendMessage={sendMessage}
                currentUser={user}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Theater;