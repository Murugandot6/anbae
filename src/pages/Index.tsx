import { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Mic, Image } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const Index = () => {
  const typingPhrases = [
    "Discover how couples can use our website to resolve conflicts.",
    "Discover how couples can use our website to share compliments.",
    "Discover how couples can use our website to cherish good memories.",
    "Discover how couples can use our website to express feelings.",
  ];

  const [placeholderText, setPlaceholderText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const typingSpeed = 100;
  const deletingSpeed = 50;
  const pauseTime = 1500;

  useEffect(() => {
    const currentPhrase = typingPhrases[phraseIndex];
    let timer: NodeJS.Timeout;

    if (isDeleting) {
      if (charIndex > 0) {
        timer = setTimeout(() => {
          setPlaceholderText(currentPhrase.substring(0, charIndex - 1));
          setCharIndex(prev => prev - 1);
        }, deletingSpeed);
      } else {
        setIsDeleting(false);
        setPhraseIndex(prev => (prev + 1) % typingPhrases.length);
      }
    } else {
      if (charIndex < currentPhrase.length) {
        timer = setTimeout(() => {
          setPlaceholderText(currentPhrase.substring(0, charIndex + 1));
          setCharIndex(prev => prev + 1);
        }, typingSpeed);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, pauseTime);
      }
    }

    return () => clearTimeout(timer);
  }, [placeholderText, charIndex, isDeleting, phraseIndex, typingPhrases, typingSpeed, deletingSpeed, pauseTime]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4 relative">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <div className="text-center mb-8 animate-fade-in">
        <h1 className="text-5xl md:text-7xl font-extrabold mb-4 leading-none">
          <span className="text-blue-600">a</span>
          <span className="text-red-600">n</span>
          <span className="text-yellow-600">b</span>
          <span className="text-blue-600">a</span>
          <span className="text-green-600">e</span>
        </h1>
      </div>

      <div className="w-full max-w-xl mb-6 px-4 animate-fade-in delay-200">
        <div className="relative flex items-center">
          <Search className="absolute left-3 text-muted-foreground w-5 h-5" />
          <Input
            type="text"
            placeholder={placeholderText}
            className="w-full pl-10 pr-20 py-3 text-lg rounded-full shadow-md transition-all duration-300 h-auto"
          />
          <div className="absolute right-3 flex space-x-2">
            <Mic className="text-muted-foreground w-5 h-5 cursor-pointer hover:text-foreground" />
            <Image className="text-muted-foreground w-5 h-5 cursor-pointer hover:text-foreground" />
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-8 animate-fade-in delay-400">
        <Link to="/login">
          <Button className="w-full sm:w-auto shadow-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
            Login
          </Button>
        </Link>
        <Link to="/register">
          <Button className="w-full sm:w-auto shadow-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
            Register
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Index;