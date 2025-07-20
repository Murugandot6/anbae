import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Quote, Edit, Save, XCircle, User } from 'lucide-react';
import { toast } from 'sonner';
import { Profile } from '@/types/supabase';
import { format } from 'date-fns';
import { fetchProfileById } from '@/lib/supabaseHelpers';
import { cn } from '@/lib/utils';

interface SharedQuote {
  id: string;
  user_a_id: string;
  user_b_id: string;
  quote_text: string | null;
  last_updated_by: string | null;
  updated_at: string;
  lastUpdatedByProfile?: Profile | null;
}

interface SharedQuoteCardProps {
  currentUserId: string;
  partnerId: string | null;
  currentUserProfile: Profile | null;
  partnerProfile: Profile | null;
}

const SharedQuoteCard: React.FC<SharedQuoteCardProps> = ({
  currentUserId,
  partnerId,
  currentUserProfile,
  partnerProfile,
}) => {
  const [quote, setQuote] = useState<SharedQuote | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentQuoteText, setCurrentQuoteText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const getSortedUserIds = useCallback(() => {
    if (!currentUserId || !partnerId) return null;
    const ids = [currentUserId, partnerId].sort();
    return { userA: ids[0], userB: ids[1] };
  }, [currentUserId, partnerId]);

  const fetchQuote = useCallback(async () => {
    setIsLoading(true);
    const sortedIds = getSortedUserIds();
    if (!sortedIds) {
      setQuote(null);
      setCurrentQuoteText('');
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('shared_quotes')
      .select('*')
      .eq('user_a_id', sortedIds.userA)
      .eq('user_b_id', sortedIds.userB)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      toast.error('Failed to load shared quote: ' + error.message);
      setQuote(null);
      setCurrentQuoteText('');
    } else if (data) {
      let lastUpdatedByProfile: Profile | null = null;
      if (data.last_updated_by) {
        lastUpdatedByProfile = await fetchProfileById(data.last_updated_by);
      }
      setQuote({ ...data, lastUpdatedByProfile });
      setCurrentQuoteText(data.quote_text || '');
    } else {
      setQuote(null);
      setCurrentQuoteText('');
    }
    setIsLoading(false);
  }, [currentUserId, partnerId, getSortedUserIds]);

  useEffect(() => {
    fetchQuote();

    const sortedIds = getSortedUserIds();
    if (!sortedIds) return;

    const channel = supabase
      .channel(`shared_quote_${sortedIds.userA}_${sortedIds.userB}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shared_quotes',
          filter: `user_a_id=eq.${sortedIds.userA}.and.user_b_id=eq.${sortedIds.userB}`
        },
        async (payload) => {
          const newQuote = payload.new as SharedQuote;
          let lastUpdatedByProfile: Profile | null = null;
          if (newQuote.last_updated_by) {
            lastUpdatedByProfile = await fetchProfileById(newQuote.last_updated_by);
          }
          setQuote({ ...newQuote, lastUpdatedByProfile });
          setCurrentQuoteText(newQuote.quote_text || '');
          toast.info('Shared quote updated!');
          setIsEditing(false); // Exit editing mode if updated by another user
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchQuote, getSortedUserIds]);

  const handleSave = async () => {
    if (!currentUserId || !partnerId) {
      toast.error('User or partner not identified.');
      return;
    }
    if (!currentQuoteText.trim()) {
      toast.error('Quote cannot be empty.');
      return;
    }

    setIsLoading(true);
    const sortedIds = getSortedUserIds();
    if (!sortedIds) {
      setIsLoading(false);
      return;
    }

    try {
      let data, error;
      if (quote) {
        // Update existing quote
        ({ data, error } = await supabase
          .from('shared_quotes')
          .update({ quote_text: currentQuoteText, last_updated_by: currentUserId, updated_at: new Date().toISOString() })
          .eq('id', quote.id)
          .select()
          .single());
      } else {
        // Insert new quote
        ({ data, error } = await supabase
          .from('shared_quotes')
          .insert({
            user_a_id: sortedIds.userA,
            user_b_id: sortedIds.userB,
            quote_text: currentQuoteText,
            last_updated_by: currentUserId,
          })
          .select()
          .single());
      }

      if (error) {
        toast.error('Failed to save quote: ' + error.message);
      } else if (data) {
        let lastUpdatedByProfile: Profile | null = null;
        if (data.last_updated_by) {
          lastUpdatedByProfile = await fetchProfileById(data.last_updated_by);
        }
        setQuote({ ...data, lastUpdatedByProfile });
        toast.success('Quote saved successfully!');
        setIsEditing(false);
      }
    } catch (err: any) {
      toast.error('An unexpected error occurred while saving.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setCurrentQuoteText(quote?.quote_text || '');
    setIsEditing(false);
  };

  const lastUpdatedByName = quote?.lastUpdatedByProfile?.username || quote?.lastUpdatedByProfile?.email || 'Unknown';
  const lastUpdatedAt = quote?.updated_at ? format(new Date(quote.updated_at), 'MMM dd, yyyy h:mm a') : 'N/A';

  if (!partnerId) {
    return (
      <Card className="w-full shadow-lg bg-card/60 backdrop-blur-md border border-border/50 rounded-xl animate-fade-in">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-xl text-foreground">
            <Quote className="w-6 h-6 text-primary" /> Shared Quote
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-muted-foreground text-center">
          <p>Link with your partner to share a quote!</p>
          <p className="text-sm mt-2">Go to "Edit Profile" to set your partner's email.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg bg-card/60 backdrop-blur-md border border-border/50 rounded-xl animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-xl text-foreground">
          <div className="flex items-center gap-2">
            <Quote className="w-6 h-6 text-primary" /> Shared Quote
          </div>
          {!isEditing && (
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} disabled={isLoading}>
              <Edit className="w-4 h-4 mr-2" /> {quote?.quote_text ? 'Edit' : 'Add Quote'}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {isEditing ? (
          <>
            <Textarea
              placeholder="Enter your shared quote here..."
              value={currentQuoteText}
              onChange={(e) => setCurrentQuoteText(e.target.value)}
              rows={3}
              className="bg-input/50 border-border/50 text-foreground"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={isLoading}>
                <XCircle className="w-4 h-4 mr-2" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isLoading || !currentQuoteText.trim()}>
                <Save className="w-4 h-4 mr-2" /> {isLoading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center">
            {quote?.quote_text ? (
              <>
                <p className="text-lg italic text-foreground mb-2">"{quote.quote_text}"</p>
                <p className="text-xs text-muted-foreground">
                  Last updated by {lastUpdatedByName} on {lastUpdatedAt}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">No shared quote yet. Click "Add Quote" to set one!</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SharedQuoteCard;