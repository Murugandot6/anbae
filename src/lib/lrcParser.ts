export interface LyricLine {
  time: number;
  text: string;
}

export const parseLRC = (lrcContent: string): LyricLine[] => {
  if (!lrcContent) {
    return [];
  }

  const lines = lrcContent.split('\n');
  const lyrics: LyricLine[] = [];

  // Matches [mm:ss.xx] or [mm:ss.xxx]
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

  for (const line of lines) {
    const match = line.match(timeRegex);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      // Pad milliseconds if they are 2 digits (e.g., .15 -> 150)
      const milliseconds = parseInt(match[3].padEnd(3, '0'), 10);
      const time = minutes * 60 + seconds + milliseconds / 1000;
      const text = line.replace(timeRegex, '').trim();
      
      // Only add lines with actual text
      if (text) {
        lyrics.push({ time, text });
      }
    }
  }

  // Sort by time, just in case the LRC file is not ordered
  return lyrics.sort((a, b) => a.time - b.time);
};