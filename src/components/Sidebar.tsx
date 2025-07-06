import React from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import SidebarContent from './SidebarContent';
import { Profile } from '@/types/supabase';
import { User } from '@supabase/supabase-js';
import ClearMessagesDialog from '@/components/ClearMessagesDialog';

interface SidebarProps {
  currentUserProfile: Profile | null;
  partnerProfile: Profile | null;
  user: User | null;
  handleLogout: () => void;
  onMessagesCleared: () => void;
}

const Sidebar: React.FC<SidebarProps> = (props) => {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="fixed top-4 left-4 z-50 w-10 h-10 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                    <Menu className="w-5 h-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border-r border-white/30 dark:border-gray-600/30 p-4">
                {/* ClearMessagesDialog positioned absolutely at top-left */}
                {props.user && (
                    <div className="absolute top-6 left-4 z-10"> {/* Changed top-4 to top-6 */}
                        <ClearMessagesDialog
                            partnerId={props.partnerProfile?.id || null}
                            partnerNickname={props.partnerProfile?.username || props.currentUserProfile?.partner_nickname || null}
                            currentUserId={props.user.id}
                            onMessagesCleared={props.onMessagesCleared}
                        />
                    </div>
                )}
                {/* SidebarContent now starts lower to avoid overlap */}
                <SidebarContent {...props} />
            </SheetContent>
        </Sheet>
    );
}

export default Sidebar;