import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/contexts/SessionContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Music, Video, Sparkles } from 'lucide-react';
import BackgroundWrapper from '@/components/BackgroundWrapper';

const promposalFormSchema = z.object({
  video_url: z.string().url({ message: "Please enter a valid video URL." }),
  lrc_content: z.string().min(1, "Please provide LRC format lyrics."),
});

const CreatePromposal = () => {
  const { user, loading: sessionLoading } = useSession();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof promposalFormSchema>>({
    resolver: zodResolver(promposalFormSchema),
    defaultValues: {
      video_url: '',
      lrc_content: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof promposalFormSchema>) => {
    if (!user) {
      toast.error("You must be logged in to create a promposal.");
      return;
    }

    const { data, error } = await supabase
      .from('proposals')
      .insert({
        creator_id: user.id,
        video_url: values.video_url,
        lrc_content: values.lrc_content,
      })
      .select('id')
      .single();

    if (error) {
      toast.error('Failed to create promposal: ' + error.message);
    } else {
      toast.success('Promposal created successfully!');
      navigate(`/promposal/${data.id}`);
    }
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-950 text-foreground">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <BackgroundWrapper>
      <div className="w-full max-w-2xl mx-auto p-4 md:p-8 mt-16 md:mt-8">
        <header className="flex items-center mb-6">
          <Link to="/dashboard">
            <Button variant="outline" size="icon" className="w-10 h-10 rounded-full mr-4">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Your Promposal</h1>
        </header>

        <Card className="bg-white/80 dark:bg-gray-800/80 shadow-lg backdrop-blur-sm border border-white/30 dark:border-gray-600/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
              <Sparkles className="w-6 h-6 text-yellow-500" />
              A Special Message
            </CardTitle>
            <CardDescription>
              Set up a video with synchronized lyrics to share with your partner.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="video_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Video className="w-4 h-4" /> Video URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://www.youtube.com/watch?v=..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lrc_content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Music className="w-4 h-4" /> Lyrics (LRC Format)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="[00:01.15]I love you still..."
                          {...field}
                          rows={10}
                          className="font-mono text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700 text-white dark:bg-purple-600 dark:hover:bg-purple-700">
                  Create & Get Link
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </BackgroundWrapper>
  );
};

export default CreatePromposal;