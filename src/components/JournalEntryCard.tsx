import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Smile, Edit, Save, XCircle } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import EmojiPickerPopover from '@/components/EmojiPickerPopover';
import { MOOD_OPTIONS } from '@/constants/journal';
import { User } from '@supabase/supabase-js';
import { JournalEntry } from '@/types/supabase'; // Import JournalEntry type

interface JournalEntryCardProps {
  user: User | null;
  initialEntry?: JournalEntry | null; // Optional initial entry for display/edit
  onEntryUpdated: (entry: JournalEntry) => void; // Callback for both new and updated entries
  selectedDate?: Date; // Optional date for which the entry is being created/edited
}

const journalFormSchema = z.object({
  heading: z.string().min(1, "Please give your day a title.").max(100),
  content: z.string().min(1, "Please jot down your thoughts.").max(5000),
  emoji: z.string().min(1, "Please select an emoji."),
  mood: z.string().optional(),
});

const JournalEntryCard: React.FC<JournalEntryCardProps> = ({ user, initialEntry, onEntryUpdated, selectedDate = new Date() }) => {
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(!initialEntry); // Start in edit mode if no initial entry
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(initialEntry || null);

  const form = useForm<z.infer<typeof journalFormSchema>>({
    resolver: zodResolver(journalFormSchema),
    defaultValues: {
      heading: currentEntry?.heading || '',
      content: currentEntry?.content || '',
      emoji: currentEntry?.emoji || '😊',
      mood: currentEntry?.mood || 'Happy',
    },
  });

  useEffect(() => {
    // Reset form and editing state when initialEntry or selectedDate changes
    const isInitialEntryForSelectedDate = initialEntry && isSameDay(new Date(initialEntry.created_at), selectedDate);
    setCurrentEntry(isInitialEntryForSelectedDate ? initialEntry : null);
    setIsEditing(!isInitialEntryForSelectedDate); // If no entry for selected date, show form

    form.reset({
      heading: isInitialEntryForSelectedDate ? initialEntry.heading || '' : '',
      content: isInitialEntryForSelectedDate ? initialEntry.content || '' : '',
      emoji: isInitialEntryForSelectedDate ? initialEntry.emoji || '😊' : '😊',
      mood: isInitialEntryForSelectedDate ? initialEntry.mood || 'Happy' : 'Happy',
    });
  }, [initialEntry, selectedDate, form]);

  const onSubmit = async (values: z.infer<typeof journalFormSchema>) => {
    if (!user) {
      toast.error("You must be logged in to save a journal entry.");
      return;
    }

    try {
      let data: JournalEntry | null = null;
      let error: any = null;

      if (currentEntry) {
        // Update existing entry
        const { data: updatedData, error: updateError } = await supabase
          .from('journal_entries')
          .update({
            heading: values.heading,
            content: values.content,
            emoji: values.emoji,
            mood: values.mood,
            // created_at should not change on update
          })
          .eq('id', currentEntry.id)
          .select()
          .single();
        data = updatedData;
        error = updateError;
      } else {
        // Insert new entry
        const { data: newEntryData, error: insertError } = await supabase.from('journal_entries').insert({
          user_id: user.id,
          heading: values.heading,
          content: values.content,
          emoji: values.emoji,
          mood: values.mood,
          created_at: selectedDate.toISOString(), // Use selectedDate for new entry
        }).select().single();
        data = newEntryData;
        error = insertError;
      }

      if (error) {
        toast.error('Failed to save entry: ' + error.message);
      } else if (data) {
        toast.success('Journal entry saved!');
        setCurrentEntry(data); // Update current entry with saved data
        setIsEditing(false); // Switch to display mode
        onEntryUpdated(data); // Notify parent
      }
    } catch (error: any) {
      toast.error('An unexpected error occurred while saving the entry.');
    }
  };

  const handleMoodSelect = (mood: string, emoji: string) => {
    form.setValue('mood', mood, { shouldValidate: true });
    form.setValue('emoji', emoji, { shouldValidate: true });
  };

  const selectedEmoji = form.watch('emoji');

  if (!user) {
    return null; // Or a message indicating user needs to log in
  }

  const formattedDate = format(selectedDate, "EEEE, MMMM d, yyyy");

  return (
    <Card className="bg-card/60 dark:bg-card/60 shadow-lg backdrop-blur-md border border-border/50 rounded-xl mb-8">
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
          <CardTitle className="text-2xl font-bold text-foreground">
            {isEditing ? `How was your day?` : `Your Entry for ${format(new Date(currentEntry?.created_at || selectedDate), 'MMMM d, yyyy')}`}
          </CardTitle>
          <p className="text-muted-foreground">{formattedDate}</p>
        </div>
        {!isEditing && currentEntry && (
          <Button variant="outline" size="icon" onClick={() => setIsEditing(true)} className="text-foreground border-border hover:bg-accent/20">
            <Edit className="w-5 h-5" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
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
                  {Object.entries(MOOD_OPTIONS).map(([mood, { emoji, color }]) => (
                    <Tooltip key={mood}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => handleMoodSelect(mood, emoji)}
                          className={cn(
                            "text-4xl p-2 rounded-full transition-transform duration-200 hover:scale-110",
                            selectedEmoji === emoji ? `ring-2 ring-primary ${color}` : 'hover:bg-accent/20'
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
                      form.setValue('mood', undefined, { shouldValidate: true }); // Clear mood if custom emoji selected
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
              <div className="flex gap-2">
                {currentEntry && (
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="w-full text-foreground border-border hover:bg-accent/20">
                    <XCircle className="w-4 h-4 mr-2" /> Cancel
                  </Button>
                )}
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Save className="w-4 h-4 mr-2" /> {currentEntry ? 'Update Entry' : 'Save Entry'}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              {currentEntry?.emoji} {currentEntry?.heading}
            </h3>
            {currentEntry?.mood && (
              <p className="text-sm text-muted-foreground">Mood: {currentEntry.mood}</p>
            )}
            <p className="whitespace-pre-wrap text-foreground">{currentEntry?.content}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default JournalEntryCard;