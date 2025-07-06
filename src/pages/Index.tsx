import { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Mic, Image } from "lucide-react";
import { Helmet } from 'react-helmet-async'; // Import Helmet

const Index = () => {
  const typingPhrases = [
    "A single glance at your connection.",
    "See your relationship’s health in motion.",
    "Your daily moods, a colorful calendar.",
    "Insights show how your hearts answer.",
    "Send messages structured from the heart.",
    "A compliment, a cherished memory's art.",
    "Address a conflict with gentle care.",
    "Share how you feel, beyond compare.",
    "A secret garden for your thoughts.",
    "Your private journal connects the dots.",
    "A video love letter, perfectly timed.",
    "Your special Promposal for their mind.",
    "Watch shows together, synced in time.",
    "Share laughter with a chat sublime.",
    "Find your shared rhythm, a soundtrack.",
    "The Wave Room brings your moments back.",
    "Customize your profile, make it yours.",
    "A modern design that truly endures.",
    "A mutual choice for a fresh start.",
    "Nurturing your bond, a work of art.",
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
    <>
      <Helmet>
        <title>Anbae - Nurturing Your Relationship</title>
        <meta name="description" content="Anbae is a personalized app designed to help couples nurture their relationship through structured communication, shared experiences, and emotional insights." />
      </Helmet>
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4 relative">
        <div className="absolute top-4 right-4 z-10">
          {/* Removed ThemeToggle */}
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
    </>
  );
};

export default Index;