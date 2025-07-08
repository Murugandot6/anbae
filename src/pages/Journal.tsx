import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } => 'sonner';
import { Trash2, ArrowLeft, CalendarDays } from 'lucide-react'; // Import CalendarDays icon
import BackgroundWrapper from '@/components/BackgroundWrapper';
import { format, isSameDay } from 'date-fns';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { JournalEntry } from '@/types/supabase'; // Import JournalEntry
import { Helmet } from 'react-helmet-async'; // Import Helmet
import LoadingPulsar from '@/components/LoadingPulsar';

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
            <div className="absolute top-3 left-3 z-10">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/dashboard">
                    <Button variant="outline" size="icon" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full text-foreground border-border hover:bg-accent hover:text-accent-foreground shadow-md">
                      <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Back to Dashboard</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mx-auto">Journal</h1>
            {!isTodaySelected && (
              <div className="absolute top-3 right-3 z-10">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={handleGoToToday} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full text-foreground border-border hover:bg-accent hover:text-accent-foreground shadow-md">
                      <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Go to Today</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </header>

          <div className="flex flex-col gap-6 sm:gap-8">
            <div>
              <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-foreground">
                Entries for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'today'}
              </h3>
              <div className="space-y-3 sm:space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {loading ? (
                  <p className="text-muted-foreground text-sm sm:text-base">Loading entries...</p>
                ) : dailyEntries.length > 0 ? (
                  dailyEntries.map(entry => (
                    <Card key={entry.id} className="bg-card/50 dark:bg-card/50 border border-border/50 shadow-md rounded-xl p-3 sm:p-4">
                      <CardHeader className="flex flex-row justify-between items-start pb-1 sm:pb-2">
                        <div>
                          <CardTitle className="text-base sm:text-lg text-foreground">{entry.emoji} {entry.heading}</CardTitle>
                          <p className="text-xs sm:text-sm text-muted-foreground">{format(new Date(entry.created_at), 'p')}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteEntry(entry.id)} className="w-8 h-8 text-destructive hover:bg-destructive/20">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </CardHeader>
                      <CardContent className="pt-0 text-sm sm:text-base">
                        <p className="whitespace-pre-wrap text-foreground">{entry.content}</p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm sm:text-base">No entries for this day. You can add one from the Dashboard!</p>
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