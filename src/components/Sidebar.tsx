import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import SidebarContent from './SidebarContent';
import { Profile } from '@/types/supabase';
import { User } from '@supabase/supabase-js';

interface SidebarProps {
  currentUserProfile: Profile | null;
  partnerProfile: Profile | null;
  user: User | null;
  handleLogout: () => void;
  onMessagesCleared: () => void;
}

const Sidebar: React.FC<SidebarProps> = (props) => {
    const isMobile = useIsMobile();

    if (isMobile) {
        return (
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="fixed top-4 left-4 z-50 w-10 h-10 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                        <Menu className="w-5 h-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border-r border-white/30 dark:border-gray-600/30 p-4">
                    <SidebarContent {...props} />
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <aside className="hidden md:flex flex-col w-64 bg-white/30 dark:bg-gray-800/30 backdrop-blur-md border-r border-white/30 dark:border-gray-600/30 p-4 shadow-lg fixed inset-y-0 left-0 h-full">
            <SidebarContent {...props} />
        </aside>
    );
}

export default Sidebar;