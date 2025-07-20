import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { JournalEntry } from '@/types/supabase';
import { format, isSameDay } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile'; // Import useIsMobile
import { MOOD_OPTIONS } from '@/constants/journal'; // Import MOOD_OPTIONS

interface JournalEntryCardProps {
  user: User;
  initialEntry: JournalEntry | null;
  onEntryUpdated: (entry: JournalEntry) => void;
  selectedDate: Date;
}

const JournalEntryCard: React.FC<JournalEntryCardProps> = ({ user, initialEntry, onEntryUpdated, selectedDate }) => {
  const [heading, setHeading] = useState(initialEntry?.heading || '');
  const [content, setContent] = useState(initialEntry?.content || '');
  const [mood, setMood] = useState(initialEntry?.mood || '');
  const [isEditing, setIsEditing] = useState(!initialEntry); // Initial state based on whether an entry exists
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useIsMobile();

  // Reset state when initialEntry or selectedDate changes
  useEffect(() => {
    setHeading(initialEntry?.heading || '');
    setContent(initialEntry?.content || '');
    setMood(initialEntry?.mood || '');
    setIsEditing(!initialEntry); // If no initial entry, start in editing mode
  }, [initialEntry, selectedDate]); // Added selectedDate to dependencies

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const entryData = {
        user_id: user.id,
        // Use selectedDate for created_at if creating a new entry, otherwise keep original
        created_at: initialEntry?.created_at || selectedDate.toISOString(), 
        heading,
        content,
        mood,
        emoji: mood ? MOOD_OPTIONS[mood as keyof typeof MOOD_OPTIONS]?.emoji : null,
      };

      let data, error;
      if (initialEntry) {
        // Update existing entry
        ({ data, error } = await supabase
          .from('journal_entries')
          .update(entryData)
          .eq('id', initialEntry.id)
          .select()
          .single());
      } else {
        // Insert new entry
        ({ data, error } = await supabase
          .from('journal_entries')
          .insert(entryData)
          .select()
          .single());
      }

      if (error) {
        toast.error('Failed to save journal entry: ' + error.message);
      } else if (data) {
        toast.success('Journal entry saved!');
        onEntryUpdated(data); // Notify parent to re-fetch/update
        setIsEditing(false);
      }
    } catch (err: any) {
      toast.error('An unexpected error occurred while saving.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    // If there was an initial entry, revert to its values and exit editing
    if (initialEntry) {
      setHeading(initialEntry.heading || '');
      setContent(initialEntry.content || '');
      setMood(initialEntry.mood || '');
      setIsEditing(false);
    } else {
      // If no initial entry (meaning we were creating a new one), clear fields and exit editing
      setHeading('');
      setContent('');
      setMood('');
      setIsEditing(false); 
    }
  };

  const isCurrentDayToday = isSameDay(selectedDate, new Date());

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className={`flex items-center justify-between ${isMobile ? 'text-base' : 'text-xl'}`}>
          <span>
            {isCurrentDayToday ? "Today's Journal" : `Journal for ${format(selectedDate, 'MMM dd, yyyy')}`}
            {initialEntry && !isEditing && (
              <span className="ml-2 text-xl sm:text-2xl">{initialEntry.emoji || MOOD_OPTIONS[initialEntry.mood as keyof typeof MOOD_OPTIONS]?.emoji}</span>
            )}
          </span>
          <div className="flex gap-2">
            {!isEditing && initialEntry && ( // Show Edit button if an entry exists and not editing
              <Button variant="ghost" size={isMobile ? 'sm' : 'default'} onClick={handleEdit} className="h-8 px-3 text-sm">Edit</Button>
            )}
            {!isEditing && !initialEntry && ( // Show Add Entry button if no entry exists and not editing
              <Button variant="ghost" size={isMobile ? 'sm' : 'default'} onClick={handleEdit} className="h-8 px-3 text-sm">Add Entry</Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className={`${isMobile ? 'p-3' : 'p-6'} space-y-3 sm:space-y-4`}>
        {isEditing ? (
          <>
            <Input
              placeholder="Heading (e.g., A great day!)"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              className={isMobile ? 'text-sm h-9' : 'text-base h-10'}
            />
            <Textarea
              placeholder="What's on your mind today?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={isMobile ? 'text-sm min-h-[70px]' : 'min-h-[120px]'}
            />
            <Select value={mood} onValueChange={setMood}>
              <SelectTrigger className={isMobile ? 'text-sm h-9' : 'text-base h-10'}>
                <SelectValue placeholder="How are you feeling?" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MOOD_OPTIONS).map(([moodText, { emoji }]) => (
                  <SelectItem key={moodText} value={moodText} className={isMobile ? 'text-sm' : 'text-base'}>
                    {emoji} {moodText}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size={isMobile ? 'sm' : 'default'} onClick={handleCancel} disabled={isLoading} className="h-8 px-3 text-sm">Cancel</Button>
              <Button onClick={handleSave} disabled={isLoading} className="h-8 px-3 text-sm">
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </>
        ) : (
          initialEntry ? ( // Display content only if initialEntry exists
            <div className={`${isMobile ? 'text-sm' : 'text-base'} space-y-2`}>
              <p className="font-semibold">{heading}</p>
              <p className="whitespace-pre-wrap">{content}</p>
            </div>
          ) : ( // Message when no entry for the selected day
            <div className="text-center text-muted-foreground py-4">
              <p className="text-sm sm:text-base">No journal entry for this day.</p>
              <p className="text-xs sm:text-sm mt-1">Click "Add Entry" to create one.</p>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
};

export default JournalEntryCard;