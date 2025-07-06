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
  const theaterContainerRef = useRef<HTMLDivElement>(null);

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
      className="flex flex-col h-full fullscreen:h-screen fullscreen:flex fullscreen:fixed fullscreen:inset-0 fullscreen:z-50 fullscreen:rounded-none"
    >
      <div className="max-w-7xl mx-auto w-full flex flex-col flex-grow min-h-0">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
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

        <form onSubmit={handleSetVideo} className="mb-6 bg-card/60 backdrop-blur-md border border-border/50 p-4 rounded-xl flex flex-col sm:flex-row items-center gap-3 shadow-lg flex-shrink-0">
          <label htmlFor="video-url-input" className="font-semibold text-foreground sr-only">Video URL</label>
          <div className="relative w-full">
              <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                  <LinkIcon className="w-5 h-5 text-muted-foreground" />
              </div>
              <input
                  id="video-url-input"
                  type="url"
                  value={newVideoUrl}
                  onChange={(e) => {
                      setNewVideoUrl(e.target.value);
                      // Optionally clear error if user starts typing
                  }}
                  placeholder="Enter YouTube or video URL to start or change the video"
                  className="w-full bg-input/50 border border-border/50 text-foreground text-sm rounded-lg focus:ring-primary focus:border-primary block ps-10 p-2.5"
                  required
              />
          </div>
          <Button type="submit" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg text-sm px-5 py-2.5 text-center">
              Set Video
          </Button>
        </form>

        <VideoHistory history={videoHistory} onSelectVideo={changeVideoSource} />

        <div className="flex flex-col lg:flex-row gap-6 items-stretch flex-grow h-full min-h-0">
          <div className="lg:flex-grow lg:w-3/4 min-h-0">
            <div className="relative w-full h-full">
              <VideoPlayer 
                videoState={videoState} 
                sendVideoAction={sendVideoAction} 
                messages={messages}
                sendMessage={sendMessage}
                currentUser={user}
                sendVideoReaction={sendVideoReaction}
                activeReactions={activeReactions}
                isConnectedToRealtime={isConnectedToRealtime}
                onToggleFullscreen={handleToggleFullscreen} // Pass toggle function
              />
            </div>
          </div>
          <div className="lg:w-1/4 lg:max-w-sm flex-shrink-0 h-full min-h-0">
            <Chat 
              messages={messages} 
              sendMessage={sendMessage} 
              currentUser={user}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Theater;