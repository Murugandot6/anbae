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
import { Trash2, ArrowLeft, Smile } from 'lucide-react';
import BackgroundWrapper from '@/components/BackgroundWrapper';
import { format, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import EmojiPickerPopover from '@/components/EmojiPickerPopover';

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
  content: z.string().min(1, "Please jot down your thoughts.").max(5000),
  emoji: z.string().min(1, "Please select an emoji."),
  mood: z.string().optional(),
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
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  const form = useForm<z.infer<typeof journalFormSchema>>({
    resolver: zodResolver(journalFormSchema),
    defaultValues: {
      heading: '',
      content: '',
      emoji: '😊',
      mood: 'Happy',
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
      content: values.content,
      emoji: values.emoji,
      mood: values.mood,
      created_at: selectedDate ? selectedDate.toISOString() : new Date().toISOString(),
    });

    if (error) {
      toast.error('Failed to save entry.');
    } else {
      toast.success('Journal entry saved!');
      form.reset({
        heading: '',
        content: '',
        emoji: '😊',
        mood: 'Happy',
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

  const handleMoodSelect = (mood: string, emoji: string) => {
    form.setValue('mood', mood, { shouldValidate: true });
    form.setValue('emoji', emoji, { shouldValidate: true });
  };

  const dailyEntries = useMemo(() => {
    if (!selectedDate) return [];
    return entries.filter(entry => isSameDay(new Date(entry.created_at), selectedDate));
  }, [entries, selectedDate]);

  return (
    <BackgroundWrapper>
      <div className="w-full max-w-2xl mx-auto p-4 md:p-8 mt-16 md:mt-8">
        <header className="flex justify-between items-center mb-6">
          {/* Replaced Link with Button for consistent styling and positioning */}
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
        </header>

        <div className="flex flex-col gap-8">
          <Card className="bg-card/60 dark:bg-card/60 shadow-lg backdrop-blur-md border border-border/50 rounded-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-foreground">
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
                        <FormControl><Input placeholder="e.g., A Productive Afternoon" {...field} className="bg-input/50 border-border/50 text-foreground" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormItem>
                    <FormLabel>How are you feeling?</FormLabel>
                    <div className="flex items-center gap-2 flex-wrap">
                      {moodOptions.map(({ emoji, mood }) => (
                        <Tooltip key={mood}>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => handleMoodSelect(mood, emoji)}
                              className={cn(
                                "text-4xl p-2 rounded-full transition-transform duration-200 hover:scale-110",
                                form.watch('emoji') === emoji ? 'ring-2 ring-primary bg-primary/20 dark:bg-primary/20' : 'hover:bg-accent/20'
                              )}
                            >
                              {emoji}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{mood}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                      <EmojiPickerPopover
                        isOpen={isEmojiPickerOpen}
                        onOpenChange={setIsEmojiPickerOpen}
                        onEmojiSelect={(emoji) => {
                          form.setValue('emoji', emoji, { shouldValidate: true });
                          form.setValue('mood', undefined, { shouldValidate: true });
                        }}
                      >
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-full w-14 h-14 text-foreground border-border hover:bg-accent hover:text-accent-foreground"
                          type="button"
                        >
                          <Smile className="w-6 h-6" />
                        </Button>
                      </EmojiPickerPopover>
                    </div>
                    <FormMessage>{form.formState.errors.emoji?.message}</FormMessage>
                  </FormItem>
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jot down your thoughts</FormLabel>
                        <FormControl><Textarea placeholder="What happened today? How did it make you feel?" {...field} rows={5} className="bg-input/50 border-border/50 text-foreground" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">Save Entry</Button>
                </form>
              </Form>
            </CardContent>
          </Card>

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