import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Profile, Message } from '@/types/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button'; // Import Button
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes'; // Import useTheme to get current theme

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
  const { theme } = useTheme(); // Get current theme

  // 1. Lifetime Score Data
  const scoreData = [
    {
      name: 'You',
      score: currentUserProfile?.lifetime_score ?? 100,
      fill: 'hsl(222.2 47.4% 11.2%)', // primary color
      darkFill: 'hsl(210 40% 98%)', // primary-foreground for dark
    },
    {
      name: partnerProfile?.username || 'Partner',
      score: partnerProfile?.lifetime_score ?? 100,
      fill: 'hsl(217.2 32.6% 17.5%)', // secondary color
      darkFill: 'hsl(217.2 32.6% 17.5%)', // secondary color for dark
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
    <Card className="bg-white/30 dark:bg-gray-800/30 shadow-lg backdrop-blur-sm border border-white/30 dark:border-gray-600/30 p-4">
      <CardHeader className="pb-4">
        <CardTitle className="text-gray-900 dark:text-white text-center">Communication Insights</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          <Button
            variant={selectedChart === 'scores' ? 'default' : 'outline'}
            size="sm" // Make button small
            onClick={() => setSelectedChart('scores')}
            className={cn(
              "rounded-full", // Make button rounded
              selectedChart === 'scores' ? 'bg-blue-600 hover:bg-blue-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700' : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
            )}
          >
            Lifetime Scores
          </Button>
          <Button
            variant={selectedChart === 'sent' ? 'default' : 'outline'}
            size="sm" // Make button small
            onClick={() => setSelectedChart('sent')}
            className={cn(
              "rounded-full", // Make button rounded
              selectedChart === 'sent' ? 'bg-blue-600 hover:bg-blue-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700' : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
            )}
          >
            Sent Messages
          </Button>
          <Button
            variant={selectedChart === 'received' ? 'default' : 'outline'}
            size="sm" // Make button small
            onClick={() => setSelectedChart('received')}
            className={cn(
              "rounded-full", // Make button rounded
              selectedChart === 'received' ? 'bg-blue-600 hover:bg-blue-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700' : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
            )}
          >
            Received Messages
          </Button>
          <Button
            variant={selectedChart === 'mood' ? 'default' : 'outline'}
            size="sm" // Make button small
            onClick={() => setSelectedChart('mood')}
            className={cn(
              "rounded-full", // Make button rounded
              selectedChart === 'mood' ? 'bg-blue-600 hover:bg-blue-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700' : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
            )}
          >
            Overall Moods
          </Button>
        </div>

        <div className="h-[250px] w-full"> {/* Fixed height for chart container */}
          {selectedChart === 'scores' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                <YAxis stroke="hsl(var(--foreground))" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--foreground))',
                  }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="score" shape={renderCustomBar} />
              </BarChart>
            </ResponsiveContainer>
          )}

          {selectedChart === 'sent' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sentMessageTypeData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                <YAxis allowDecimals={false} stroke="hsl(var(--foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--foreground))',
                  }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          )}

          {selectedChart === 'received' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={receivedMessageTypeData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                <YAxis allowDecimals={false} stroke="hsl(var(--foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--foreground))',
                  }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="count" fill="hsl(var(--secondary))" />
              </BarChart>
            </ResponsiveContainer>
          )}

          {selectedChart === 'mood' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moodData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                <YAxis allowDecimals={false} stroke="hsl(var(--foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--foreground))',
                  }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
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