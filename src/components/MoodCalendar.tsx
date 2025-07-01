import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { format, isSameDay } from 'date-fns';
import { CalendarDays } from 'lucide-react';

interface JournalEntry {
  id: string;
  created_at: string;
  emoji: string | null;
}

const MoodCalendar = () => {
  const { user } = useSession();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJournalData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from('journal_entries')
        .select('id, created_at, emoji')
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
    if (date) {
      navigate('/journal', { state: { selectedDate: date.toISOString() } });
    }
  };

  const DayWithMood = ({ date }: { date: Date }) => {
    const dayEntry = entries.find(entry => isSameDay(new Date(entry.created_at), date));
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <span>{format(date, 'd')}</span>
        {dayEntry && (
          <span className="absolute text-2xl flex items-center justify-center w-full h-full opacity-80">{dayEntry.emoji}</span>
        )}
      </div>
    );
  };

  return (
    <Card className="bg-white/30 dark:bg-gray-800/30 shadow-lg backdrop-blur-sm border border-white/30 dark:border-gray-600/30 p-4 mb-8">
      <CardHeader className="pb-4">
        <CardTitle className="text-gray-900 dark:text-white text-center flex items-center justify-center gap-2">
          <CalendarDays /> Mood Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex justify-center">
        {loading ? (
          <p>Loading calendar...</p>
        ) : (
          <Calendar
            mode="single"
            onSelect={handleDateSelect}
            className="p-0 rounded-md"
            components={{ DayContent: DayWithMood }}
            classNames={{
              root: 'w-full',
              months: 'w-full',
              month: 'w-full',
              table: 'w-full',
              caption_label: 'text-lg',
            }}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default MoodCalendar;