import React from 'react';
import { Link } from 'react-router-dom';
import { Message, Profile } from '@/types/supabase';
import { formatMessageDate, cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

  const allMessages = [...sentMessages, ...receivedMessages].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const recentMessages = allMessages.slice(0, 6);

  if (recentMessages.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-6 sm:py-8">
        <p className="text-base sm:text-lg">No recent messages to display.</p>
        <p className="text-sm mt-1 sm:mt-2">Start a conversation by sending a message!</p>
        <Link to="/send-message">
          <Button className="mt-3 sm:mt-4 bg-primary hover:bg-primary/90 text-primary-foreground text-sm sm:text-base px-4 py-2 sm:px-6 sm:py-3">
            Send New Message
          </Button>
        </Link>
      </div>
    );
  }

  const getMessageTypeEmoji = (messageType: string) => {
    switch (messageType) {
      case 'Grievance':
        return '💔';
      case 'Compliment':
        return '💖';
      case 'Good Memory':
        return '✨';
      case 'How I Feel':
        return '🤔';
      default:
        return '';
    }
  };

  return (
    <div className="relative py-6 sm:py-8">
      <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 sm:w-1 bg-border dark:bg-border/50 h-full top-0 z-0"></div>

      <div className="space-y-6 sm:space-y-8">
        {recentMessages.map((message, index) => {
          const isSentByCurrentUser = message.sender_id === currentUserId;

          return (
            <div key={message.id} className="relative flex items-center w-full">
              <div className="absolute left-1/2 transform -translate-x-1/2 z-10 flex items-center justify-center">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-primary dark:bg-secondary border-2 border-background dark:border-background"></div>
              </div>

              {isSentByCurrentUser ? (
                <>
                  <div className="flex-1 flex justify-end pr-4">
                    <span className="inline-block bg-gradient-to-r from-primary to-secondary text-primary-foreground px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-semibold shadow-md">
                      {formatMessageDate(message.created_at)}
                    </span>
                  </div>
                  <div className="flex-1 flex justify-start pl-4">
                    <div
                      className={cn(
                        "p-2 sm:p-4 rounded-xl shadow-lg backdrop-blur-sm border max-w-[160px] sm:max-w-md w-full transition-all duration-300 hover:scale-[1.02]",
                        "bg-card/60 dark:bg-card/60 border-border/50 dark:border-border/50"
                      )}
                    >
                      <Link to={`/messages/${message.id}`} className="block">
                        <Card className="bg-transparent border-none shadow-none">
                          <CardHeader className="p-0 pb-1 sm:pb-2 flex flex-row items-center justify-between gap-2">
                            <CardTitle className={cn(
                              "font-semibold text-foreground flex items-center gap-1 sm:gap-2 truncate",
                              isMobile ? "text-xs" : "text-base sm:text-lg"
                            )}>
                              {getMessageTypeEmoji(message.message_type)}
                              <span className="truncate">{message.subject}</span>
                            </CardTitle>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {message.hasUnreadReplies && (
                                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-score-positive rounded-full animate-pulse" title="New Reply"></div>
                              )}
                              <Badge
                                variant={message.status === 'closed' ? 'secondary' : 'default'}
                                className="capitalize text-xs px-2 py-0.5"
                              >
                                {message.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-0 text-muted-foreground text-xs line-clamp-2">
                            {message.content}
                          </CardContent>
                        </Card>
                      </Link>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-1 flex justify-end pr-4">
                    <div
                      className={cn(
                        "p-2 sm:p-4 rounded-xl shadow-lg backdrop-blur-sm border max-w-[160px] sm:max-w-md w-full transition-all duration-300 hover:scale-[1.02]",
                        "bg-card/60 dark:bg-card/60 border-border/50 dark:border-border/50"
                      )}
                    >
                      <Link to={`/messages/${message.id}`} className="block">
                        <Card className="bg-transparent border-none shadow-none">
                          <CardHeader className="p-0 pb-1 sm:pb-2 flex flex-row items-center justify-between gap-2">
                            <CardTitle className={cn(
                              "font-semibold text-foreground flex items-center gap-1 sm:gap-2 truncate",
                              isMobile ? "text-xs" : "text-base sm:text-lg"
                            )}>
                              {getMessageTypeEmoji(message.message_type)}
                              <span className="truncate">{message.subject}</span>
                            </CardTitle>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {!message.is_read && (
                                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" title="New Message"></div>
                              )}
                              {message.hasUnreadReplies && (
                                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-score-positive rounded-full animate-pulse" title="New Reply"></div>
                              )}
                              <Badge
                                variant={message.status === 'closed' ? 'secondary' : 'default'}
                                className="capitalize text-xs px-2 py-0.5"
                              >
                                {message.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-0 text-muted-foreground text-xs line-clamp-2">
                            {message.content}
                          </CardContent>
                        </Card>
                      </Link>
                    </div>
                  </div>
                  <div className="flex-1 flex justify-start pl-4">
                    <span className="inline-block bg-gradient-to-r from-primary to-secondary text-primary-foreground px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-semibold shadow-md">
                      {formatMessageDate(message.created_at)}
                    </span>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MessageTimeline;