import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageSquare, BookText, Film, Radio } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const QuickActions: React.FC = () => {
  const actions = [
    { to: "/send-message", icon: MessageSquare, label: "Send Message" },
    { to: "/journal", icon: BookText, label: "Journal" },
    { to: "/theater", icon: Film, label: "Theater" },
    { to: "/concert", icon: Radio, label: "Concert" },
  ];

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-40">
      {actions.map((action) => (
        <Tooltip key={action.to}>
          <TooltipTrigger asChild>
            <Link to={action.to}>
              <Button
                variant="outline"
                size="icon"
                className="w-12 h-12 rounded-full shadow-lg bg-card/80 backdrop-blur-md border border-border/50 text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 hover:scale-105"
                aria-label={action.label}
              >
                <action.icon className="w-6 h-6" />
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-card text-foreground border border-border/50 shadow-md">
            <p>{action.label}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
};

export default QuickActions;