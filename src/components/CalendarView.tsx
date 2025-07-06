import React, { useState } from 'react';
import { JournalEntry } from '@/types/supabase'; // Assuming JournalEntry is in supabase types
import { MOOD_OPTIONS } from '@/constants/journal'; // Import from new constants file
import { ChevronLeftIcon } from '@/components/icons/ChevronLeftIcon'; // Corrected import path
import { ChevronRightIcon } from '@/components/icons/ChevronRightIcon'; // Corrected import path
import { format, isSameDay } from 'date-fns'; // Import format and isSameDay

interface CalendarViewProps {
  entries: Record<string, JournalEntry>;
  onDayClick: (date: Date) => void; // New prop for handling day clicks
}

const CalendarView: React.FC<CalendarViewProps> = ({ entries, onDayClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const changeMonth = (amount: number) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + amount);
      return newDate;
    });
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const calendarDays = [];
  
  // Fill leading empty days
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="border-r border-b border-border"></div>);
  }

  // Fill days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateId = format(date, 'yyyy-MM-dd'); // Format to YYYY-MM-DD
    const entry = entries[dateId];
    const moodInfo = entry?.mood ? MOOD_OPTIONS[entry.mood] : null;
    const isToday = isSameDay(date, new Date());

    calendarDays.push(
      <div 
        key={day} 
        className={`relative p-2 border-r border-b border-border h-24 flex flex-col items-start cursor-pointer transition-colors duration-200 hover:bg-accent/20 ${isToday ? 'bg-secondary/20' : ''}`}
        title={entry?.heading || `No entry for ${format(date, 'MMM d')}`}
        onClick={() => onDayClick(date)}
      >
        <span className="font-medium text-muted-foreground">{day}</span>
        {moodInfo && (
          <div className="absolute inset-0 flex items-center justify-center">
             <div className={`w-12 h-12 rounded-full flex items-center justify-center text-3xl ${moodInfo.color} transform transition hover:scale-110`}>
                {moodInfo.emoji}
             </div>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div className="bg-card/60 p-6 sm:p-8 rounded-xl shadow-md border border-border animate-fade-in backdrop-blur-md">
        <div className="flex justify-between items-center mb-6">
            <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-accent/20 transition-colors">
                <ChevronLeftIcon className="w-6 h-6 text-muted-foreground" />
            </button>
            <h2 className="text-xl font-bold text-foreground">
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-accent/20 transition-colors">
                <ChevronRightIcon className="w-6 h-6 text-muted-foreground" />
            </button>
        </div>

        <div className="grid grid-cols-7 text-center font-semibold text-muted-foreground border-t border-l border-border">
            {daysOfWeek.map(day => (
                <div key={day} className="py-3 border-r border-b border-border">{day}</div>
            ))}
            {calendarDays}
        </div>
    </div>
  );
};

export default CalendarView;