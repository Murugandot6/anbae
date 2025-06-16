import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle"; // Import ThemeToggle

const Navbar = () => {
  return (
    <nav className="w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm fixed top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2 text-lg font-bold text-gray-900 dark:text-white">
          <Heart className="w-6 h-6 text-pink-600 dark:text-purple-400" />
          <span>Anbae</span>
        </Link>
        <div className="hidden md:flex space-x-6">
          <Link to="#features" className="text-gray-700 hover:text-pink-600 dark:text-gray-300 dark:hover:text-purple-400 transition-colors">
            Features
          </Link>
          <Link to="#about" className="text-gray-700 hover:text-pink-600 dark:text-gray-300 dark:hover:text-purple-400 transition-colors">
            About
          </Link>
          <Link to="#contact" className="text-gray-700 hover:text-pink-600 dark:text-gray-300 dark:hover:text-purple-400 transition-colors">
            Contact
          </Link>
        </div>
        <div className="flex items-center space-x-4"> {/* Added a flex container for button and toggle */}
          <Button className="bg-pink-600 hover:bg-pink-700 text-white dark:bg-purple-600 dark:hover:bg-purple-700 hidden md:block">
            Get Started
          </Button>
          <ThemeToggle /> {/* Add the ThemeToggle here */}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;