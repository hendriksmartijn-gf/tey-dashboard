// Shared mapping from a GA4 session source string to one of our paid channels.
// Kept in one place so the Ads tab, Sollicitaties tab and any cost-per-application
// calculation classify traffic identically.

export type Channel = 'linkedin' | 'meta' | 'google' | 'other';

export function sourceToChannel(source: string): Channel {
  const s = source.toLowerCase();
  if (s.includes('linkedin') || s.includes('lnkd'))                                 return 'linkedin';
  if (s.includes('facebook') || s.includes('instagram') || s.includes('fb') ||
      s.includes('meta')     || s === 'ig')                                          return 'meta';
  if (s.includes('google')   || s.includes('goog'))                                  return 'google';
  return 'other';
}

export const CHANNEL_COLOR: Record<Channel, string> = {
  linkedin: '#0077B5',
  meta:     '#1877F2',
  google:   '#F59E0B',
  other:    '#8C9BAF',
};

export const CHANNEL_LABEL: Record<Channel, string> = {
  linkedin: 'LinkedIn',
  meta:     'Meta',
  google:   'Google Ads',
  other:    'Overig / organisch',
};
