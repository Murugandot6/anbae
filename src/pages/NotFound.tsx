import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import BackgroundWrapper from '@/components/BackgroundWrapper';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // Intentionally left blank to remove console error on 404s
  }, [location.pathname]);

  return (
    <BackgroundWrapper>
      <div className="w-full max-w-md bg-card/60 dark:bg-card/60 p-8 rounded-xl shadow-lg backdrop-blur-md border border-border/50 text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-6">Oops! Page not found</p>
        <a href="/">
          <Button variant="outline" className="text-foreground border-border hover:bg-accent hover:text-accent-foreground">
            <ArrowLeft className="w-5 h-5 mr-2" /> Return to Home
          </Button>
        </a>
      </div>
    </BackgroundWrapper>
  );
};

export default NotFound;