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
import LoadingPulsar from '@/components/LoadingPulsar';
import CalendarView from '@/components/CalendarView'; // Import CalendarView
import JournalEntryCard from '@/components/JournalEntryCard'; // Import JournalEntryCard
import { formatDateTimeForMessageView } from '@/lib/utils'; // Import formatDateTimeForMessageView

const Journal = () => {
  const { user, loading: sessionLoading } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>( // Corrected type here
    location.state?.selectedDate ? new Date(location.state.selectedDate) : new Date()
  );
  const [viewMode, setViewMode] = useState<'all' | 'daily'>('daily'); // New state for view mode
  const [todayJournalEntry, setTodayJournalEntry] = useState<JournalEntry | null>(null); // State for today's entry
  const [journalEntriesMap, setJournalEntriesMap] = useState<Record<string, JournalEntry>>({}); // New state for calendar map

  useEffect(() => {
    // Update selectedDate and viewMode if location state changes
    if (location.state?.selectedDate) {
      setSelectedDate(new Date(location.state.selectedDate));
      setViewMode('daily');
    } else {
      setSelectedDate(new Date()); // Default to today if no state
      setViewMode('daily');
    }
  }, [location.state?.selectedDate]);

  const fetchJournalData = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('journal_entries')
      .select('id, created_at, emoji, heading, content, mood, user_id') // Select user_id
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load journal entries.');
    } else {
      setEntries(data);
      
      const entriesMap: Record<string, JournalEntry> = {};
      let latestTodayEntry: JournalEntry | null = null;
      const today = new Date();

      data.forEach(entry => {
        const entryDate = new Date(entry.created_at);
        const dateKey = format(entryDate, 'yyyy-MM-dd');
        // Store the latest entry for each day in the map
        if (!entriesMap[dateKey] || new Date(entry.created_at) > new Date(entriesMap[dateKey].created_at)) {
          entriesMap[dateKey] = entry;
        }

        if (isSameDay(entryDate, today) && (!latestTodayEntry || entryDate > new Date(latestTodayEntry.created_at))) {
          latestTodayEntry = entry;
        }
      });
      setJournalEntriesMap(entriesMap); // Set the map for the calendar
      setTodayJournalEntry(latestTodayEntry); // Set today's specific entry
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
      fetchJournalData(); // Re-fetch to update the list and calendar
    }
  };

  const dailyEntries = useMemo(() => {
    if (!selectedDate) return [];
    return entries.filter(entry => isSameDay(new Date(entry.created_at), selectedDate));
  }, [entries, selectedDate]);

  const groupedAllEntries = useMemo(() => {
    return entries.reduce((acc, entry) => {
      const dateKey = format(new Date(entry.created_at), 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(entry);
      // Sort entries within each day by created_at descending (most recent first)
      acc[dateKey].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return acc;
    }, {} as Record<string, JournalEntry[]>);
  }, [entries]);

  const isTodaySelected = useMemo(() => {
    return selectedDate ? isSameDay(selectedDate, new Date()) : true;
  }, [selectedDate]);

  const handleGoToToday = () => {
    setSelectedDate(new Date());
    setViewMode('daily'); // Switch to daily view when going to today
    navigate(location.pathname, { replace: true, state: {} });
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setViewMode('daily'); // Switch to daily view when a date is clicked
    navigate(location.pathname, { replace: true, state: { selectedDate: date.toISOString() } });
  };

  const handleJournalEntryUpdated = (entry: JournalEntry) => {
    // Update today's entry if it's for today
    if (isSameDay(new Date(entry.created_at), new Date())) {
      setTodayJournalEntry(entry);
    }
    fetchJournalData(); // Re-fetch all data to ensure calendar and all entries are updated
  };

  // Calculate the entry for the currently selected date
  const currentDayEntry = useMemo(() => {
    if (!selectedDate) return null;
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return journalEntriesMap[dateKey] || null;
  }, [selectedDate, journalEntriesMap]);

  if (sessionLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-background/80 text-foreground">
        <LoadingPulsar />
        <p className="text-xl mt-4">Loading journal...</p>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

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
            {!isTodaySelected && viewMode === 'daily' && (
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
              {/* Pass currentDayEntry and selectedDate to JournalEntryCard */}
              <JournalEntryCard user={user} initialEntry={currentDayEntry} onEntryUpdated={handleJournalEntryUpdated} selectedDate={selectedDate} />
            </div>
            <div>
              <CalendarView entries={journalEntriesMap} onDayClick={handleDayClick} />
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center mb-3 sm:mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 sm:mb-0">
                {viewMode === 'daily' ? `Entries for ${selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'today'}` : 'All Journal Entries'}
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'daily' ? 'default' : 'outline'}
                  onClick={() => setViewMode('daily')}
                  size="sm"
                  className="text-sm px-3 py-1.5 h-auto"
                >
                  Selected Day
                </Button>
                <Button
                  variant={viewMode === 'all' ? 'default' : 'outline'}
                  onClick={() => setViewMode('all')}
                  size="sm"
                  className="text-sm px-3 py-1.5 h-auto"
                >
                  All Entries
                </Button>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {viewMode === 'daily' ? (
                dailyEntries.length > 0 ? (
                  dailyEntries.map(entry => (
                    <Card key={entry.id} className="bg-card/50 dark:bg-card/50 border border-border/50 shadow-md rounded-xl p-3 sm:p-4">
                      <CardHeader className="flex flex-row justify-between items-start pb-1 sm:pb-2">
                        <div>
                          <CardTitle className="text-base sm:text-lg text-foreground">
                            {entry.emoji} {entry.heading}
                          </CardTitle>
                          <p className="text-xs sm:text-sm text-muted-foreground">{formatDateTimeForMessageView(entry.created_at)}</p>
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
                )
              ) : (
                Object.keys(groupedAllEntries).length > 0 ? (
                  Object.keys(groupedAllEntries).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map(dateKey => (
                    <div key={dateKey} className="mb-6">
                      {/* Removed the date heading here */}
                      <div className="space-y-3 sm:space-y-4">
                        {groupedAllEntries[dateKey].map(entry => (
                          <Card key={entry.id} className="bg-card/50 dark:bg-card/50 border border-border/50 shadow-md rounded-xl p-3 sm:p-4">
                            <CardHeader className="flex flex-row justify-between items-start pb-1 sm:pb-2">
                              <div>
                                <CardTitle className="text-base sm:text-lg text-foreground">
                                  {entry.emoji} {entry.heading}
                                </CardTitle>
                                <p className="text-xs sm:text-sm text-muted-foreground">{formatDateTimeForMessageView(entry.created_at)}</p>
                              </div>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteEntry(entry.id)} className="w-8 h-8 text-destructive hover:bg-destructive/20">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </CardHeader>
                            <CardContent className="pt-0 text-sm sm:text-base">
                              <p className="whitespace-pre-wrap text-foreground">{entry.content}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm sm:text-base">No journal entries found.</p>
                )
              )}
            </div>
          </div>
        </div>
      </BackgroundWrapper>
    </>
  );
};

export default Journal;