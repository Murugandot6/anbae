// src/constants/journal.ts

export const MOOD_OPTIONS: Record<string, { emoji: string; color: string; }> = {
  'Loved': { emoji: '😍', color: 'bg-pink-200 text-pink-800 dark:bg-pink-800 dark:text-pink-200' },
  'Happy': { emoji: '😊', color: 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200' },
  'Neutral': { emoji: '😐', color: 'bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
  'Sad': { emoji: '😟', color: 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200' },
  'Crying': { emoji: '😭', color: 'bg-indigo-200 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-200' },
  // Add more moods if needed, ensure they have a corresponding emoji and color
};