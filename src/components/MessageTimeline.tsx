import React from 'react';
import { Link } from 'react-router-dom';
import { Message, Profile } from '@/types/supabase';
import { formatMessageDate, cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MessageTimelineProps {
  sentMessages: Message[];
  receivedMessages: Message[];
  currentUserId: string;
  currentUserProfile: Profile | null;
  partnerProfile: Profile | null;
}

const MessageTimeline: React.FC<MessageTimelineProps> = ({
  sentMessages,
  receivedMessages,
  currentUserId,
  currentUserProfile,
  partnerProfile,
}) => {
  // Combine and sort messages by creation date
  const allMessages = [...sentMessages, ...receivedMessages].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Limit to the most recent 6 messages for the dashboard view
  const recentMessages = allMessages.slice(0, 6);

  if (recentMessages.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <p className="text-lg">No recent messages to display.</p>
        <p className="text-sm mt-2">Start a conversation by sending a message!</p>
        <Link to="/send-message">
          <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700">
            Send New Message
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative py-8">
      {/* Vertical timeline line */}
      <div className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-gray-200 dark:bg-gray-700 h-full top-0 z-0"></div>

      <div className="space-y-8">
        {recentMessages.map((message, index) => {
          const isSentByCurrentUser = message.sender_id === currentUserId;

          return (
            <div
              key={message.id}
              className={cn(
                "flex items-center w-full gap-4",
                isSentByCurrentUser ? "flex-row-reverse" : "flex-row"
              )}
            >
              {/* Date Pill */}
              <div className={cn(
                "flex-shrink-0 w-32 text-center", // Fixed width for the date pill container
                isSentByCurrentUser ? "text-left" : "text-right" // Align text within the container
              )}>
                <span className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                  {formatMessageDate(message.created_at)}
                </span>
              </div>

              {/* Timeline Dot */}
              <div className="relative z-10 flex-shrink-0 w-4 h-4">
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-blue-500 dark:bg-purple-500 border-2 border-white dark:border-gray-800"></div>
              </div>

              {/* Message Card */}
              <div
                className={cn(
                  "flex-1 p-4 rounded-xl shadow-lg backdrop-blur-sm border",
                  isSentByCurrentUser
                    ? "bg-blue-100/30 dark:bg-blue-950/30 border-blue-300/30 dark:border-blue-700/30"
                    : "bg-green-100/30 dark:bg-green-950/30 border-green-300/30 dark:border-green-700/30"
                )}
              >
                <Link to={`/messages/${message.id}`} className="block">
                  <Card className="bg-transparent border-none shadow-none">
                    <CardHeader className="p-0 pb-2 flex flex-row items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                        {message.subject}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 text-muted-foreground text-sm line-clamp-2">
                      {message.content}
                    </CardContent>
                    {/* Removed read status as per design */}
                  </Card>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MessageTimeline;