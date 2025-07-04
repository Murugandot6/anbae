import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useWaveRoomRealtime } from '@/hooks/useWaveRoomRealtime';
import StationBrowser from '@/components/waveroom/StationBrowser';
import AudioPlayer from '@/components/waveroom/AudioPlayer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Radio } from 'lucide-react';

const LoadingSpinner = () => (
    <div className="h-screen w-screen bg-gray-900 flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4">Joining Room...</p>
    </div>
);

const WaveRoomTheater: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  
  if (!roomCode) {
    return <Navigate to="/waveroom" replace />;
  }

  const { room, error, setStation, setPlayState } = useWaveRoomRealtime(roomCode);

  if (error) {
    return (
      <div className="h-screen w-screen bg-gray-900 flex flex-col items-center justify-center text-center text-white">
        <h2 className="text-2xl font-bold text-red-400">Error</h2>
        <p className="mt-2">{error}</p>
        <Link to="/waveroom">
          <Button variant="outline" className="mt-4">Go Back</Button>
        </Link>
      </div>
    );
  }

  if (!room) {
    return <LoadingSpinner />;
  }

  return (
    <div className="h-screen w-screen bg-gray-900 text-gray-200 flex flex-col antialiased">
      <header className="bg-gray-800/70 backdrop-blur-md border-b border-gray-700 p-4 shadow-lg z-20 sticky top-0">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/waveroom">
              <Button variant="ghost" size="icon" className="text-white hover:bg-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <Radio className="w-8 h-8 text-indigo-400" />
            <div className="flex items-baseline gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-white">FM Party</h1>
                <span className="font-mono text-lg text-indigo-300 bg-gray-700 px-2 py-0.5 rounded-md">{room.room_code}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto pb-28">
        <StationBrowser 
            currentStation={room.current_station}
            onSelectStation={setStation}
        />
      </main>

      {room.current_station && (
        <AudioPlayer 
            station={room.current_station}
            isPlaying={room.is_playing}
            onTogglePlay={() => setPlayState(!room.is_playing)}
            onClear={() => setStation(null)}
        />
      )}
    </div>
  );
};

export default WaveRoomTheater;