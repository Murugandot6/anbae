import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, User } from '@/types/watchParty';
import { SendIcon } from '@/components/watch-party/icons';
import { cn } from '@/lib/utils'; // Ensure cn is imported
import { X } from 'lucide-react'; // Import X icon
import { Button } from '@/components/ui/button'; // Import Button for the close icon

interface ChatProps {
  messages: ChatMessage[];
  sendMessage: (text: string) => void;
  currentUser: User;
  isOverlay?: boolean; // New prop
  onClose?: () => void; // New prop for closing the overlay
}

const Chat: React.FC<ChatProps> = ({ messages, sendMessage, currentUser, isOverlay, onClose }) => {
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
    // The key is that this component ITSELF is a flex column and takes full height
    <div className={cn(
      "flex flex-col h-full min-h-0", // h-full and min-h-0 are crucial here
      // Removed bg-card/90 and bg-card/60 from here to make the main chat body transparent
      isOverlay ? "backdrop-blur-md rounded-xl shadow-lg" : "backdrop-blur-md border border-border/50 rounded-xl shadow-lg"
    )}>
      
      {/* 1. Header (Does not grow) */}
      <div className={cn("flex-shrink-0 flex items-center justify-between p-3 sm:p-4 border-b border-border/50", isOverlay ? "bg-card/50 rounded-t-xl" : "")}> {/* Adjusted padding */}
        <h3 className="text-lg sm:text-xl font-bold text-foreground">Live Chat</h3> {/* Adjusted font size */}
        {isOverlay && onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-accent/20"
            aria-label="Close chat"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* 2. Messages List (This is the part that grows and scrolls) */}
      <div className="flex-grow p-3 sm:p-4 overflow-y-auto space-y-3 sm:space-y-4"> {/* flex-grow and overflow-y-auto are key, adjusted padding and gap */}
        {messages.map((msg) => (
           <div key={msg.id} className={`flex items-start gap-2 ${msg.isSystem ? 'justify-center' : ''} ${msg.author === currentUser.name ? 'justify-end' : ''}`}> {/* Adjusted gap */}
             {msg.isSystem ? (
                <span className="text-xs text-center text-muted-foreground italic px-2 py-1 bg-muted/20 rounded-full">{msg.text}</span>
             ) : (
                <div className={`flex flex-col w-full max-w-[280px] sm:max-w-[320px] leading-1.5 p-2.5 sm:p-3 border-border/50 rounded-xl shadow-sm ${msg.author === currentUser.name ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted/20 text-foreground rounded-bl-none'}`}> {/* Adjusted max-width and padding */}
                   <div className="flex items-center space-x-1.5 sm:space-x-2 rtl:space-x-reverse"> {/* Adjusted gap */}
                       <span className="text-xs sm:text-sm font-semibold text-foreground">{msg.author}</span> {/* Adjusted font size */}
                       <span className="text-xs font-normal text-muted-foreground">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                   </div>
                   <p className="text-sm font-normal py-1.5 sm:py-2 text-foreground">{msg.text}</p> {/* Adjusted padding and font size */}
                </div>
              )}
           </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Input Form (Does not grow) */}
      <form onSubmit={handleSubmit} className={cn("flex-shrink-0 p-3 sm:p-4 border-t border-border/50", isOverlay ? "bg-card/50 rounded-b-xl" : "")}> {/* Adjusted padding */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Say something..."
            className="flex-grow px-3 py-2 bg-input/50 border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition text-sm sm:text-base" // Adjusted padding and font size
          />
          <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground p-2.5 sm:p-3 rounded-lg transition-colors"> {/* Adjusted padding */}
            <SendIcon className="w-4 h-4 sm:w-5 h-5" /> {/* Adjusted icon size */}
          </button>
        </div>
      </form>

    </div>
  );
};

export default Chat;