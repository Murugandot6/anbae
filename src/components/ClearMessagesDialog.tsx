import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { HeartCrack, CheckCircle, XCircle, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ClearRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'denied' | 'completed';
  sender_message: string | null;
  receiver_response_message: string | null;
  created_at: string;
  updated_at: string;
  senderProfile?: { username: string | null; email: string | null } | null;
  receiverProfile?: { username: string | null; email: string | null } | null;
}

interface ClearMessagesDialogProps {
  partnerId: string | null;
  partnerNickname: string | null;
  currentUserId: string | null;
  onMessagesCleared?: () => void;
}

const ClearMessagesDialog: React.FC<ClearMessagesDialogProps> = ({ partnerId, partnerNickname, currentUserId, onMessagesCleared }) => {
  const { user } = useSession();
  const [isSendRequestOpen, setIsSendRequestOpen] = useState(false);
  const [isPartnerResponseOpen, setIsPartnerResponseOpen] = useState(false);
  const [isSenderReconfirmOpen, setIsSenderReconfirmOpen] = useState(false);
  const [senderMessage, setSenderMessage] = useState('');
  const [receiverResponseMessage, setReceiverResponseMessage] = useState('');
  const [pendingIncomingRequest, setPendingIncomingRequest] = useState<ClearRequest | null>(null);
  const [pendingOutgoingRequest, setPendingOutgoingRequest] = useState<ClearRequest | null>(null);

  const fetchSenderProfile = useCallback(async (senderId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('username, email')
      .eq('id', senderId)
      .single();
    if (error) {
      console.error('Error fetching sender profile:', error.message);
      return null;
    }
    return data;
  }, []);

  useEffect(() => {
    const fetchAndSubscribeRequests = async () => {
      if (!currentUserId) return;

      const { data: incomingRequests, error: incomingError } = await supabase
        .from('clear_requests')
        .select('*')
        .eq('receiver_id', currentUserId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1);

      if (incomingError) {
        console.error('Error fetching incoming clear requests:', incomingError.message);
      } else if (incomingRequests && incomingRequests.length > 0) {
        const newRequest = incomingRequests[0] as ClearRequest;
        const senderProfile = await fetchSenderProfile(newRequest.sender_id);
        setPendingIncomingRequest({ ...newRequest, senderProfile });
        setIsPartnerResponseOpen(true);
      }

      const { data: outgoingRequests, error: outgoingError } = await supabase
        .from('clear_requests')
        .select('*')
        .eq('sender_id', currentUserId)
        .in('status', ['accepted', 'denied'])
        .order('updated_at', { ascending: false })
        .limit(1);

      if (outgoingError) {
        console.error('Error fetching outgoing clear requests:', outgoingError.message);
      } else if (outgoingRequests && outgoingRequests.length > 0) {
        const latestOutgoing = outgoingRequests[0] as ClearRequest;
        setPendingOutgoingRequest(latestOutgoing);
        if (latestOutgoing.status === 'accepted') {
          setIsSenderReconfirmOpen(true);
        } else if (latestOutgoing.status === 'denied') {
            if (!isSenderReconfirmOpen) {
                toast.info(`Your partner denied the clear request: "${latestOutgoing.receiver_response_message || 'No message provided.'}"`);
            }
        }
      }
    };

    fetchAndSubscribeRequests();

    const channel = supabase
      .channel('clear_requests_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clear_requests',
          filter: `receiver_id=eq.${currentUserId}`
        },
        async (payload) => {
          const newRequest = payload.new as ClearRequest;

          if (payload.eventType === 'INSERT' && newRequest.status === 'pending') {
            const senderProfile = await fetchSenderProfile(newRequest.sender_id);
            setPendingIncomingRequest({ ...newRequest, senderProfile });
            setIsPartnerResponseOpen(true);
            toast.info(`New clear message request from ${senderProfile?.username || senderProfile?.email || 'Your Partner'}!`);
          } else if (payload.eventType === 'UPDATE' && newRequest.status !== 'pending' && newRequest.sender_id === currentUserId) {
            setPendingOutgoingRequest(newRequest);
            if (newRequest.status === 'accepted') {
              setIsSenderReconfirmOpen(true);
            } else if (newRequest.status === 'denied') {
              toast.info(`Your partner denied the clear request: "${newRequest.receiver_response_message || 'No message provided.'}"`);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, fetchSenderProfile, isSenderReconfirmOpen]);


  const handleSendRequest = async () => {
    if (!user || !partnerId) {
      toast.error('User or partner not identified.');
      return;
    }

    try {
      const { data, error } = await supabase.from('clear_requests').insert({
        sender_id: user.id,
        receiver_id: partnerId,
        status: 'pending',
        sender_message: senderMessage,
      }).select().single();

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Clear message request sent to your partner!');
        setSenderMessage('');
        setIsSendRequestOpen(false);
        setPendingOutgoingRequest(data);
      }
    } catch (error) {
      toast.error('An unexpected error occurred.');
    }
  };

  const handlePartnerResponse = async (status: 'accepted' | 'denied') => {
    if (!pendingIncomingRequest || !user) return;

    try {
      const { error } = await supabase
        .from('clear_requests')
        .update({ status: status, receiver_response_message: receiverResponseMessage })
        .eq('id', pendingIncomingRequest.id);

      if (error) {
        toast.error(error.message);
      } else {
        toast.success(`Request ${status} successfully!`);
        setReceiverResponseMessage('');
        setIsPartnerResponseOpen(false);
        setPendingIncomingRequest(null);
      }
    } catch (error) {
      toast.error('An unexpected error occurred.');
    }
  };

  const handleFinalClearConfirmation = async () => {
    if (!pendingOutgoingRequest || pendingOutgoingRequest.status !== 'accepted' || !user) {
      toast.error('Invalid request or not accepted.');
      return;
    }

    const payload = {
      clearRequestId: pendingOutgoingRequest.id,
      userId: user.id,
      partnerId: pendingOutgoingRequest.receiver_id,
    };

    try {
      const { data, error } = await supabase.functions.invoke('clear-messages', {
        body: JSON.stringify(payload),
      });

      if (error) {
        toast.error(error.message);
      } else if (data && data.success) {
        toast.success('All messages cleared successfully!');
        setIsSenderReconfirmOpen(false);
        setPendingOutgoingRequest(null);
        onMessagesCleared?.();
      } else {
        toast.error(data?.message || 'Failed to clear messages.');
      }
    } catch (error) {
      toast.error('An unexpected error occurred during message clearing.');
    }
  };

  return (
    <div className="clear-messages-dialog-container">
      <AlertDialog open={isSendRequestOpen} onOpenChange={setIsSendRequestOpen}>
        <AlertDialogTrigger asChild>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="destructive" size="icon" className="w-10 h-10 bg-destructive hover:bg-destructive/90 text-destructive-foreground inline-flex items-center justify-center rounded-full shadow-md">
                <HeartCrack className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Clear All Messages
            </TooltipContent>
          </Tooltip>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-card/80 backdrop-blur-md border border-border/50 rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-foreground">
              <Info className="w-6 h-6 text-primary" /> Send Clear All Messages Request?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will send a request to {partnerNickname || 'your partner'} to clear all messages. They will need to approve it.
              {pendingIncomingRequest?.sender_message && (
                <p className="mt-2 italic">"Sender's message: {pendingIncomingRequest.sender_message}"</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="senderMessage" className="text-foreground">Optional Message to Partner</Label>
              <Textarea
                id="senderMessage"
                placeholder="e.g., 'Let's start fresh!'"
                value={senderMessage}
                onChange={(e) => setSenderMessage(e.target.value)}
                className="bg-input/50 border-border/50 text-foreground"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-foreground border-border hover:bg-accent/20 hover:text-accent-foreground">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSendRequest} className="bg-primary hover:bg-primary/90 text-primary-foreground">Send Request</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {pendingIncomingRequest && (
        <AlertDialog open={isPartnerResponseOpen} onOpenChange={setIsPartnerResponseOpen}>
          <AlertDialogContent className="bg-card/80 backdrop-blur-md border border-border/50 rounded-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-foreground">
                <Info className="w-6 h-6 text-primary" /> Clear Messages Request from {pendingIncomingRequest.senderProfile?.username || pendingIncomingRequest.senderProfile?.email || 'Your Partner'}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Your partner wants to clear all messages.
                {pendingIncomingRequest.sender_message && (
                  <p className="mt-2 italic">"Sender's message: {pendingIncomingRequest.sender_message}"</p>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="receiverResponseMessage" className="text-foreground">Optional Response Message</Label>
                <Textarea
                  id="receiverResponseMessage"
                  placeholder="e.g., 'Sure, let's do it!'"
                  value={receiverResponseMessage}
                  onChange={(e) => setReceiverResponseMessage(e.target.value)}
                  className="bg-input/50 border-border/50 text-foreground"
                />
              </div>
            </div>
            <AlertDialogFooter>
              <Button variant="outline" onClick={() => handlePartnerResponse('denied')} className="text-destructive border-destructive hover:bg-destructive/20 hover:text-destructive-foreground">
                <XCircle className="w-4 h-4 mr-2" /> Deny
              </Button>
              <Button onClick={() => handlePartnerResponse('accepted')} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <CheckCircle className="w-4 h-4 mr-2" /> Accept
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {pendingOutgoingRequest && pendingOutgoingRequest.status === 'accepted' && (
        <AlertDialog open={isSenderReconfirmOpen} onOpenChange={setIsSenderReconfirmOpen}>
          <AlertDialogContent className="bg-card/80 backdrop-blur-md border border-border/50 rounded-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-foreground">
                <CheckCircle className="w-6 h-6 text-primary" /> Partner Accepted Your Request!
              </AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription className="text-muted-foreground">
              Your partner has accepted your request to clear all messages.
              {pendingOutgoingRequest.receiver_response_message && (
                <p className="mt-2 italic">"Partner's message: {pendingOutgoingRequest.receiver_response_message}"</p>
              )}
              <p className="mt-4 font-semibold text-destructive">
                Are you sure you want to proceed with clearing ALL messages? This action cannot be undone.
              </p>
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel className="text-foreground border-border hover:bg-accent/20 hover:text-accent-foreground">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleFinalClearConfirmation} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                Yes, Clear All Messages
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default ClearMessagesDialog;