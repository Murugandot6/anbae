import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, User } from '@/types/watchParty';
import { SendIcon } from '@/components/watch-party/icons';

interface ChatProps {
  messages: ChatMessage[];
  sendMessage: (text: string) => void;
  currentUser: User;
}

const Chat: React.FC<ChatProps> = ({ messages, sendMessage, currentUser }) => {
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
    <div className="bg-card/60 backdrop-blur-md border border-border/50 rounded-xl shadow-lg flex flex-col h-full">
      <h3 className="text-xl font-bold p-4 border-b border-border/50 text-foreground">Live Chat</h3>
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
      <form onSubmit={handleSubmit} className="p-4 border-t border-border/50">
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