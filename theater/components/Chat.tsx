
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, User } from '../types';
import { SendIcon } from './icons';

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
    <div className="bg-gray-800 rounded-xl shadow-lg flex flex-col h-[75vh] lg:h-full max-h-[calc(100vh-12rem)]">
      <h3 className="text-xl font-bold p-4 border-b border-gray-700">Live Chat</h3>
      <div className="flex-grow p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => (
           <div key={msg.id} className={`flex items-start gap-2.5 ${msg.isSystem ? 'justify-center' : ''} ${msg.author === currentUser.name ? 'justify-end' : ''}`}>
             {msg.isSystem ? (
                <span className="text-xs text-center text-gray-400 italic px-2 py-1 bg-gray-700 rounded-full">{msg.text}</span>
             ) : (
                <div className={`flex flex-col w-full max-w-[320px] leading-1.5 p-3 border-gray-200 rounded-xl ${msg.author === currentUser.name ? 'bg-blue-600 rounded-br-none' : 'bg-gray-700 rounded-bl-none'}`}>
                   <div className="flex items-center space-x-2 rtl:space-x-reverse">
                       <span className="text-sm font-semibold text-white">{msg.author}</span>
                       <span className="text-xs font-normal text-gray-400">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                   </div>
                   <p className="text-sm font-normal py-2 text-white">{msg.text}</p>
                </div>
              )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Say something..."
            className="flex-grow px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition-colors">
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
