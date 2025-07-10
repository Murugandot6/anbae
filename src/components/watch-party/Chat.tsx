import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, User } from '@/types/watchParty';
import { Send, X } from 'lucide-react'; // Updated import
import { cn } from '@/lib/utils'; // Ensure cn is imported

interface ChatProps {
  messages: ChatMessage[];
  sendMessage: (text: string) => void;
  currentUser: User;
  isTheaterFullscreen?: boolean;
  isMobile?: boolean;
  onClose?: () => void; // New prop to handle closing the chat panel
}

const Chat: React.FC<ChatProps> = ({ messages, sendMessage, currentUser, isTheaterFullscreen, isMobile, onClose }) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-full min-h-0",
      isTheaterFullscreen && isMobile
        ? "bg-black text-white rounded-none shadow-none border-none"
        : "backdrop-blur-md border border-border/50 rounded-xl shadow-lg"
    )}>
      
      <div className={cn("flex-shrink-0 flex items-center justify-between p-3 sm:p-4 border-b border-border/50", isTheaterFullscreen && isMobile ? "bg-black/50 border-white/20" : "bg-card/50 rounded-t-xl")}>
        <h3 className="text-lg sm:text-xl font-bold text-foreground">Live Chat</h3>
        {!isMobile && onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            aria-label="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-grow p-3 sm:p-4 overflow-y-auto space-y-3 sm:space-y-4">
        {messages.map((msg) => (
           <div key={msg.id} className={`flex items-start gap-2 ${msg.isSystem ? 'justify-center' : ''} ${msg.author === currentUser.name ? 'justify-end' : ''}`}>
             {msg.isSystem ? (
                <span className="text-xs text-center text-muted-foreground italic px-2 py-1 bg-muted/20 rounded-full">{msg.text}</span>
             ) : (
                <div className={cn(
                  "flex flex-col w-full max-w-[280px] sm:max-w-[320px] leading-1.5 p-2.5 sm:p-3 border-border/50 rounded-xl shadow-sm",
                  msg.author === currentUser.name
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-muted/20 text-foreground rounded-bl-none"
                )}>
                  <div className="flex items-center space-x-1.5 sm:space-x-2 rtl:space-x-reverse">
                    <span className={cn(
                      "text-xs sm:text-sm font-semibold",
                      msg.author === currentUser.name ? "text-primary-foreground" : "text-foreground"
                    )}>{msg.author}</span>
                    <span className={cn(
                      "text-xs font-normal",
                      msg.author === currentUser.name ? "text-primary-foreground/80" : "text-muted-foreground"
                    )}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className={cn(
                    "text-sm font-normal py-1.5 sm:py-2",
                    msg.author === currentUser.name ? "text-primary-foreground" : "text-foreground"
                  )}>{msg.text}</p>
                </div>
              )}
           </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className={cn("flex-shrink-0 p-3 sm:p-4 border-t border-border/50", isTheaterFullscreen && isMobile ? "bg-black/50 border-white/20" : "bg-card/50 rounded-b-xl")}>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Say something..."
            className="flex-grow px-3 py-2 bg-input/50 border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition text-sm sm:text-base"
          />
          <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground p-2.5 sm:p-3 rounded-lg transition-colors">
            <Send className="w-4 h-4 sm:w-5 h-5" />
          </button>
        </div>
      </form>

    </div>
  );
};

export default Chat;