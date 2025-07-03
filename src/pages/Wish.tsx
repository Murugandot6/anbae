import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Gift } from 'lucide-react';
import BackgroundWrapper from '@/components/BackgroundWrapper';

const Wish = () => {
  return (
    <BackgroundWrapper>
      <div className="w-full max-w-2xl mx-auto p-4 md:p-8 mt-16 md:mt-8">
        <header className="flex justify-between items-center mb-6">
          <Link to="/dashboard">
            <Button variant="outline" size="icon" className="w-10 h-10 rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Wishlist</h1>
        </header>

        <Card className="bg-white/80 dark:bg-gray-800/80 shadow-lg backdrop-blur-sm border border-white/30 dark:border-gray-600/30">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Gift className="w-6 h-6 text-pink-500" />
              Make a Wish
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This is where you can add and view wishes for you and your partner. This feature is coming soon!
            </p>
          </CardContent>
        </Card>
      </div>
    </BackgroundWrapper>
  );
};

export default Wish;