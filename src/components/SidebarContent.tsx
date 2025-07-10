import React from 'react';
import { Link, useLocation } from 'react-router-dom'; // Import useLocation
import { LogOut, Settings, MessageSquare, Inbox, Heart, BookText, Film, Sparkles, Radio } from 'lucide-react'; // Removed BookOpen
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Profile } from '@/types/supabase';
import { User } from '@supabase/supabase-js';
import { cn } from '@/lib/utils'; // Import cn for conditional classes
import { ThemeToggle } from '@/components/ThemeToggle'; // Import ThemeToggle

interface SidebarContentProps {
  currentUserProfile: Profile | null;
  partnerProfile: Profile | null;
  user: User | null;
  handleLogout: () => void;
  onMessagesCleared: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ currentUserProfile, partnerProfile, user, handleLogout, onMessagesCleared }) => {
  const location = useLocation(); // Get current location

  console.log("SidebarContent rendering. User:", user);
  console.log("currentUserProfile:", currentUserProfile);

  if (!user) {
    console.log("SidebarContent: User is null, returning null.");
    return null;
  }

  const navItems = [
    { to: "/dashboard", icon: Heart, label: "Dashboard" },
    { to: "/journal", icon: BookText, label: "Journal" },
    { to: "/promposal/create", icon: Sparkles, label: "Promposal" },
    // Removed: { to: "/send-message", icon: MessageSquare, label: "Send Message" },
    { to: "/messages", icon: Inbox, label: "Messages" },
    { to: "/theater", icon: Film, label: "Theater" }, // Renamed from Watch Party
    { to: "/concert", icon: Radio, label: "Concert" }, // Renamed from Wave Room
    { to: "/edit-profile", icon: Settings, label: "Edit Profile" },
    // Removed: { to: "/manual", icon: BookOpen, label: "User Manual" }, // Removed this line
  ];

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center gap-3 mb-6 p-2 rounded-lg bg-sidebar-accent/30 border border-sidebar-border/50 shadow-sm">
        <Avatar className="w-12 h-12 border-2 border-primary dark:border-primary-foreground">
          <AvatarImage src={currentUserProfile?.avatar_url || user.user_metadata.avatar_url || ''} alt="Your Avatar" />
          <AvatarFallback className="bg-primary text-primary-foreground">{user.user_metadata.nickname?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'Y'}</AvatarFallback>
        </Avatar>
        <div className="flex-1"> {/* Added flex-1 to push ThemeToggle to the right */}
          <p className="font-semibold text-lg text-sidebar-foreground">{user.user_metadata.nickname || user.email}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Score: {currentUserProfile?.lifetime_score !== undefined && currentUserProfile?.lifetime_score !== null ? currentUserProfile.lifetime_score : 'N/A'}</p>
        </div>
        <ThemeToggle /> {/* Placing ThemeToggle here */}
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
              <item.icon className="w-5 h-5 mr-2" /> {item.label}
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