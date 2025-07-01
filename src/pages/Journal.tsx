import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { BookOpen, Trash2, ArrowLeft } from 'lucide-react';
import BackgroundWrapper from '@/components/BackgroundWrapper';
import { format, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface JournalEntry {
  id: string;
  created_at: string;
  heading: string | null;
  mood: string | null;
  content: string;
  emoji: string | null;
}

const journalFormSchema = z.object({
  heading: z.string().min(1, "Please give your day a title.").max(100),
  mood: z.string().min(1, "Please select how you are feeling."),
  content: z.string().min(1, "Please jot down your thoughts.").max(5000),
  emoji: z.string().min(1, "Please select an emoji."),
});

const moodOptions = [
  { emoji: '😍', mood: 'Loved' },
  { emoji: '😊', mood: 'Happy' },
  { emoji: '😐', mood: 'Neutral' },
  { emoji: '😟', mood: 'Sad' },
  { emoji: '😭', mood: 'Crying' },
];

const Journal = () => {
  const { user, loading: sessionLoading } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    location.state?.selectedDate ? new Date(location.state.selectedDate) : new Date()
  );

  const form = useForm<z.infer<typeof journalFormSchema>>({
    resolver: zodResolver(journalFormSchema),
    defaultValues: {
      heading: '',
      mood: 'Neutral',
      content: '',
      emoji: '😐',
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

  const onSubmit = async (values: z.infer<typeof journalFormSchema>) => {
    if (!user) return;

    const { error } = await supabase.from('journal_entries').insert({
      user_id: user.id,
      heading: values.heading,
      mood: values.mood,
      content: values.content,
      emoji: values.emoji,
      created_at: selectedDate ? selectedDate.toISOString() : new Date().toISOString(),
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
        emoji: '😐',
      });
      fetchJournalData();
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

  const handleEmojiSelect = (mood: string, emoji: string) => {
    form.setValue('mood', mood, { shouldValidate: true });
    form.setValue('emoji', emoji, { shouldValidate: true });
  };

  const dailyEntries = useMemo(() => {
    if (!selectedDate) return [];
    return entries.filter(entry => isSameDay(new Date(entry.created_at), selectedDate));
  }, [entries, selectedDate]);

  return (
    <BackgroundWrapper>
      <div className="w-full max-w-4xl mx-auto p-4 md:p-8 mt-16 md:mt-8">
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">M</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Moodscape Journal</h1>
          </div>
          <Link to="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
            </Button>
          </Link>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="bg-white/80 dark:bg-gray-800/80 shadow-lg backdrop-blur-sm border border-white/30 dark:border-gray-600/30">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                How was your day?
              </CardTitle>
              <p className="text-muted-foreground">{format(selectedDate || new Date(), "EEEE, MMMM d, yyyy")}</p>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="heading"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Give your day a title</FormLabel>
                        <FormControl><Input placeholder="e.g., A Productive Afternoon" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormItem>
                    <FormLabel>How are you feeling?</FormLabel>
                    <div className="flex justify-around items-center p-2">
                      {moodOptions.map(({ emoji, mood }) => (
                        <button
                          type="button"
                          key={mood}
                          onClick={() => handleEmojiSelect(mood, emoji)}
                          className={cn(
                            "text-4xl p-2 rounded-full transition-transform duration-200 hover:scale-110",
                            form.watch('emoji') === emoji ? 'ring-2 ring-blue-500 bg-blue-100 dark:bg-blue-900' : ''
                          )}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    <FormMessage>{form.formState.errors.mood?.message}</FormMessage>
                  </FormItem>
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jot down your thoughts</FormLabel>
                        <FormControl><Textarea placeholder="What happened today? How did it make you feel?" {...field} rows={5} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">Save Entry</Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <div className="mt-6 md:mt-0">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Entries for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'today'}
            </h3>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {loading ? (
                <p>Loading entries...</p>
              ) : dailyEntries.length > 0 ? (
                dailyEntries.map(entry => (
                  <Card key={entry.id} className="bg-white/50 dark:bg-gray-800/50">
                    <CardHeader className="flex flex-row justify-between items-start pb-2">
                      <div>
                        <CardTitle className="text-lg">{entry.emoji} {entry.heading}</CardTitle>
                        <p className="text-sm text-muted-foreground">{format(new Date(entry.created_at), 'p')}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteEntry(entry.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="whitespace-pre-wrap">{entry.content}</p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-muted-foreground">No entries for this day. You can add one for this date!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </BackgroundWrapper>
  );
};

export default Journal;