import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } => 'lucide-react';
import { Button } from '@/components/ui/button';
import { JournalEntry } from '@/types/supabase';
import { useIsMobile } from '@/hooks/use-mobile'; // Import useIsMobile

interface CalendarViewProps {
  entries: Record<string, JournalEntry>;
  onDayClick: (date: Date) => void;
}

const moodEmojis = {
  'Excellent': '😊',
  'Good': '🙂',
  'Neutral': '😐',
  'Bad': '🙁',
  'Terrible': '😞',
};

const CalendarView: React.FC<CalendarViewProps> = ({ entries, onDayClick }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const isMobile = useIsMobile(); // Use the hook

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
    <Card className="w-full shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className={`flex items-center justify-between ${isMobile ? 'text-base' : 'text-xl'}`}>
          <Button variant="ghost" size={isMobile ? 'sm' : 'icon'} onClick={handlePrevMonth} className="h-8 w-8">
            <ChevronLeft className={isMobile ? 'h-4 w-4' : 'h-5 w-5'} />
          </Button>
          <span className="flex-grow text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <Button variant="ghost" size={isMobile ? 'sm' : 'icon'} onClick={handleNextMonth} className="h-8 w-8">
            <ChevronRight className={isMobile ? 'h-4 w-4' : 'h-5 w-5'} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}> {/* Reduced padding */}
        <div className="grid grid-cols-7 text-center font-semibold mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className={isMobile ? 'text-xs' : 'text-sm'}>{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1"> {/* Reduced gap */}
          {emptyCellsBefore.map((_, index) => (
            // Adjust size if needed
            <div key={`empty-${index}`} className="h-7 w-7 sm:h-8 sm:w-8"></div>
          ))}
          {daysInMonth.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const entry = entries[dateKey];
            const isCurrentDay = isToday(day);
            const isSelectedMonth = isSameMonth(day, currentMonth);

            return (
              <Button
                key={format(day, 'yyyy-MM-dd')}
                variant="ghost"
                className={`relative flex flex-col items-center justify-center rounded-md p-0 h-7 w-7 sm:h-8 sm:w-8 ${isCurrentDay ? 'bg-primary/10 text-primary' : ''} ${!isSelectedMonth ? 'text-muted-foreground opacity-50' : ''}`}
                onClick={() => onDayClick(day)}
                size={isMobile ? 'sm' : 'default'} // Adjust button size
              >
                <span className={isMobile ? 'text-xs' : 'text-sm'}>{format(day, 'd')}</span> {/* Reduced font size */}
                {entry && (
                  <span className={`absolute bottom-0 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    {entry.emoji || moodEmojis[entry.mood as keyof typeof moodEmojis]}
                  </span>
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