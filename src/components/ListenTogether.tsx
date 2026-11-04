"use client";

import React, { useState, useEffect } from 'react';
import { Users, Copy, Check, Info, LogIn, LogOut } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { useMusic } from '@/context/MusicContext';

export const ListenTogether = () => {
  const { roomCode, setRoomCode, isHost, setIsHost } = useMusic();
  const [localCode, setLocalCode] = useState(`ISAI-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode || localCode);
    setCopied(true);
    toast.success("Room code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleHost = () => {
    setRoomCode(localCode);
    setIsHost(true);
    toast.success("Room created! Share your code to start syncing.");
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.length < 4) {
      toast.error("Please enter a valid code");
      return;
    }
    setRoomCode(joinCode);
    setIsHost(false);
    toast.success(`Joined room: ${joinCode}`);
  };

  const handleLeave = () => {
    setRoomCode(null);
    setIsHost(false);
    toast.info("Left the session");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all text-xs font-bold shadow-lg ${roomCode ? 'bg-green-500 text-white shadow-green-500/20' : 'bg-primary text-primary-foreground shadow-primary/20'}`}>
          <Users size={16} />
          <span>{roomCode ? (isHost ? 'Hosting' : 'Joined') : 'Listen Together'}</span>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-black">
            <Users className="text-primary" />
            Social Sync
          </DialogTitle>
          <DialogDescription>
            {roomCode ? `Currently in room: ${roomCode}` : 'Listen to music in real-time with your friends.'}
          </DialogDescription>
        </DialogHeader>
        
        {roomCode ? (
          <div className="space-y-6 pt-4">
            <div className="bg-accent/5 rounded-2xl p-6 border border-accent/10 text-center">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-2">Room Code</p>
              <h3 className="text-3xl font-black tracking-tighter text-foreground mb-4">{roomCode}</h3>
              <div className="flex gap-2">
                <Button onClick={copyCode} variant="outline" className="flex-1 gap-2 rounded-xl border-2">
                  {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                  Copy
                </Button>
                <Button onClick={handleLeave} variant="destructive" className="gap-2 rounded-xl">
                  <LogOut size={16} />
                  Leave
                </Button>
              </div>
            </div>
            <div className="flex gap-2 p-3 rounded-xl bg-green-500/5 border border-green-500/10">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mt-1" />
              <p className="text-[10px] text-muted-foreground">
                {isHost ? 'You are controlling the music. All listeners will hear what you play.' : 'Your playback is synced with the host.'}
              </p>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="host" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-2 rounded-xl bg-accent/10">
              <TabsTrigger value="host" className="rounded-lg font-bold">Host</TabsTrigger>
              <TabsTrigger value="join" className="rounded-lg font-bold">Join</TabsTrigger>
            </TabsList>

            <TabsContent value="host" className="space-y-6 pt-6">
              <div className="bg-accent/5 rounded-2xl p-6 border border-accent/10 text-center">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-2">New Session Code</p>
                <h3 className="text-3xl font-black tracking-tighter text-foreground mb-6">{localCode}</h3>
                <Button onClick={handleHost} className="w-full gap-2 h-12 rounded-xl font-bold shadow-xl shadow-primary/20">
                  Create Room
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="join" className="space-y-6 pt-6">
              <form onSubmit={handleJoin} className="space-y-4">
                <Input 
                  placeholder="Enter Code (e.g. ISAI-XY12Z)" 
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="bg-accent/5 border-2 border-transparent focus-visible:border-primary/20 h-12 text-lg font-bold tracking-widest rounded-xl text-center"
                />
                <Button type="submit" className="w-full gap-2 h-12 rounded-xl font-bold">
                  <LogIn size={18} />
                  Join Room
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        )}

        <div className="flex gap-2 p-3 mt-4 rounded-xl bg-primary/5 border border-primary/10">
          <Info size={16} className="text-primary shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Real-time sync uses Supabase Broadcast. The host controls the queue and progress for everyone in the room.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};