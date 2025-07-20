import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogOut, Settings, MessageSquare, Inbox, Heart, BookText, Film, Sparkles, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Profile } from '@/types/supabase';
import { User } from '@supabase/supabase-js';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useUnreadCount } from '@/hooks/useUnreadCount'; // New import

interface SidebarContentProps {
  currentUserProfile: Profile | null;
  partnerProfile: Profile | null;
  user: User | null;
  handleLogout: () => void;
  onMessagesCleared: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ currentUserProfile, partnerProfile, user, handleLogout, onMessagesCleared }) => {
  const location = useLocation();
  const unreadCount = useUnreadCount(); // Use the new hook

  if (!user) {
    return null;
  }

  const navItems = [
    { to: "/dashboard", icon: Heart, label: "Dashboard" },
    { to: "/journal", icon: BookText, label: "Journal" },
    { to: "/promposal/create", icon: Sparkles, label: "Promposal" },
    { to: "/messages", icon: Inbox, label: "Messages" },
    { to: "/theater", icon: Film, label: "Theater" },
    { to: "/concert", icon: Radio, label: "Concert" },
    { to: "/edit-profile", icon: Settings, label: "Edit Profile" },
  ];

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center gap-3 mb-6 p-2 rounded-lg bg-sidebar-accent/30 border border-sidebar-border/50 shadow-sm">
        <Avatar className="w-12 h-12 border-2 border-primary dark:border-primary-foreground">
          <AvatarImage src={currentUserProfile?.avatar_url || user.user_metadata.avatar_url || ''} alt="Your Avatar" />
          <AvatarFallback className="bg-primary text-primary-foreground">{user.user_metadata.nickname?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'Y'}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold text-lg text-sidebar-foreground">{user.user_metadata.nickname || user.email}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Score: {currentUserProfile?.lifetime_score !== undefined && currentUserProfile?.lifetime_score !== null ? currentUserProfile.lifetime_score : 'N/A'}</p>
        </div>
        <ThemeToggle />
      </div>
      <nav className="flex flex-col gap-2 mb-auto">
        {navItems.map((item) => (
          <Link to={item.to} key={item.to}>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start transition-colors duration-200",
                "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                location.pathname === item.to && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground rounded-md"
              )}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  <item.icon className="w-5 h-5 mr-2" />
                  <span>{item.label}</span>
                </div>
                {item.to === "/messages" && unreadCount > 0 && (
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
                )}
              </div>
            </Button>
          </Link>
        ))}
      </nav>
      <div className="mt-auto flex flex-col gap-2">
        <Button onClick={handleLogout} variant="destructive" className="w-full justify-start bg-destructive hover:bg-destructive/90 text-destructive-foreground">
          <LogOut className="w-5 h-5 mr-2" /> Logout
        </Button>
      </div>
    </div>
  );
};

export default SidebarContent;