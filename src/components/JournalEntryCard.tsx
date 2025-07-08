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

interface JournalEntryCardProps {
  user: User;
  initialEntry: JournalEntry | null;
  onEntryUpdated: (entry: JournalEntry) => void;
  selectedDate: Date;
}

const moodEmojis = {
  'Excellent': '😊',
  'Good': '🙂',
  'Neutral': '😐',
  'Bad': '🙁',
  'Terrible': '😞',
};

const JournalEntryCard: React.FC<JournalEntryCardProps> = ({ user, initialEntry, onEntryUpdated, selectedDate }) => {
  const [heading, setHeading] = useState(initialEntry?.heading || '');
  const [content, setContent] = useState(initialEntry?.content || '');
  const [mood, setMood] = useState(initialEntry?.mood || '');
  const [isEditing, setIsEditing] = useState(!initialEntry);
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useIsMobile(); // Use the hook

  useEffect(() => {
    setHeading(initialEntry?.heading || '');
    setContent(initialEntry?.content || '');
    setMood(initialEntry?.mood || '');
    setIsEditing(!initialEntry); // If no initial entry, start in editing mode
  }, [initialEntry]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const entryData = {
        user_id: user.id,
        created_at: initialEntry?.created_at || new Date().toISOString(), // Keep original created_at if updating
        heading,
        content,
        mood,
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
        onEntryUpdated(data);
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
    setHeading(initialEntry?.heading || '');
    setContent(initialEntry?.content || '');
    setMood(initialEntry?.mood || '');
    setIsEditing(false);
  };

  const isToday = isSameDay(selectedDate, new Date());

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className={`flex items-center justify-between ${isMobile ? 'text-lg' : 'text-xl'}`}>
          <span>
            {isToday ? "Today's Journal" : `Journal for ${format(selectedDate, 'MMM dd, yyyy')}`}
            {initialEntry && !isEditing && (
              <span className="ml-2 text-2xl">{initialEntry.emoji || moodEmojis[initialEntry.mood as keyof typeof moodEmojis]}</span>
            )}
          </span>
          {!isEditing && isToday && (
            <Button variant="ghost" size={isMobile ? 'sm' : 'default'} onClick={handleEdit}>Edit</Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className={`${isMobile ? 'p-3' : 'p-6'} space-y-4`}> {/* Reduced padding */}
        {isEditing ? (
          <>
            <Input
              placeholder="Heading (e.g., A great day!)"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              className={isMobile ? 'text-sm' : ''} // Reduced font size for input
            />
            <Textarea
              placeholder="What's on your mind today?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={isMobile ? 'text-sm min-h-[80px]' : 'min-h-[120px]'} // Reduced font size and min-height
            />
            <Select value={mood} onValueChange={setMood}>
              <SelectTrigger className={isMobile ? 'text-sm' : ''}> {/* Reduced font size for select */}
                <SelectValue placeholder="How are you feeling?" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(moodEmojis).map(([moodText, emoji]) => (
                  <SelectItem key={moodText} value={moodText}>
                    {emoji} {moodText}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size={isMobile ? 'sm' : 'default'} onClick={handleCancel} disabled={isLoading}>Cancel</Button>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </>
        ) : (
          <div className={`${isMobile ? 'text-sm' : 'text-base'} space-y-2`}> {/* Reduced font size for display */}
            <p className="font-semibold">{heading}</p>
            <p className="whitespace-pre-wrap">{content}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default JournalEntryCard;