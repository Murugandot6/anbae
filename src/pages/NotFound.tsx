import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import BackgroundWrapper from '@/components/BackgroundWrapper';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async'; // Import Helmet

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // Intentionally left blank to remove console error on 404s
  }, [location.pathname]);

  return (
    <>
      <Helmet>
        <title>404 Not Found - Anbae</title>
        <meta name="description" content="The page you are looking for does not exist." />
      </Helmet>
      <BackgroundWrapper className="pt-0 md:pt-0">
        <div className="w-full max-w-md bg-card/60 dark:bg-card/60 p-8 rounded-xl shadow-lg backdrop-blur-md border border-border/50 text-center mt-16 md:mt-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">404</h1>
          <p className="text-xl text-muted-foreground mb-6">Oops! Page not found</p>
          {/* Ensure positioning is absolute for top-left corner */}
          <div className="absolute top-4 left-4 z-10">
            <a href="/">
              <Button variant="outline" className="w-10 h-10 text-foreground border-border hover:bg-accent hover:text-accent-foreground rounded-full shadow-md" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </a>
          </div>
        </div>
      </BackgroundWrapper>
    </>
  );
};

export default NotFound;