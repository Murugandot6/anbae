import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Trash2, ArrowLeft, CalendarDays } from 'lucide-react'; // Import CalendarDays icon
import BackgroundWrapper from '@/components/BackgroundWrapper';
import { format, isSameDay } from 'date-fns';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { JournalEntry } from '@/types/supabase'; // Import JournalEntry
import { Helmet } from 'react-helmet-async'; // Import Helmet

const Journal = () => {
  const { user, loading: sessionLoading } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    location.state?.selectedDate ? new Date(location.state.selectedDate) : new Date()
  );

  useEffect(() => {
    // Update selectedDate if location state changes
    if (location.state?.selectedDate) {
      setSelectedDate(new Date(location.state.selectedDate));
    } else {
      setSelectedDate(new Date()); // Default to today if no state
    }
  }, [location.state?.selectedDate]);

  const fetchJournalData = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load journal entries.');
    } else {
      setEntries(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!sessionLoading && user) {
      fetchJournalData();
    } else if (!sessionLoading && !user) {
      navigate('/login');
    }
  }, [user, sessionLoading, navigate]);

  const handleDeleteEntry = async (entryId: string) => {
    const { error } = await supabase.from('journal_entries').delete().eq('id', entryId);
    if (error) {
      toast.error('Failed to delete entry.');
    } else {
      toast.success('Entry deleted.');
      fetchJournalData(); // Re-fetch to update the list
    }
  };

  const dailyEntries = useMemo(() => {
    if (!selectedDate) return [];
    return entries.filter(entry => isSameDay(new Date(entry.created_at), selectedDate));
  }, [entries, selectedDate]);

  const isTodaySelected = useMemo(() => {
    return selectedDate ? isSameDay(selectedDate, new Date()) : true;
  }, [selectedDate]);

  const handleGoToToday = () => {
    setSelectedDate(new Date());
    // Clear location state to ensure it defaults to today on subsequent direct navigations
    navigate(location.pathname, { replace: true, state: {} });
  };

  return (
    <>
      <Helmet>
        <title>Journal - Anbae</title>
        <meta name="description" content="Your personal journal on Anbae. Track your moods, write entries, and reflect on your relationship journey." />
      </Helmet>
      <BackgroundWrapper className="pt-0 md:pt-0">
        <div className="w-full max-w-2xl mx-auto p-4 md:p-8 mt-16 md:mt-8">
          <header className="flex justify-between items-center mb-6">
            <div className="absolute top-4 left-4 z-10">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/dashboard">
                    <Button variant="outline" size="icon" className="w-10 h-10 rounded-full text-foreground border-border hover:bg-accent hover:text-accent-foreground shadow-md">
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Back to Dashboard</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <h1 className="text-3xl font-bold text-foreground mx-auto">Journal</h1>
            {!isTodaySelected && (
              <div className="absolute top-4 right-4 z-10">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={handleGoToToday} className="w-10 h-10 rounded-full text-foreground border-border hover:bg-accent hover:text-accent-foreground shadow-md">
                      <CalendarDays className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Go to Today</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </header>

          <div className="flex flex-col gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 text-foreground">
                Entries for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'today'}
              </h3>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {loading ? (
                  <p className="text-muted-foreground">Loading entries...</p>
                ) : dailyEntries.length > 0 ? (
                  dailyEntries.map(entry => (
                    <Card key={entry.id} className="bg-card/50 dark:bg-card/50 border border-border/50 shadow-md rounded-xl">
                      <CardHeader className="flex flex-row justify-between items-start pb-2">
                        <div>
                          <CardTitle className="text-lg text-foreground">{entry.emoji} {entry.heading}</CardTitle>
                          <p className="text-sm text-muted-foreground">{format(new Date(entry.created_at), 'p')}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteEntry(entry.id)} className="text-destructive hover:bg-destructive/20">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="whitespace-pre-wrap text-foreground">{entry.content}</p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-muted-foreground">No entries for this day. You can add one from the Dashboard!</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </BackgroundWrapper>
    </>
  );
};

export default Journal;