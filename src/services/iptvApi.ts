export interface TvChannel {
  id: string;
  name: string;
  logo: string;
  group: string;
  country: string;
  quality: string;
  url: string;
  labels: string[];
  needsHeaders: boolean;
}

export interface TvRow {
  id: string;
  title: string;
  channels: TvChannel[];
}

export interface TvSource {
  id: string;
  title: string;
  kind: 'categories' | 'countries';
  key: string;
}

const BASE = 'https://iptv-org.github.io/iptv';

export const TV_SOURCES: TvSource[] = [
  { id: 'india', title: 'India', kind: 'countries', key: 'in' },
  { id: 'news', title: 'News', kind: 'categories', key: 'news' },
  { id: 'movies', title: 'Movies', kind: 'categories', key: 'movies' },
  { id: 'music', title: 'Music', kind: 'categories', key: 'music' },
  { id: 'sports', title: 'Sports', kind: 'categories', key: 'sports' },
  { id: 'entertainment', title: 'Entertainment', kind: 'categories', key: 'entertainment' },
  { id: 'kids', title: 'Kids', kind: 'categories', key: 'kids' },
  { id: 'documentary', title: 'Documentary', kind: 'categories', key: 'documentary' },
  { id: 'series', title: 'Series', kind: 'categories', key: 'series' },
  { id: 'religious', title: 'Devotional', kind: 'categories', key: 'religious' },
  { id: 'travel', title: 'Travel', kind: 'categories', key: 'travel' },
  { id: 'cooking', title: 'Food', kind: 'categories', key: 'cooking' },
];

const ATTR_RE = /([\w-]+)="([^"]*)"/g;

function parseAttrs(line: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  let match: RegExpExecArray | null;
  ATTR_RE.lastIndex = 0;
  while ((match = ATTR_RE.exec(line)) !== null) {
    attrs[match[1]] = match[2];
  }
  return attrs;
}

export function parseM3U(text: string): TvChannel[] {
  const lines = text.split(/\r?\n/);
  const channels: TvChannel[] = [];
  let pending: Omit<TvChannel, 'url'> | null = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF')) {
      const attrs = parseAttrs(line);
      const commaIndex = line.lastIndexOf(',');
      const rawName = commaIndex >= 0 ? line.slice(commaIndex + 1).trim() : '';
      const labels = (rawName.match(/\[[^\]]+\]/g) || []).map((value) => value.slice(1, -1));
      const cleanName = rawName.replace(/\s*\[[^\]]+\]/g, '').trim();
      const id = attrs['tvg-id'] || cleanName;
      const country = (id.match(/\.([a-z]{2})(?:@|$)/i)?.[1] || '').toUpperCase();
      pending = {
        id,
        name: cleanName || id,
        logo: attrs['tvg-logo'] || '',
        group: attrs['group-title'] || '',
        country,
        quality: cleanName.match(/\((\d{3,4}p)\)/)?.[1] || '',
        labels,
        needsHeaders: 'http-referrer' in attrs || 'http-user-agent' in attrs,
      };
      continue;
    }

    if (line.startsWith('#')) {
      if (pending && /^#EXTVLCOPT:http-(referrer|user-agent)/i.test(line)) {
        pending.needsHeaders = true;
      }
      continue;
    }

    if (pending) {
      if (/^https?:\/\//i.test(line)) {
        channels.push({ ...pending, url: line });
      }
      pending = null;
    }
  }

  return channels;
}

export function rowUrl(source: TvSource): string {
  return source.kind === 'countries'
    ? `${BASE}/countries/${source.key}.m3u`
    : `${BASE}/categories/${source.key}.m3u`;
}

export async function fetchTvRow(source: TvSource): Promise<TvRow> {
  const response = await fetch(rowUrl(source));
  if (!response.ok) throw new Error(`Failed to load ${source.title} (HTTP ${response.status})`);
  const text = await response.text();
  const seen = new Set<string>();
  const channels = parseM3U(text).filter((channel) => {
    if (channel.labels.includes('XXX')) return false;
    if (channel.labels.includes('Geo-blocked')) return false;
    if (channel.needsHeaders) return false;
    if (!/\.m3u8($|[?#])/i.test(channel.url)) return false;
    if (seen.has(channel.url)) return false;
    seen.add(channel.url);
    return true;
  });
  return { id: source.id, title: source.title, channels };
}

export function tamilChannels(channels: TvChannel[]): TvChannel[] {
  return channels.filter((channel) =>
    /tamil|kalaignar|sun tv|sun music|sun news|vijay|jaya|ktv|raj tv|vasanth|puthiya|vasan|sirippoli|chithiram|adithya|polimer|thanthi/i.test(
      `${channel.name} ${channel.id}`,
    ),
  );
}
