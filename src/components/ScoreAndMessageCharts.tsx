import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Profile, Message } from '@/types/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

interface ScoreAndMessageChartsProps {
  currentUserProfile: Profile | null;
  partnerProfile: Profile | null;
  sentMessages: Message[];
  receivedMessages: Message[];
}

const ScoreAndMessageCharts: React.FC<ScoreAndMessageChartsProps> = ({
  currentUserProfile,
  partnerProfile,
  sentMessages,
  receivedMessages,
}) => {
  const [selectedChart, setSelectedChart] = useState<'scores' | 'sent' | 'received' | 'mood'>('scores');
  const { theme } = useTheme();

  // 1. Lifetime Score Data
  const scoreData = [
    {
      name: 'You',
      score: currentUserProfile?.lifetime_score ?? 100,
      fill: 'hsl(var(--primary))',
      darkFill: 'hsl(var(--primary))',
    },
    {
      name: partnerProfile?.username || 'Partner',
      score: partnerProfile?.lifetime_score ?? 100,
      fill: 'hsl(var(--secondary))',
      darkFill: 'hsl(var(--secondary))',
    },
  ];

  // 2. Message Type Counts (Sent)
  const sentMessageTypeCounts = sentMessages.reduce((acc, msg) => {
    acc[msg.message_type] = (acc[msg.message_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sentMessageTypeData = Object.keys(sentMessageTypeCounts).map(type => ({
    name: type,
    count: sentMessageTypeCounts[type],
  }));

  // 3. Message Type Counts (Received)
  const receivedMessageTypeCounts = receivedMessages.reduce((acc, msg) => {
    acc[msg.message_type] = (acc[msg.message_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const receivedMessageTypeData = Object.keys(receivedMessageTypeCounts).map(type => ({
    name: type,
    count: receivedMessageTypeCounts[type],
  }));

  // 4. Overall Mood Distribution (Sent + Received)
  const allMessages = [...sentMessages, ...receivedMessages];
  const moodCounts = allMessages.reduce((acc, msg) => {
    acc[msg.mood] = (acc[msg.mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const moodData = Object.keys(moodCounts).map(mood => ({
    name: mood,
    count: moodCounts[mood],
  }));

  const renderCustomBar = (props: any) => {
    const { x, y, width, height, fill, darkFill } = props;
    const currentFill = theme === 'dark' ? darkFill : fill;
    return <rect x={x} y={y} width={width} height={height} fill={currentFill} rx={4} ry={4} />;
  };

  return (
    <Card className="bg-card/60 dark:bg-card/60 shadow-lg backdrop-blur-md border border-border/50 p-3 sm:p-4 rounded-xl">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="text-foreground text-center text-lg sm:text-xl">Communication Insights</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mb-4 sm:mb-6">
          <Button
            variant={selectedChart === 'scores' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedChart('scores')}
            className={cn(
              "rounded-full text-xs sm:text-sm px-3 py-1.5 h-auto",
              selectedChart === 'scores' ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'text-foreground border-border hover:bg-accent hover:text-accent-foreground'
            )}
          >
            Lifetime Scores
          </Button>
          <Button
            variant={selectedChart === 'sent' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedChart('sent')}
            className={cn(
              "rounded-full text-xs sm:text-sm px-3 py-1.5 h-auto",
              selectedChart === 'sent' ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'text-foreground border-border hover:bg-accent hover:text-accent-foreground'
            )}
          >
            Sent Messages
          </Button>
          <Button
            variant={selectedChart === 'received' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedChart('received')}
            className={cn(
              "rounded-full text-xs sm:text-sm px-3 py-1.5 h-auto",
              selectedChart === 'received' ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'text-foreground border-border hover:bg-accent hover:text-accent-foreground'
            )}
          >
            Received Messages
          </Button>
          <Button
            variant={selectedChart === 'mood' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedChart('mood')}
            className={cn(
              "rounded-full text-xs sm:text-sm px-3 py-1.5 h-auto",
              selectedChart === 'mood' ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'text-foreground border-border hover:bg-accent hover:text-accent-foreground'
            )}
          >
            Overall Moods
          </Button>
        </div>

        <div className="h-[200px] sm:h-[250px] w-full">
          {selectedChart === 'scores' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--foreground))" tick={{ fontSize: 12 }} />
                <YAxis stroke="hsl(var(--foreground))" domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--foreground))',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: 'hsl(var(--foreground))', fontSize: '12px' }}
                />
                <Bar dataKey="score" shape={renderCustomBar} />
              </BarChart>
            </ResponsiveContainer>
          )}

          {selectedChart === 'sent' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sentMessageTypeData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--foreground))" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} stroke="hsl(var(--foreground))" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--foreground))',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: 'hsl(var(--foreground))', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          )}

          {selectedChart === 'received' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={receivedMessageTypeData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--foreground))" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} stroke="hsl(var(--foreground))" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--foreground))',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: 'hsl(var(--foreground))', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="hsl(var(--secondary))" />
              </BarChart>
            </ResponsiveContainer>
          )}

          {selectedChart === 'mood' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moodData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--foreground))" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} stroke="hsl(var(--foreground))" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--foreground))',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: 'hsl(var(--foreground))', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="hsl(var(--accent))" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ScoreAndMessageCharts;