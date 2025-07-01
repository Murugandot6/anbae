import React, { useState } from 'react';
import { Room, User } from '@/types/watchParty';
import VideoPlayer from '@/components/watch-party/VideoPlayer';
import Chat from '@/components/watch-party/Chat';
import { useSupabaseRealtime } from '@/hooks/watch-party/useSupabaseRealtime';
import { ClipboardCopyIcon, LinkIcon } from '@/components/watch-party/icons';
import VideoHistory from '@/components/watch-party/VideoHistory';
import { ArrowLeft } from 'lucide-react';

interface TheaterProps {
  room: Room;
  user: User;
  onLeaveRoom: () => void;
}

const Theater: React.FC<TheaterProps> = ({ room, user, onLeaveRoom }) => {
  const { videoState, sendVideoAction, messages, sendMessage, changeVideoSource, videoHistory } = useSupabaseRealtime(room.id, room.videoUrl, user);
  const [copyStatus, setCopyStatus] = useState('Copy Code');
  const [newVideoUrl, setNewVideoUrl] = useState('');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.room_code);
    setCopyStatus('Copied!');
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
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onLeaveRoom}
            className="flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-full transition-colors"
            aria-label="Leave room"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">{room.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-gray-400">Share Code:</p>
              <p className="text-blue-400 font-mono text-lg bg-gray-700 px-3 py-1 rounded-md">{room.room_code}</p>
              <button onClick={handleCopyCode} className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-md transition-colors">
                <ClipboardCopyIcon className="h-4 w-4" />
                {copyStatus}
              </button>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSetVideo} className="mb-6 bg-gray-800 p-4 rounded-xl flex flex-col sm:flex-row items-center gap-3">
        <label htmlFor="video-url-input" className="font-semibold text-white sr-only">Video URL</label>
        <div className="relative w-full">
            <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                <LinkIcon className="w-5 h-5 text-gray-400" />
            </div>
            <input
                id="video-url-input"
                type="url"
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                placeholder="Enter YouTube or video URL to start or change the video"
                className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block ps-10 p-2.5"
                required
            />
        </div>
        <button type="submit" className="w-full sm:w-auto text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center">
            Set Video
        </button>
      </form>

      <VideoHistory history={videoHistory} onSelectVideo={changeVideoSource} />

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:flex-grow lg:w-3/4">
          <VideoPlayer 
            videoState={videoState} 
            sendVideoAction={sendVideoAction} 
          />
        </div>
        <div className="lg:w-1/4 lg:max-w-sm flex-shrink-0">
          <Chat 
            messages={messages} 
            sendMessage={sendMessage} 
            currentUser={user}
          />
        </div>
      </div>
    </div>
  );
};

export default Theater;