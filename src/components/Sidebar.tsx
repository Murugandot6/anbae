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
                <Button variant="outline" size="icon" className="fixed top-4 left-4 z-50 w-10 h-10 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                    <Menu className="w-5 h-5" />
                </Button>
            </SheetTrigger>
            <SheetContent
                side="left"
                className="w-64 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border-r border-white/30 dark:border-gray-600/30 p-4 flex flex-col [&>button]:hidden" // Added [&>button]:hidden to hide the default close button
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

                {/* Logout button is at the very bottom */}
                <div className="mt-auto flex flex-col gap-2">
                    <Button onClick={props.handleLogout} variant="destructive" className="w-full justify-start">
                        <LogOut className="w-5 h-5 mr-2" /> Logout
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}

export default Sidebar;