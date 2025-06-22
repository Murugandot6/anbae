import React from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Settings, MessageSquare, Inbox, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ClearMessagesDialog from '@/components/ClearMessagesDialog';
import { Profile } from '@/types/supabase';
import { User } from '@supabase/supabase-js';

interface SidebarProps {
  currentUserProfile: Profile | null;
  partnerProfile: Profile | null;
  user: User | null;
  handleLogout: () => void;
  onMessagesCleared: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentUserProfile, partnerProfile, user, handleLogout, onMessagesCleared }) => {
  if (!user) return null; // Should not happen if ProtectedRoute works, but for safety

  return (
    <aside className="hidden md:flex flex-col w-64 bg-sidebar dark:bg-sidebar-background border-r border-sidebar-border dark:border-sidebar-border p-4 shadow-lg min-h-screen">
      <div className="flex items-center gap-3 mb-6 mt-4">
        <Avatar className="w-16 h-16 border-2 border-blue-500 dark:border-purple-400">
          <AvatarImage src={currentUserProfile?.avatar_url || user.user_metadata.avatar_url || ''} alt="Your Avatar" />
          <AvatarFallback>{user.user_metadata.nickname?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'Y'}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-lg text-sidebar-foreground">{user.user_metadata.nickname || user.email}</p>
          <p className="text-sm text-sidebar-foreground/80">Lifetime Score: {currentUserProfile?.lifetime_score !== undefined && currentUserProfile?.lifetime_score !== null ? currentUserProfile.lifetime_score : 'N/A'}</p>
        </div>
      </div>
      <nav className="flex flex-col gap-2 mb-auto">
        <Link to="/dashboard">
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <Heart className="w-5 h-5 mr-2" /> Dashboard
          </Button>
        </Link>
        <Link to="/send-message">
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <MessageSquare className="w-5 h-5 mr-2" /> Send Message
          </Button>
        </Link>
        <Link to="/messages">
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <Inbox className="w-5 h-5 mr-2" /> Messages
          </Button>
        </Link>
        <Link to="/edit-profile">
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <Settings className="w-5 h-5 mr-2" /> Edit Profile
          </Button>
        </Link>
      </nav>
      <div className="mt-auto flex flex-col gap-2">
        {user && (
          <ClearMessagesDialog
            partnerId={partnerProfile?.id || null}
            partnerNickname={partnerProfile?.username || currentUserProfile?.partner_nickname || null}
            currentUserId={user.id}
            onMessagesCleared={onMessagesCleared}
          />
        )}
        <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900">
          <LogOut className="w-5 h-5 mr-2" /> Logout
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;