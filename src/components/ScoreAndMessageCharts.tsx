import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Profile, Message } from '@/types/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
    const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    const currentFill = theme === 'dark' ? darkFill : fill;
    return <rect x={x} y={y} width={width} height={height} fill={currentFill} rx={4} ry={4} />;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
      {/* Lifetime Score Comparison */}
      <Card className="bg-white/30 dark:bg-gray-800/30 shadow-lg backdrop-blur-sm border border-white/30 dark:border-gray-600/30">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Lifetime Score Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
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
        </CardContent>
      </Card>

      {/* Sent Message Types */}
      <Card className="bg-white/30 dark:bg-gray-800/30 shadow-lg backdrop-blur-sm border border-white/30 dark:border-gray-600/30">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Sent Message Types</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
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
        </CardContent>
      </Card>

      {/* Received Message Types */}
      <Card className="bg-white/30 dark:bg-gray-800/30 shadow-lg backdrop-blur-sm border border-white/30 dark:border-gray-600/30">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Received Message Types</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
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
        </CardContent>
      </Card>

      {/* Overall Mood Distribution */}
      <Card className="bg-white/30 dark:bg-gray-800/30 shadow-lg backdrop-blur-sm border border-white/30 dark:border-gray-600/30">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Overall Mood Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default ScoreAndMessageCharts;