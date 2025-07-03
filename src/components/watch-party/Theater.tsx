import React, { useState, useMemo } from 'react';
import { Room, User } from '@/types/watchParty';
import VideoPlayer from '@/components/watch-party/VideoPlayer';
import Chat from '@/components/watch-party/Chat';
import { useSupabaseRealtime } from '@/hooks/watch-party/useSupabaseRealtime';
import { ClipboardCopyIcon, LinkIcon } from '@/components/watch-party/icons';
import VideoHistory from '@/components/watch-party/VideoHistory';
import { ArrowLeft, MessageCircle, Music } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
import KaraokeLyrics from '@/components/watch-party/KaraokeLyrics';
import { parseLRC } from '@/lib/lrcParser';

interface TheaterProps {
  room: Room;
  user: User;
  onLeaveRoom: () => void;
}

const Theater: React.FC<TheaterProps> = ({ room, user, onLeaveRoom }) => {
  const { videoState, sendVideoAction, messages, sendMessage, changeVideoSource, videoHistory } = useSupabaseRealtime(room.id, room.videoUrl, user);
  const [copyStatus, setCopyStatus] = useState('Copy Code');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [lrcContent, setLrcContent] = useState(`[length:02:31.03]
[re:www.megalobiz.com/lrc/maker]
[ve:v1.2.3]
[00:01.15]I love you still
[00:02.40]And you know I always will
[00:04.16]'Til the end of time
[00:06.16]I won't change my mind
[00:08.92]I swear I'll always give my best, no pretending
[00:12.48]Give you breakfast in bed every morning
[00:16.73]There ain't no answer to this complex question
[00:20.27]I just keep falling for you every day
[00:24.29]Won't ever take up too much time or attention
[00:28.55]Take a second just to make our connection
[00:32.32]I would do anything for your affection
[00:35.58]Kinda fun tryna go about it all the wrong ways
[00:40.36]I'm just so into you, I wanna let it all out
[00:45.87]You're so perfectly fine
[00:48.38]I could talk all day but let me spell it out
[00:53.63]A-B-C-D-E-F-G-H
[00:57.91]I love you still
[00:59.40]And you know I always will
[01:01.40]'Til the end of time
[01:03.65]I won't change my mind
[01:05.67]Love you, I'll be here
[01:07.43]I will never disappear
[01:09.68]Said forever, I swear
[01:11.45]So I will be there
[01:14.75]You said you didn't wanna be like everybody else
[01:18.25]Wanted something only you and I can have ourselves
[01:22.27]Picture perfect isn't something that I've ever felt
[01:25.79]Love when you smile right in front of me
[01:30.55]I'm just so into you, I wanna let it all out
[01:35.30]You're so perfectly fine
[01:38.05]I could talk all day but let me spell it out
[01:43.83]A-B-C-D-E-F-G-H
[01:47.59]I love you still
[01:49.00]And you know I always will
[01:51.12]'Til the end of time
[01:52.90]I won't change my mind
[01:55.12]Love you, I'll be here
[01:56.88]I will never disappear
[01:58.89]Said forever, I swear
[02:00.90]So I will be there
[02:03.70]I love you still
[02:04.73]And you know I always will
[02:06.77]'Til the end of time
[02:08.77]I won't change my mind
[02:10.76]Love you, I'll be here
[02:12.76]I will never disappear
[02:14.78]Said forever, I swear
[02:16.79]So I will be there`);
  const parsedLyrics = useMemo(() => parseLRC(lrcContent), [lrcContent]);

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
        <div className="lg:w-1/4 lg:max-w-sm flex-shrink-0 h-[75vh] lg:h-auto">
          <Tabs defaultValue="chat" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat"><MessageCircle className="w-4 h-4 mr-2" />Chat</TabsTrigger>
              <TabsTrigger value="lyrics"><Music className="w-4 h-4 mr-2" />Lyrics</TabsTrigger>
            </TabsList>
            <TabsContent value="chat" className="flex-grow mt-2">
              <Chat 
                messages={messages} 
                sendMessage={sendMessage} 
                currentUser={user}
              />
            </TabsContent>
            <TabsContent value="lyrics" className="flex-grow mt-2 bg-gray-800 rounded-xl shadow-lg flex flex-col">
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-xl font-bold">Lyrics Input</h3>
                <Textarea
                  value={lrcContent}
                  onChange={(e) => setLrcContent(e.target.value)}
                  placeholder="Paste your .lrc file content here..."
                  className="w-full h-24 mt-2 bg-gray-700 border-gray-600 text-white resize-none"
                />
              </div>
              <div className="flex-grow overflow-hidden">
                <KaraokeLyrics lyrics={parsedLyrics} currentTime={videoState.time} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Theater;