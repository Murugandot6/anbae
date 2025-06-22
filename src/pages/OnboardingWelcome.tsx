import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ThemeToggle } from '@/components/ThemeToggle';
import BackgroundWrapper from '@/components/BackgroundWrapper';
import { Heart, MessageSquare, Inbox, Settings, HeartCrack, Sun, LayoutDashboard } from 'lucide-react';

const OnboardingWelcome: React.FC = () => {
  const features = [
    {
      title: "Your Personalized Hub",
      description: "Here you'll find your Lifetime Score, a gentle whisper of your communication health. See your and your partner's profiles, a glance at the souls intertwined, and a timeline of recent messages, the thoughts you've recently shared.",
      icon: <LayoutDashboard className="w-6 h-6 text-blue-500 dark:text-blue-400" />,
    },
    {
      title: "Speak from the Heart",
      description: "This is where your feelings take flight. Send Grievances to address conflicts openly, or shower your partner with Compliments to show appreciation. Relive cherished Good Memories, or simply express How I Feel in the moment.",
      icon: <MessageSquare className="w-6 h-6 text-green-500 dark:text-green-400" />,
    },
    {
      title: "Your Conversation Hub",
      description: "You'll find a flowing river of all your communications, keeping track of every conversation. You can easily reply to messages and mark them as read, ensuring you stay connected.",
      icon: <Inbox className="w-6 h-6 text-purple-500 dark:text-purple-400" />,
    },
    {
      title: "Craft Your Presence",
      description: "This section allows you to personalize your experience. Update your nickname, link to your partner's account by their email, give your partner a special nickname, and choose a unique avatar to represent you.",
      icon: <Settings className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />,
    },
    {
      title: "A Fresh Start",
      description: "Need a clean slate? This feature lets you send a request to your partner to clear your entire message history. This provides a fresh start, but remember, it requires mutual agreement.",
      icon: <HeartCrack className="w-6 h-6 text-red-500 dark:text-red-400" />,
    },
    {
      title: "Your View, Your Way",
      description: "With this toggle, you can switch between light and dark modes to suit your preference, making your app experience comfortable for your eyes, day or night.",
      icon: <Sun className="w-6 h-6 text-orange-500 dark:text-orange-400" />,
    },
  ];

  return (
    <BackgroundWrapper className="pt-0 md:pt-0">
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle />
        </div>
        <Card className="w-full max-w-2xl bg-white/30 dark:bg-gray-800/30 p-8 rounded-xl shadow-lg backdrop-blur-sm border border-white/30 dark:border-gray-600/30 text-center">
          <CardHeader className="mb-6">
            <Heart className="w-16 h-16 text-pink-600 dark:text-purple-400 mx-auto mb-4" />
            <CardTitle className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Welcome to Anbae!</CardTitle>
            <p className="text-lg text-gray-700 dark:text-gray-300">Discover how Anbae can help you nurture your relationship.</p>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-350px)] max-h-[500px] pr-4"> {/* Adjusted height for better fit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-white/50 dark:bg-gray-700/50 rounded-lg shadow-sm border border-white/40 dark:border-gray-600/40">
                    <div className="flex-shrink-0 mt-1">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">{feature.title}</h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="mt-8">
              <Link to="/dashboard">
                <Button className="w-full bg-pink-600 hover:bg-pink-700 text-white dark:bg-purple-600 dark:hover:bg-purple-700 text-lg py-3">
                  Continue to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </BackgroundWrapper>
  );
};

export default OnboardingWelcome;