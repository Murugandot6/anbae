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
    <div className={cn("flex flex-col h-full", isOverlay ? "bg-card/90 backdrop-blur-md rounded-xl shadow-lg" : "bg-card/60 backdrop-blur-md border border-border/50 rounded-xl shadow-lg")}>
      <div className={cn("flex items-center justify-between p-4 border-b border-border/50", isOverlay ? "bg-card/50 rounded-t-xl" : "")}>
        <h3 className="text-xl font-bold text-foreground">Live Chat</h3>
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
      <div className="flex-grow p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => (
           <div key={msg.id} className={`flex items-start gap-2.5 ${msg.isSystem ? 'justify-center' : ''} ${msg.author === currentUser.name ? 'justify-end' : ''}`}>
             {msg.isSystem ? (
                <span className="text-xs text-center text-muted-foreground italic px-2 py-1 bg-muted/20 rounded-full">{msg.text}</span>
             ) : (
                <div className={`flex flex-col w-full max-w-[320px] leading-1.5 p-3 border-border/50 rounded-xl shadow-sm ${msg.author === currentUser.name ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted/20 text-foreground rounded-bl-none'}`}>
                   <div className="flex items-center space-x-2 rtl:space-x-reverse">
                       <span className="text-sm font-semibold text-foreground">{msg.author}</span>
                       <span className="text-xs font-normal text-muted-foreground">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                   </div>
                   <p className="text-sm font-normal py-2 text-foreground">{msg.text}</p>
                </div>
              )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className={cn("p-4 border-t border-border/50", isOverlay ? "bg-card/50 rounded-b-xl" : "")}>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Say something..."
            className="flex-grow px-4 py-2 bg-input/50 border border-border/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition"
          />
          <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground p-3 rounded-lg transition-colors">
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;