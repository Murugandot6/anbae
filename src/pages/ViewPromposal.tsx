import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactPlayer from 'react-player/lazy';
import { OnProgressProps } from 'react-player/base';
import KaraokeLyrics from '@/components/watch-party/KaraokeLyrics';
import { parseLRC } from '@/lib/lrcParser';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, Copy, Check, ArrowLeft } from 'lucide-react'; // Added ArrowLeft
import { Helmet } from 'react-helmet-async'; // Import Helmet
import LoadingPulsar from '@/components/LoadingPulsar';

interface Proposal {
  id: string;
  video_url: string;
  lrc_content: string;
}

const LoadingSpinner = () => (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground">
        <LoadingPulsar />
        <p className="mt-4 text-base sm:text-xl">Loading Your Special Message...</p>
    </div>
);

const ErrorDisplay = ({ message }: { message: string }) => (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground text-center p-4">
        <h2 className="text-xl sm:text-2xl font-bold text-destructive mb-3 sm:mb-4">Oops!</h2>
        <p className="text-sm sm:text-base">{message}</p>
        <Link to="/dashboard">
            <Button variant="outline" className="mt-4 text-foreground border-border hover:bg-accent hover:text-accent-foreground text-sm sm:text-base px-4 py-2 sm:px-6 sm:py-3">Back to Dashboard</Button>
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
    <>
      <Helmet>
        <title>Promposal - Anbae</title>
        <meta name="description" content="View a special video promposal with synchronized lyrics created on Anbae." />
      </Helmet>
      <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center p-4 md:p-8 text-foreground overflow-hidden">
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

        {/* Top left and right controls */}
        <div className="absolute top-3 left-3 flex items-center gap-2 z-20">
          <Link to="/dashboard">
              <Button variant="outline" size="icon" className="w-9 h-9 sm:w-10 sm:h-10 text-foreground border-border hover:bg-accent hover:text-accent-foreground rounded-full shadow-md">
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
          </Link>
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
          <Button onClick={handleCopyLink} variant="ghost" size="icon" className="w-9 h-9 sm:w-10 sm:h-10 text-foreground hover:bg-accent hover:text-accent-foreground">
            {copyStatus ? <Check className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /> : <Copy className="w-4 h-4 sm:w-5 sm:h-5" />}
          </Button>
        </div>
        
        {/* Main content area for lyrics */}
        <div className="w-full h-full flex flex-col justify-center items-center">
          <KaraokeLyrics lyrics={parsedLyrics} currentTime={currentTime} />
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md sm:max-w-xl z-20"> {/* Adjusted max-width */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 mt-4 p-2 bg-card/80 rounded-full shadow-lg backdrop-blur-md border border-border/50"> {/* Adjusted padding and gap */}
              <Button onClick={() => setIsPlaying(!isPlaying)} variant="ghost" size="icon" className="w-9 h-9 sm:w-10 sm:h-10 text-foreground hover:bg-accent hover:text-accent-foreground">
                {isPlaying ? <Pause className="w-5 h-5 sm:w-6 sm:h-6" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6" />}
              </Button>
              <input
                type="range"
                min={0}
                max={duration}
                value={currentTime}
                onChange={(e) => playerRef.current?.seekTo(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer range-sm accent-primary"
              />
              <Button onClick={() => setIsMuted(!isMuted)} variant="ghost" size="icon" className="w-9 h-9 sm:w-10 sm:h-10 text-foreground hover:bg-accent hover:text-accent-foreground">
                {isMuted ? <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" /> : <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />}
              </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewPromposal;