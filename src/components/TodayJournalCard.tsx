import React, { useState } from 'react';
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
import { Smile } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import EmojiPickerPopover from '@/components/EmojiPickerPopover';
import { MOOD_OPTIONS } from '@/constants/journal';
import { User } from '@supabase/supabase-js';

interface TodayJournalCardProps {
  user: User | null;
  onEntrySaved: () => void;
}

const journalFormSchema = z.object({
  heading: z.string().min(1, "Please give your day a title.").max(100),
  content: z.string().min(1, "Please jot down your thoughts.").max(5000),
  emoji: z.string().min(1, "Please select an emoji."),
  mood: z.string().optional(),
});

const TodayJournalCard: React.FC<TodayJournalCardProps> = ({ user, onEntrySaved }) => {
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const today = new Date();

  const form = useForm<z.infer<typeof journalFormSchema>>({
    resolver: zodResolver(journalFormSchema),
    defaultValues: {
      heading: '',
      content: '',
      emoji: '😊', // Default emoji
      mood: 'Happy', // Default mood
    },
  });

  const onSubmit = async (values: z.infer<typeof journalFormSchema>) => {
    if (!user) {
      toast.error("You must be logged in to save a journal entry.");
      return;
    }

    try {
      const { error } = await supabase.from('journal_entries').insert({
        user_id: user.id,
        heading: values.heading,
        content: values.content,
        emoji: values.emoji,
        mood: values.mood,
        created_at: today.toISOString(), // Always save for today
      });

      if (error) {
        toast.error('Failed to save entry: ' + error.message);
      } else {
        toast.success('Journal entry saved!');
        form.reset({
          heading: '',
          content: '',
          emoji: '😊',
          mood: 'Happy',
        });
        onEntrySaved(); // Notify parent to refresh entries
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

  return (
    <Card className="bg-card/60 dark:bg-card/60 shadow-lg backdrop-blur-md border border-border/50 rounded-xl mb-8">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-foreground">
          How was your day?
        </CardTitle>
        <p className="text-muted-foreground">{format(today, "EEEE, MMMM d, yyyy")}</p>
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
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">Save Entry</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default TodayJournalCard;