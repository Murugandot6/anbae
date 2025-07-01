import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { BookText, Smile, Send, Trash2 } from 'lucide-react';
import BackgroundWrapper from '@/components/BackgroundWrapper';
import EmojiPickerPopover from '@/components/EmojiPickerPopover';
import { format, isSameDay, startOfDay } from 'date-fns';
import Sidebar from '@/components/Sidebar';
import { Profile } from '@/types/supabase';

interface JournalEntry {
  id: string;
  created_at: string;
  heading: string | null;
  mood: string | null;
  content: string;
  emoji: string | null;
}

const journalFormSchema = z.object({
  heading: z.string().min(3, "Heading must be at least 3 characters.").max(100),
  mood: z.string().min(1, "Please select a mood."),
  content: z.string().min(10, "Content must be at least 10 characters.").max(5000),
  emoji: z.string().optional(),
});

const Journal = () => {
  const { user, loading: sessionLoading } = useSession();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<Profile | null>(null);

  const form = useForm<z.infer<typeof journalFormSchema>>({
    resolver: zodResolver(journalFormSchema),
    defaultValues: {
      heading: '',
      mood: 'Neutral',
      content: '',
      emoji: '😊',
    },
  });

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
      console.error(error);
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const onSubmit = async (values: z.infer<typeof journalFormSchema>) => {
    if (!user) return;

    const { error } = await supabase.from('journal_entries').insert({
      user_id: user.id,
      heading: values.heading,
      mood: values.mood,
      content: values.content,
      emoji: values.emoji,
    });

    if (error) {
      toast.error('Failed to save entry.');
      console.error(error);
    } else {
      toast.success('Journal entry saved!');
      form.reset({
        heading: '',
        mood: 'Neutral',
        content: '',
        emoji: '😊',
      });
      fetchJournalData(); // Refresh entries
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    const { error } = await supabase.from('journal_entries').delete().eq('id', entryId);
    if (error) {
      toast.error('Failed to delete entry.');
    } else {
      toast.success('Entry deleted.');
      fetchJournalData();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    form.setValue('emoji', emoji);
  };

  const dailyEntries = useMemo(() => {
    if (!selectedDate) return [];
    return entries.filter(entry => isSameDay(new Date(entry.created_at), selectedDate));
  }, [entries, selectedDate]);

  const moodModifiers = useMemo(() => {
    const modifiers: { [key: string]: Date[] } = {};
    entries.forEach(entry => {
      const date = startOfDay(new Date(entry.created_at));
      const key = `mood-${date.toISOString()}`;
      if (!modifiers[key]) {
        modifiers[key] = [];
      }
      modifiers[key].push(date);
    });
    return modifiers;
  }, [entries]);

  const DayWithMood = ({ date }: { date: Date }) => {
    const dayEntries = entries.filter(entry => isSameDay(new Date(entry.created_at), date));
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <span>{format(date, 'd')}</span>
        {dayEntries.length > 0 && (
          <span className="absolute bottom-0 right-0 text-xs">{dayEntries[0].emoji}</span>
        )}
      </div>
    );
  };

  return (
    <BackgroundWrapper>
      <Sidebar
        currentUserProfile={currentUserProfile}
        partnerProfile={partnerProfile}
        user={user}
        handleLogout={handleLogout}
        onMessagesCleared={() => {}}
      />
      <div className="flex-1 flex flex-col md:flex-row gap-8 p-4 md:p-8 mt-16 md:mt-0 md:ml-0">
        {/* Left Column: Form */}
        <div className="w-full md:w-1/3">
          <Card className="bg-white/30 dark:bg-gray-800/30 shadow-lg backdrop-blur-sm border border-white/30 dark:border-gray-600/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl text-gray-900 dark:text-white">
                <BookText /> New Journal Entry
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="heading"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Heading</FormLabel>
                        <FormControl><Input placeholder="A title for your thoughts" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>How I Felt</FormLabel>
                        <FormControl><Textarea placeholder="Describe your feelings and the events of the day..." {...field} rows={6} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-4">
                    <FormField
                      control={form.control}
                      name="mood"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Mood</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select your mood" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="Happy">😊 Happy</SelectItem>
                              <SelectItem value="Sad">😔 Sad</SelectItem>
                              <SelectItem value="Angry">😠 Angry</SelectItem>
                              <SelectItem value="Neutral">😐 Neutral</SelectItem>
                              <SelectItem value="Anxious">😟 Anxious</SelectItem>
                              <SelectItem value="Grateful">🙏 Grateful</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormItem>
                      <FormLabel>Emoji</FormLabel>
                      <EmojiPickerPopover
                        isOpen={isEmojiPickerOpen}
                        onOpenChange={setIsEmojiPickerOpen}
                        onEmojiSelect={handleEmojiSelect}
                      >
                        <Button type="button" variant="outline" className="p-2 text-2xl h-10 w-12">
                          {form.watch('emoji')}
                        </Button>
                      </EmojiPickerPopover>
                    </FormItem>
                  </div>
                  <Button type="submit" className="w-full"><Send className="w-4 h-4 mr-2" /> Save Entry</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Calendar and Entries */}
        <div className="w-full md:w-2/3 flex flex-col gap-8">
          <Card className="bg-white/30 dark:bg-gray-800/30 shadow-lg backdrop-blur-sm border border-white/30 dark:border-gray-600/30">
            <CardHeader><CardTitle className="text-2xl text-gray-900 dark:text-white">Your Mood Calendar</CardTitle></CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="p-0"
                modifiers={moodModifiers}
                components={{ DayContent: DayWithMood }}
              />
            </CardContent>
          </Card>

          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Entries for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'today'}
            </h3>
            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
              {loading ? (
                <p>Loading entries...</p>
              ) : dailyEntries.length > 0 ? (
                dailyEntries.map(entry => (
                  <Card key={entry.id} className="bg-white/50 dark:bg-gray-800/50">
                    <CardHeader className="flex flex-row justify-between items-start pb-2">
                      <div>
                        <CardTitle className="text-xl">{entry.emoji} {entry.heading}</CardTitle>
                        <p className="text-sm text-muted-foreground">{format(new Date(entry.created_at), 'p')}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteEntry(entry.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap">{entry.content}</p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-muted-foreground">No entries for this day.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </BackgroundWrapper>
  );
};

export default Journal;