import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactPlayer from 'react-player/lazy';
import { OnProgressProps } from 'react-player/base';
import KaraokeLyrics from '@/components/watch-party/KaraokeLyrics';
import { parseLRC } from '@/lib/lrcParser';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, Copy, Check } from 'lucide-react';

interface Proposal {
  id: string;
  video_url: string;
  lrc_content: string;
}

const LoadingSpinner = () => (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xl">Loading Your Special Message...</p>
    </div>
);

const ErrorDisplay = ({ message }: { message: string }) => (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white text-center p-4">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Oops!</h2>
        <p>{message}</p>
        <Link to="/dashboard">
            <Button variant="outline" className="mt-4">Back to Dashboard</Button>
        </Link>
    </div>
);

const ViewPromposal = () => {
  const { id } = useParams<{ id: string }>();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [copyStatus, setCopyStatus] = useState(false);
  const playerRef = useRef<ReactPlayer>(null);

  useEffect(() => {
    if (!id) {
      setError("No promposal ID provided.");
      setIsLoading(false);
      return;
    }
    const fetchProposal = async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select('id, video_url, lrc_content')
        .eq('id', id)
        .single();

      if (error || !data) {
        setError("Could not find this promposal. The link may be incorrect or it may have been deleted.");
        setIsLoading(false);
      } else {
        setProposal(data);
        setIsLoading(false);
      }
    };
    fetchProposal();
  }, [id]);

  const parsedLyrics = useMemo(() => {
    return proposal ? parseLRC(proposal.lrc_content) : [];
  }, [proposal]);

  const handleProgress = (state: OnProgressProps) => {
    setCurrentTime(state.playedSeconds);
  };

  const handleDuration = (duration: number) => {
    setDuration(duration);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopyStatus(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopyStatus(false), 2000);
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay message={error} />;
  if (!proposal) return <ErrorDisplay message="Something went wrong." />;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4 md:p-8 text-white overflow-hidden">
      {/* Hidden ReactPlayer for audio playback */}
      <div style={{ display: 'none' }}>
        <ReactPlayer
          ref={playerRef}
          url={proposal.video_url}
          playing={isPlaying}
          muted={isMuted}
          onProgress={handleProgress}
          onDuration={handleDuration}
          progressInterval={100}
        />
      </div>

      {/* Top right controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
        <Button onClick={handleCopyLink} variant="ghost" size="icon">
          {copyStatus ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
        </Button>
        <Link to="/dashboard">
            <Button variant="outline">Dashboard</Button>
        </Link>
      </div>
      
      {/* Main content area for lyrics */}
      <div className="w-full h-full flex flex-col justify-center items-center">
        <KaraokeLyrics lyrics={parsedLyrics} currentTime={currentTime} />
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-xl z-20">
        <div className="flex items-center justify-center gap-4 mt-4 p-2 bg-gray-900/50 rounded-full">
            <Button onClick={() => setIsPlaying(!isPlaying)} variant="ghost" size="icon">
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </Button>
            <input
              type="range"
              min={0}
              max={duration}
              value={currentTime}
              onChange={(e) => playerRef.current?.seekTo(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer range-sm accent-pink-500"
            />
            <Button onClick={() => setIsMuted(!isMuted)} variant="ghost" size="icon">
              {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </Button>
        </div>
      </div>
    </div>
  );
};

export default ViewPromposal;