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
import { Helmet } from 'react-helmet-async'; // Import Helmet
import LoadingPulsar from '@/components/LoadingPulsar';

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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-background/80 text-foreground">
        <LoadingPulsar />
        <p className="text-xl mt-4">Loading...</p>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Create Promposal - Anbae</title>
        <meta name="description" content="Create a personalized video promposal with synchronized lyrics for your partner on Anbae." />
      </Helmet>
      <BackgroundWrapper className="pt-0 md:pt-0">
        <div className="w-full max-w-xl sm:max-w-2xl mx-auto p-4 md:p-8 mt-16 md:mt-8">
          <header className="flex items-center mb-6">
            {/* Replaced Link with Button for consistent styling and positioning */}
            <div className="absolute top-3 left-3 z-10">
              <Link to="/dashboard">
                <Button variant="outline" size="icon" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full text-foreground border-border hover:bg-accent hover:text-accent-foreground shadow-md">
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mx-auto">Create Your Promposal</h1>
          </header>

          <Card className="bg-card/60 dark:bg-card/60 shadow-lg backdrop-blur-md border border-border/50 rounded-xl p-3 sm:p-4"> {/* Adjusted padding */}
            <CardHeader className="pb-3 sm:pb-4"> {/* Adjusted padding */}
              <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-foreground">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                A Special Message
              </CardTitle>
              <CardDescription className="text-muted-foreground text-sm sm:text-base">
                Set up a video with synchronized lyrics to share with your partner.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6">
                  <FormField
                    control={form.control}
                    name="video_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-sm sm:text-base"><Video className="w-4 h-4 text-primary" /> Video URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://www.youtube.com/watch?v=..." {...field} className="bg-input/50 border-border/50 text-foreground text-sm sm:text-base" />
                        </FormControl>
                        <FormMessage className="text-xs sm:text-sm" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lrc_content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-sm sm:text-base"><Music className="w-4 h-4 text-primary" /> Lyrics (LRC Format)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="[00:01.15]I love you still..."
                            {...field}
                            rows={8} className="font-mono text-xs sm:text-sm bg-input/50 border-border/50 text-foreground min-h-[120px] sm:min-h-[160px]"
                          />
                        </FormControl>
                        <FormMessage className="text-xs sm:text-sm" />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm sm:text-base py-2 sm:py-2.5">
                    Create & Get Link
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </BackgroundWrapper>
    </>
  );
};

export default CreatePromposal;