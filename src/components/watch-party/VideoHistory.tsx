import React, { useState } from 'react';
import { VideoHistoryEntry } from '@/types/watchParty';
import { HistoryIcon } from '@/components/watch-party/icons';
import { Button } from '@/components/ui/button'; // Import shadcn Button
import { cn } from '@/lib/utils';

interface VideoHistoryProps {
  history: VideoHistoryEntry[];
  onSelectVideo: (url: string) => void;
  className?: string;
}

const VideoHistory: React.FC<VideoHistoryProps> = ({ history, onSelectVideo, className }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (history.length === 0) {
    return null;
  }

  return (
    <div className={cn("bg-card/60 backdrop-blur-md border border-border/50 rounded-xl shadow-lg", className)}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 text-left font-semibold text-foreground bg-transparent hover:bg-accent/20 rounded-xl"
        variant="ghost"
      >
        <div className="flex items-center gap-3">
          <HistoryIcon className="w-6 h-6 text-muted-foreground" />
          <span>Video History ({history.length})</span>
        </div>
        <svg
          className={`w-5 h-5 transform transition-transform text-foreground ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>
      {isOpen && (
        <div className="p-4 border-t border-border/50 max-h-60 overflow-y-auto">
          <ul className="space-y-3">
            {history.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-2 p-2 bg-muted/20 rounded-lg border border-border/50 shadow-sm">
                <div className="flex-grow overflow-hidden">
                  <p className="text-sm text-foreground truncate" title={item.videoUrl}>{item.videoUrl}</p>
                  <p className="text-xs text-muted-foreground">Added by {item.addedBy}</p>
                </div>
                <Button
                  onClick={() => onSelectVideo(item.videoUrl)}
                  className="flex-shrink-0 text-sm bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-3 py-1 rounded-md transition-colors"
                  size="sm"
                >
                  Watch
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default VideoHistory;