import React from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Settings, MessageSquare, Inbox, Heart, BookText, Film, Sparkles, Radio, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ClearMessagesDialog from '@/components/ClearMessagesDialog';
import { Profile } from '@/types/supabase';
import { User } from '@supabase/supabase-js';
// ThemeToggle is no longer needed here as it's being removed from this component.

interface SidebarContentProps {
  currentUserProfile: Profile | null;
  partnerProfile: Profile | null;
  user: User | null;
  handleLogout: () => void;
  onMessagesCleared: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ currentUserProfile, partnerProfile, user, handleLogout, onMessagesCleared }) => {
  if (!user) return null;

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 pt-0.5"> {/* Added pt-0.5 here */}
          {user && (
            <ClearMessagesDialog
              partnerId={partnerProfile?.id || null}
              partnerNickname={partnerProfile?.username || currentUserProfile?.partner_nickname || null}
              currentUserId={user.id}
              onMessagesCleared={onMessagesCleared}
            />
          )}
        </div>
        {/* ThemeToggle removed from here */}
      </div>
      <div className="flex items-center gap-3 mb-6">
        <Avatar className="w-12 h-12 border-2 border-blue-500 dark:border-purple-400">
          <AvatarImage src={currentUserProfile?.avatar_url || user.user_metadata.avatar_url || ''} alt="Your Avatar" />
          <AvatarFallback>{user.user_metadata.nickname?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'Y'}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-lg text-gray-900 dark:text-white">{user.user_metadata.nickname || user.email}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Lifetime Score: {currentUserProfile?.lifetime_score !== undefined && currentUserProfile?.lifetime_score !== null ? currentUserProfile.lifetime_score : 'N/A'}</p>
        </div>
      </div>
      <nav className="flex flex-col gap-2 mb-auto">
        <Link to="/dashboard">
          <Button variant="ghost" className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
            <Heart className="w-5 h-5 mr-2" /> Dashboard
          </Button>
        </Link>
        <Link to="/journal">
          <Button variant="ghost" className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
            <BookText className="w-5 h-5 mr-2" /> Journal
          </Button>
        </Link>
        <Link to="/promposal/create">
          <Button variant="ghost" className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
            <Sparkles className="w-5 h-5 mr-2" /> Promposal
          </Button>
        </Link>
        <Link to="/send-message">
          <Button variant="ghost" className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
            <MessageSquare className="w-5 h-5 mr-2" /> Send Message
          </Button>
        </Link>
        <Link to="/messages">
          <Button variant="ghost" className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
            <Inbox className="w-5 h-5 mr-2" /> Messages
          </Button>
        </Link>
        <Link to="/watch-party">
          <Button variant="ghost" className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
            <Film className="w-5 h-5 mr-2" /> Watch Party
          </Button>
        </Link>
        <Link to="/waveroom">
          <Button variant="ghost" className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
            <Radio className="w-5 h-5 mr-2" /> Wave Room
          </Button>
        </Link>
        <Link to="/edit-profile">
          <Button variant="ghost" className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
            <Settings className="w-5 h-5 mr-2" /> Edit Profile
          </Button>
        </Link>
        <Link to="/manual">
          <Button variant="ghost" className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
            <BookOpen className="w-5 h-5 mr-2" /> User Manual
          </Button>
        </Link>
      </nav>
      <div className="mt-auto flex flex-col gap-2">
        <Button onClick={handleLogout} variant="destructive" className="w-full justify-start">
          <LogOut className="w-5 h-5 mr-2" /> Logout
        </Button>
      </div>
    </div>
  );
};

export default SidebarContent;