import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from 'date-fns';
import { Button } from '@/components/ui/button';
import { JournalEntry } from '@/types/supabase';
import { useIsMobile } from '@/hooks/use-mobile';
import { MOOD_OPTIONS } from '@/constants/journal'; // Import MOOD_OPTIONS
import { ChevronLeftIcon } from './icons/ChevronLeftIcon'; // Import custom icons
import { ChevronRightIcon } from './icons/ChevronRightIcon'; // Import custom icons
import { cn } from '@/lib/utils'; // Import cn for conditional classes

interface CalendarViewProps {
  entries: Record<string, JournalEntry>;
  onDayClick: (date: Date) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ entries, onDayClick }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const isMobile = useIsMobile();

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const firstDayOfMonth = startOfMonth(currentMonth).getDay(); // 0 for Sunday, 1 for Monday, etc.
  const emptyCellsBefore = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  return (
    <Card className="w-full shadow-lg bg-card/60 backdrop-blur-md border border-border/50 rounded-xl animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className={cn("flex items-center justify-between", isMobile ? 'text-base' : 'text-xl')}>
          <Button variant="ghost" size={isMobile ? 'sm' : 'icon'} onClick={handlePrevMonth} className="h-8 w-8 text-muted-foreground hover:bg-accent/20">
            <ChevronLeftIcon className={isMobile ? 'h-4 w-4' : 'h-5 w-5'} />
          </Button>
          <h2 className="flex-grow text-center font-bold text-foreground">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <Button variant="ghost" size={isMobile ? 'sm' : 'icon'} onClick={handleNextMonth} className="h-8 w-8 text-muted-foreground hover:bg-accent/20">
            <ChevronRightIcon className={isMobile ? 'h-4 w-4' : 'h-5 w-5'} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("p-3 sm:p-6")}>
        <div className="grid grid-cols-7 text-center font-semibold mb-2 text-muted-foreground">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className={isMobile ? 'text-xs' : 'text-sm'}>{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
          {emptyCellsBefore.map((_, index) => (
            <div key={`empty-${index}`} className="h-16 w-full sm:h-20"></div> // Adjusted height for empty cells
          ))}
          {daysInMonth.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const entry = entries[dateKey];
            const isCurrentDay = isToday(day);
            const isSelectedMonth = isSameMonth(day, currentMonth);
            const moodInfo = entry?.mood ? MOOD_OPTIONS[entry.mood as keyof typeof MOOD_OPTIONS] : null;

            return (
              <Button
                key={format(day, 'yyyy-MM-dd')}
                variant="ghost"
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-md p-0 h-16 w-full sm:h-20", // Adjusted height
                  isCurrentDay ? 'bg-primary/10 text-primary' : '',
                  !isSelectedMonth ? 'text-muted-foreground opacity-50' : 'text-foreground',
                  "hover:bg-accent/20 transition-colors duration-200"
                )}
                onClick={() => onDayClick(day)}
                size="sm" // Use sm size for consistency
              >
                <span className={cn("font-medium", isMobile ? 'text-xs' : 'text-sm')}>{format(day, 'd')}</span>
                {moodInfo && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={cn(
                      "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-2xl sm:text-3xl transform transition hover:scale-110",
                      moodInfo.color
                    )}>
                      {moodInfo.emoji}
                    </div>
                  </div>
                )}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarView;