import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { format, isSameDay } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import JournalEntryDialog from './JournalEntryDialog';
import { DayContentProps } from 'react-day-picker'; // Import DayContentProps

interface JournalEntry {
  id: string;
  created_at: string;
  heading: string | null;
  mood: string | null;
  content: string;
  emoji: string | null;
}

const MoodCalendar = () => {
  const { user } = useSession();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  useEffect(() => {
    const fetchJournalData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from('journal_entries')
        .select('id, created_at, emoji, heading, content, mood')
        .eq('user_id', user.id);

      if (error) {
        toast.error('Failed to load mood data for calendar.');
        console.error(error);
      } else {
        setEntries(data);
      }
      setLoading(false);
    };

    fetchJournalData();
  }, [user]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    const entryForDay = entries.find(entry => isSameDay(new Date(entry.created_at), date));

    if (entryForDay) {
      setSelectedEntry(entryForDay);
      setIsDialogOpen(true);
    } else {
      navigate('/journal', { state: { selectedDate: date.toISOString() } });
    }
  };

  // Updated DayWithMood component to correctly render children (the day number)
  const DayWithMood = ({ date, children }: DayContentProps) => {
    const dayEntry = entries.find(entry => isSameDay(new Date(entry.created_at), date));
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        {children} {/* Render the default day number */}
        {dayEntry && (
          <span className="absolute text-2xl flex items-center justify-center w-full h-full opacity-80">{dayEntry.emoji}</span>
        )}
      </div>
    );
  };

  return (
    <>
      <Card className="bg-card/60 dark:bg-card/60 shadow-lg backdrop-blur-md border border-border/50 p-4 mb-8 rounded-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-foreground text-center flex items-center justify-center gap-2">
            <CalendarDays className="text-primary" /> Mood Calendar
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex justify-center">
          {loading ? (
            <p className="text-muted-foreground">Loading calendar...</p>
          ) : (
            <Calendar
              mode="single"
              onSelect={handleDateSelect}
              className="p-0 rounded-md bg-transparent"
              classNames={{
                caption_label: 'text-lg text-foreground',
                nav_button: 'text-foreground hover:bg-accent hover:text-accent-foreground',
                head_row: 'text-muted-foreground',
                day: 'text-foreground hover:bg-accent hover:text-accent-foreground',
                day_selected: 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
                day_today: 'bg-secondary/50 text-secondary-foreground',
                day_outside: 'text-muted-foreground opacity-50',
              }}
              components={{ DayContent: DayWithMood }}
            />
          )}
        </CardContent>
      </Card>
      <JournalEntryDialog
        entry={selectedEntry}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  );
};

export default MoodCalendar;