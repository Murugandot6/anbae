import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { format } from 'date-fns';

interface JournalEntry {
  id: string;
  created_at: string;
  heading: string | null;
  mood: string | null;
  content: string;
  emoji: string | null;
}

interface JournalEntryDialogProps {
  entry: JournalEntry | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const JournalEntryDialog: React.FC<JournalEntryDialogProps> = ({ entry, isOpen, onOpenChange }) => {
  if (!entry) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card/80 dark:bg-card/80 backdrop-blur-md border-border/50 rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-4 text-2xl text-foreground">
            <span className="text-4xl">{entry.emoji}</span>
            {entry.heading}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {format(new Date(entry.created_at), "EEEE, MMMM d, yyyy")}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[60vh] overflow-y-auto">
          <p className="whitespace-pre-wrap text-foreground">{entry.content}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JournalEntryDialog;