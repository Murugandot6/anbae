import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Heart, MessageSquare, BookText, Sparkles, Film, Radio, Settings, Trash2, Sun, Moon, Lock, Info, UserPlus } from 'lucide-react';
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
        <div className="w-full max-w-xl sm:max-w-3xl mx-auto p-4 md:p-8 mt-16 md:mt-8"> {/* Adjusted max-width and padding */}
          <header className="flex items-center mb-6">
            {/* Replaced Link with Button for consistent styling and positioning */}
            <div className="absolute top-3 left-3 z-10">
              <Link to="/dashboard">
                <Button variant="outline" size="icon" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full mr-4 text-foreground border-border hover:bg-accent hover:text-accent-foreground shadow-md">
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mx-auto">Anbae User Manual</h1> {/* Adjusted font size */}
          </header>

          <div className="space-y-6 sm:space-y-8"> {/* Adjusted gap */}
            <Card className="bg-card/60 dark:bg-card/60 shadow-lg backdrop-blur-md border border-border/50 rounded-xl p-3 sm:p-4"> {/* Adjusted padding */}
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-foreground"> {/* Adjusted font size */}
                  <Info className="w-5 h-5 sm:w-6 h-6 text-primary" /> Onboarding Welcome
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm sm:text-base"> {/* Adjusted font size */}
                <p className="text-muted-foreground mb-2">Your first guided tour of Anbae's core features.</p>
                <ul className="list-disc list-inside space-y-1 text-foreground">
                  <li>**Interactive Slides:** A brief, animated introduction to the app's main functionalities.</li>
                  <li>**Key Highlights:** Learn about the Dashboard, Messages, Journal, Promposal, Theater, Concert, and Profile settings.</li>
                  <li>**Quick Start:** Get a clear overview before diving into the app.</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-card/60 dark:bg-card/60 shadow-lg backdrop-blur-md border border-border/50 rounded-xl p-3 sm:p-4">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-foreground">
                  <UserPlus className="w-5 h-5 sm:w-6 h-6 text-primary" /> Login & Register
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm sm:text-base">
                <p className="text-muted-foreground mb-2">Securely access and manage your Anbae account.</p>
                <ul className="list-disc list-inside space-y-1 text-foreground">
                  <li>**Register:** Create a new account using your email, a secure password, your nickname, and your partner's email to link your profiles.</li>
                  <li>**Login:** Sign in with your registered email and password.</li>
                  <li>**Partner Linking:** Ensure your partner registers with the exact email you provide to enable full app functionality.</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-card/60 dark:bg-card/60 shadow-lg backdrop-blur-md border border-border/50 rounded-xl p-3 sm:p-4">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-foreground">
                  <Lock className="w-5 h-5 sm:w-6 h-6 text-primary" /> Forgot Password
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm sm:text-base">
                <p className="text-muted-foreground mb-2">Regain access to your account if you forget your password.</p>
                <ul className="list-disc list-inside space-y-1 text-foreground">
                  <li>**Reset Link:** Enter your registered email address to receive a password reset link.</li>
                  <li>**Email Confirmation:** Follow the instructions in the email to set a new password securely.</li>
                </ul>
              </CardContent> {/* Corrected closing tag here */}
            </Card>

            <Card className="bg-card/60 dark:bg-card/60 shadow-lg backdrop-blur-md border border-border/50 rounded-xl p-3 sm:p-4"> {/* Adjusted padding */}
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-foreground"> {/* Adjusted font size */}
                  <Heart className="w-5 h-5 sm:w-6 h-6 text-primary" /> Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm sm:text-base"> {/* Adjusted font size */}
                <p className="text-muted-foreground mb-2">Your personalized hub for relationship health.</p>
                <ul className="list-disc list-inside space-y-1 text-foreground">
                  <li>**Lifetime Score:** A visual indicator (0-100) of your communication health with your partner, influenced by message types and moods.</li>
                  <li>**Profiles:** See your and your partner's avatars, nicknames, and lifetime scores at a glance.</li>
                  <li>**Recent Messages:** A timeline of your most recent communications, allowing quick access to conversations.</li>
                  <li>**Mood Calendar:** Track your daily moods and journal entries, visualizing emotional patterns over time.</li>
                  <li>**Communication Insights:** Interactive charts showing the distribution of your sent/received message types and overall moods.</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-card/60 dark:bg-card/60 shadow-lg backdrop-blur-md border border-border/50 rounded-xl p-3 sm:p-4">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-foreground">
                  <MessageSquare className="w-5 h-5 sm:w-6 h-6 text-primary" /> Messages
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm sm:text-base">
                <p className="text-muted-foreground mb-2">Communicate openly and effectively with your partner.</p>
                <ul className="list-disc list-inside space-y-1 text-foreground">
                  <li>**Express Button:** Quickly send a new message from the Messages page.</li>
                  <li>**Message Types:** Choose from 'Grievance' (to address conflicts), 'Compliment' (to show appreciation), 'Good Memory' (to relive cherished moments), or 'How I Feel' (to express current emotions).</li>
                  <li>**Priority & Mood:** Assign a priority level and select your current mood when sending a message.</li>
                  <li>**Inbox/Outbox:** View all your received and sent top-level messages in separate tabs.</li>
                  <li>**View Message:** Tap on any message to see its full content and engage in a threaded conversation by replying.</li>
                  <li>**Mark as Read:** Received messages are automatically marked as read when viewed.</li>
                  <li>**Close Conversation:** Senders can close a message thread, preventing further replies and indicating resolution.</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-card/60 dark:bg-card/60 shadow-lg backdrop-blur-md border border-border/50 rounded-xl p-3 sm:p-4">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-foreground">
                  <BookText className="w-5 h-5 sm:w-6 h-6 text-primary" /> Journal
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm sm:text-base">
                <p className="text-muted-foreground mb-2">Reflect on your day and track your emotional journey.</p>
                <ul className="list-disc list-inside space-y-1 text-foreground">
                  <li>**Create Entry:** Write down your thoughts, give your day a title, select an emoji, and choose your mood for any given day.</li>
                  <li>**Mood Calendar Integration:** Journal entries are linked to the Mood Calendar on your Dashboard, allowing you to see your emotional patterns over time.</li>
                  <li>**View Past Entries:** Click on a date in the Mood Calendar to view or add entries for that specific day. You can also view all past entries in a chronological list.</li>
                  <li>**Edit & Delete:** Easily modify or remove your journal entries.</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-card/60 dark:bg-card/60 shadow-lg backdrop-blur-md border border-border/50 rounded-xl p-3 sm:p-4">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-foreground">
                  <Sparkles className="w-5 h-5 sm:w-6 h-6 text-primary" /> Promposal
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm sm:text-base">
                <p className="text-muted-foreground mb-2">Create a special video message with synchronized lyrics.</p>
                <ul className="list-disc list-inside space-y-1 text-foreground">
                  <li>**Create:** Upload a video URL (e.g., YouTube) and provide lyrics in LRC format. The LRC format allows you to synchronize text with specific timestamps in the video.</li>
                  <li>**Share:** Get a unique, shareable link to send your personalized promposal to your partner.</li>
                  <li>**Experience:** The video plays with lyrics appearing in sync, creating a unique and heartfelt message.</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-card/60 dark:bg-card/60 shadow-lg backdrop-blur-md border border-border/50 rounded-xl p-3 sm:p-4">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-foreground">
                  <Film className="w-5 h-5 sm:w-6 h-6 text-primary" /> Theater
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm sm:text-base">
                <p className="text-muted-foreground mb-2">Watch videos together in real-time with synchronized playback and live chat.</p>
                <ul className="list-disc list-inside space-y-1 text-foreground">
                  <li>**Create Room:** Start a new private watch party and get a shareable code.</li>
                  <li>**Join Room:** Enter a friend's room code to join their party.</li>
                  <li>**Synchronized Playback:** Everyone in the room sees the video at the same time, with controls (play, pause, seek) synced across all participants.</li>
                  <li>**Live Chat:** Communicate with other participants in real-time via text messages.</li>
                  <li>**Video Reactions:** Send animated emoji reactions that appear on the video screen for everyone to see.</li>
                  <li>**Video History:** See a list of previously played videos in the room and easily re-select them.</li>
                  <li>**Fullscreen Mode:** Enjoy an immersive viewing experience.</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-card/60 dark:bg-card/60 shadow-lg backdrop-blur-md border border-border/50 rounded-xl p-3 sm:p-4">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-foreground">
                  <Radio className="w-5 h-5 sm:w-6 h-6 text-primary" /> Concert
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm sm:text-base">
                <p className="text-muted-foreground mb-2">Listen to internet radio stations together in real-time.</p>
                <ul className="list-disc list-inside space-y-1 text-foreground">
                  <li>**Create Room:** Start a new radio listening session and get a shareable code.</li>
                  <li>**Join Room:** Enter a friend's room code to join their listening party.</li>
                  <li>**Browse Stations:** Search and filter thousands of internet radio stations by name, language, country, or tag.</li>
                  <li>**Synchronized Playback:** Everyone in the room hears the same station at the same time.</li>
                  <li>**Real-time Control:** Play, pause, and change stations, with updates reflected for all participants.</li>
                  <li>**Global Player:** Continue listening to your station in a mini-player even when navigating to other parts of the app.</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-card/60 dark:bg-card/60 shadow-lg backdrop-blur-md border border-border/50 rounded-xl p-3 sm:p-4">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-foreground">
                  <Settings className="w-5 h-5 sm:w-6 h-6 text-primary" /> Edit Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm sm:text-base">
                <p className="text-muted-foreground mb-2">Personalize your Anbae experience.</p>
                <ul className="list-disc list-inside space-y-1 text-foreground">
                  <li>**Nickname:** Change your display name within the app.</li>
                  <li>**Partner's Email:** Link to your partner's Anbae account by entering their registered email.</li>
                  <li>**Partner's Nickname:** Set a special nickname for your partner that will appear throughout the app.</li>
                  <li>**Avatar:** Choose a unique avatar from a selection of images to represent you.</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-card/60 dark:bg-card/60 shadow-lg backdrop-blur-md border border-border/50 rounded-xl p-3 sm:p-4">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-foreground">
                  <Trash2 className="w-5 h-5 sm:w-6 h-6 text-destructive" /> Clear All Messages
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm sm:text-base">
                <p className="text-muted-foreground mb-2">Initiate a fresh start for your message history.</p>
                <ul className="list-disc list-inside space-y-1 text-foreground">
                  <li>**Send Request:** Send a request to your partner to clear all messages between you two.</li>
                  <li>**Mutual Agreement:** This action requires your partner's explicit acceptance to proceed.</li>
                  <li>**Irreversible:** Once accepted and confirmed, all messages will be permanently deleted and cannot be recovered.</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-card/60 dark:bg-card/60 shadow-lg backdrop-blur-md border border-border/50 rounded-xl p-3 sm:p-4">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-foreground">
                  <Sun className="w-5 h-5 sm:w-6 h-6 text-primary" /> / <Moon className="w-5 h-5 sm:w-6 h-6 text-muted-foreground" /> Theme Toggle
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm sm:text-base">
                <p className="text-muted-foreground">Switch between light and dark modes to suit your visual preference, day or night. You can also set it to 'System' to automatically match your device's theme settings.</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 sm:mt-8 text-center">
            {/* Replaced Link with Button for consistent styling and positioning */}
            <div className="absolute top-3 left-3 z-10">
              <Link to="/dashboard">
                <Button variant="outline" size="icon" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full text-foreground border-border hover:bg-accent hover:text-accent-foreground shadow-md">
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
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