import React, { useState } from 'react';
import { VideoHistoryEntry } from '../types';
import { HistoryIcon } from './icons';

interface VideoHistoryProps {
  history: VideoHistoryEntry[];
  onSelectVideo: (url: string) => void;
}

const VideoHistory: React.FC<VideoHistoryProps> = ({ history, onSelectVideo }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (history.length === 0) {
    return null; // Don't show anything if there's no history
  }

  return (
    <div className="bg-gray-800 rounded-xl mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 text-left font-semibold text-white"
      >
        <div className="flex items-center gap-3">
          <HistoryIcon className="w-6 h-6 text-gray-400" />
          <span>Video History ({history.length})</span>
        </div>
        <svg
          className={`w-5 h-5 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="p-4 border-t border-gray-700 max-h-60 overflow-y-auto">
          <ul className="space-y-3">
            {history.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-2 p-2 bg-gray-700 rounded-lg">
                <div className="flex-grow overflow-hidden">
                  <p className="text-sm text-white truncate" title={item.videoUrl}>{item.videoUrl}</p>
                  <p className="text-xs text-gray-400">Added by {item.addedBy}</p>
                </div>
                <button
                  onClick={() => onSelectVideo(item.videoUrl)}
                  className="flex-shrink-0 text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1 rounded-md transition-colors"
                >
                  Watch
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default VideoHistory;