import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import BackgroundWrapper from '@/components/BackgroundWrapper'; // Updated import
import { Button } from '@/components/ui/button'; // Import Button for consistent styling
import { ArrowLeft } from 'lucide-react'; // Import icon

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // Intentionally left blank to remove console error on 404s
  }, [location.pathname]);

  return (
    <BackgroundWrapper> {/* Updated component name */}
      <div className="w-full max-w-md bg-white/30 dark:bg-gray-800/30 p-8 rounded-xl shadow-lg backdrop-blur-sm border border-white/30 dark:border-gray-600/30 text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-6">Oops! Page not found</p>
        <a href="/">
          <Button variant="outline" className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">
            <ArrowLeft className="w-5 h-5 mr-2" /> Return to Home
          </Button>
        </a>
      </div>
    </BackgroundWrapper>
  );
};

export default NotFound;