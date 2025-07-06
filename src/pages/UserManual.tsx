import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Heart, MessageSquare, BookText, Sparkles, Film, Radio, Settings, Trash2, Sun, Moon } from 'lucide-react';
import BackgroundWrapper from '@/components/BackgroundWrapper';
import { Helmet } from 'react-helmet-async'; // Import Helmet

const UserManual: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>User Manual - Anbae</title>
        <meta name="description" content="Comprehensive user manual for Anbae, detailing all features and how to use them to improve your relationship." />
      </Helmet>
      <BackgroundWrapper className="pt-0 md:pt-0">
        <div className="w-full max-w-3xl mx-auto p-4 md:p-8 mt-16 md:mt-8">
          <header className="flex items-center mb-6">
            {/* Replaced Link with Button for consistent styling and positioning */}
            <div className="absolute top-4 left-4 z-10">
              <Link to="/dashboard">
                <Button variant="outline" size="icon" className="w-10 h-10 rounded-full mr-4 text-foreground border-border hover:bg-accent hover:text-accent-foreground shadow-md">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-foreground mx-auto">Anbae User Manual</h1>
          </header>

          <div className="space-y-8">
            <Card className="bg-card/60 dark:bg-card/60 shadow-lg backdrop-blur-md border border-border/50 rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl font-bold text-foreground">
                  <Heart className="w-6 h-6 text-primary" /> Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-2">Your personalized hub for relationship health.</p>
                <ul className="list-disc list-inside space-y-1 text-foreground">
                  <li>**Lifetime Score:** A visual indicator of your communication health with your partner.</li>
                  <li>**Profiles:** See your and your partner's avatars, nicknames, and lifetime scores.</li>
                  <li>**Recent Messages:** A timeline of your most recent communications.</li>
                  <li>**Mood Calendar:** Track your daily moods and journal entries.</li>
                  <li>**Communication Insights:** Charts showing your message types and mood distribution.</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-card/60 dark:bg-card/60 shadow-lg backdrop-blur-md border border-border/50 rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl font-bold text-foreground">
                  <MessageSquare className="w-6 h-6 text-primary" /> Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-2">Communicate openly and effectively with your partner.</p>
                <ul className="list-disc list-inside space-y-1 text-foreground">
                  <li>**Send Message:** Choose from message types like Grievance, Compliment, Good Memory, or How I Feel. Set priority and your mood.</li>
                  <li>**Inbox/Outbox:** View all your received and sent messages.</li>
                  <li>**View Message:** Tap on any message to see its full content and engage in a threaded conversation by replying.</li>
                  <li>**Mark as Read:** Received messages are automatically marked as read when viewed.</li>
                  <li>**Close Conversation:** Senders can close a message thread, preventing further replies.</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-card/60 dark:bg-card/60 shadow-lg backdrop-blur-md border border-border/50 rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl font-bold text-foreground">
                  <BookText className="w-6 h-6 text-primary" /> Journal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-2">Reflect on your day and track your emotional journey.</p>
                <ul className="list-disc list-inside space-y-1 text-foreground">
                  <li>**Create Entry:** Write down your thoughts, give your day a title, select an emoji, and choose your mood.</li>
                  <li>**Mood Calendar Integration:** Journal entries are linked to the Mood Calendar on your Dashboard, allowing you to see your emotional patterns over time.</li>
                  <li>**View Past Entries:** Click on a date in the Mood Calendar to view or add entries for that specific day.</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-card/60 dark:bg-card/60 shadow-lg backdrop-blur-md border border-border/50 rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl font-bold text-foreground">
                  <Sparkles className="w-6 h-6 text-primary" /> Promposal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-2">Create a special video message with synchronized lyrics.</p>
                <ul className="list-disc list-inside space-y-1 text-foreground">
                  <li>**Create:** Upload a video URL (e.g., YouTube) and provide lyrics in LRC format.</li>
                  <li>**Share:** Get a unique link to share your personalized promposal with your partner.</li>
                  <li>**Experience:** The video plays with lyrics appearing in sync, creating a unique and heartfelt message.</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-card/60 dark:bg-card/60 shadow-lg backdrop-blur-md border border-border/50 rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl font-bold text-foreground">
                  <Film className="w-6 h-6 text-primary" /> Watch Party
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-2">Watch videos together in real-time with synchronized playback and live chat.</p>
                <ul className="list-disc list-inside space-y-1 text-foreground">
                  <li>**Create Room:** Start a new private watch party and get a shareable code.</li>
                  <li>**Join Room:** Enter a friend's room code to join their party.</li>
                  <li>**Synchronized Playback:** Everyone in the room sees the video at the same time.</li>
                  <li>**Live Chat:** Communicate with other participants in real-time.</li>
                  <li>**Video History:** See a list of previously played videos in the room.</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-card/60 dark:bg-card/60 shadow-lg backdrop-blur-md border border-border/50 rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl font-bold text-foreground">
                  <Radio className="w-6 h-6 text-primary" /> Wave Room
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-2">Listen to internet radio stations together in real-time.</p>
                <ul className="list-disc list-inside space-y-1 text-foreground">
                  <li>**Create Room:** Start a new radio listening session and get a shareable code.</li>
                  <li>**Join Room:** Enter a friend's room code to join their listening party.</li>
                  <li>**Browse Stations:** Search and filter thousands of internet radio stations by name, language, country, or tag.</li>
                  <li>**Synchronized Playback:** Everyone in the room hears the same station at the same time.</li>
                  <li>**Real-time Control:** Play, pause, and change stations, with updates reflected for all participants.</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-card/60 dark:bg-card/60 shadow-lg backdrop-blur-md border border-border/50 rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl font-bold text-foreground">
                  <Settings className="w-6 h-6 text-primary" /> Edit Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-2">Personalize your Anbae experience.</p>
                <ul className="list-disc list-inside space-y-1 text-foreground">
                  <li>**Nickname:** Change your display name.</li>
                  <li>**Partner's Email:** Link to your partner's Anbae account.</li>
                  <li>**Partner's Nickname:** Set a special nickname for your partner.</li>
                  <li>**Avatar:** Choose a unique avatar from a selection of images.</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-card/60 dark:bg-card/60 shadow-lg backdrop-blur-md border border-border/50 rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl font-bold text-foreground">
                  <Trash2 className="w-6 h-6 text-destructive" /> Clear All Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-2">Initiate a fresh start for your message history.</p>
                <ul className="list-disc list-inside space-y-1 text-foreground">
                  <li>**Send Request:** Send a request to your partner to clear all messages between you two.</li>
                  <li>**Mutual Agreement:** This action requires your partner's acceptance.</li>
                  <li>**Irreversible:** Once accepted and confirmed, all messages will be permanently deleted.</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-card/60 dark:bg-card/60 shadow-lg backdrop-blur-md border border-border/50 rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl font-bold text-foreground">
                  <Sun className="w-6 h-6 text-primary" /> / <Moon className="w-6 h-6 text-muted-foreground" /> Theme Toggle
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Switch between light and dark modes to suit your visual preference, day or night.</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            {/* Replaced Link with Button for consistent styling and positioning */}
            <div className="absolute top-4 left-4 z-10">
              <Link to="/dashboard">
                <Button variant="outline" size="icon" className="w-10 h-10 rounded-full text-foreground border-border hover:bg-accent hover:text-accent-foreground shadow-md">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </BackgroundWrapper>
    </>
  );
};

export default UserManual;