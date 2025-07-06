"use client";

import React from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import SidebarContent from './SidebarContent';
import { Profile } from '@/types/supabase';
import { User } from '@supabase/supabase-js';
import ClearMessagesDialog from '@/components/ClearMessagesDialog';
import CustomSheetCloseButton from '@/components/CustomSheetCloseButton';

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
                <Button variant="outline" size="icon" className="fixed top-4 left-4 z-50 w-10 h-10 text-foreground border-border hover:bg-accent hover:text-accent-foreground rounded-full shadow-md">
                    <Menu className="w-5 h-5" />
                </Button>
            </SheetTrigger>
            <SheetContent
                side="left"
                className="w-64 bg-gradient-to-br from-sidebar-background to-sidebar-background/80 backdrop-blur-md border-r border-sidebar-border p-4 flex flex-col [&>button]:hidden"
            >
                {/* Container for Clear Messages and X button at the very top */}
                <div className="flex justify-between items-center mb-4 px-2">
                    {props.user && (
                        <ClearMessagesDialog
                            partnerId={props.partnerProfile?.id || null}
                            partnerNickname={props.partnerProfile?.username || props.currentUserProfile?.partner_nickname || null}
                            currentUserId={props.user.id}
                            onMessagesCleared={props.onMessagesCleared}
                        />
                    )}
                    <CustomSheetCloseButton />
                </div>

                {/* SidebarContent now follows */}
                <SidebarContent {...props} />

                {/* The actual Logout button is inside SidebarContent */}
            </SheetContent>
        </Sheet>
    );
}

export default Sidebar;