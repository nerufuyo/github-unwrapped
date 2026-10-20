export interface RawDay {
  date: string; // YYYY-MM-DD, consecutive, ascending
  count: number;
}

export interface RawRepo {
  name: string; // owner/name
  commits: number;
  language: { name: string; color: string | null } | null;
}

export interface RawData {
  user: { login: string; name: string | null; avatarUrl: string };
  totals: { commits: number; prs: number; issues: number; reviews: number };
  days: RawDay[];
  repos: RawRepo[];
  commitHours: number[] | null; // 24 UTC buckets from a commit sample, null if unavailable
}

export interface Persona {
  id: string;
  title: string;
  blurb: string;
}

export interface Stats {
  login: string;
  name: string | null;
  avatarUrl: string;
  total: number;
  commits: number;
  prs: number;
  issues: number;
  reviews: number;
  activeDays: number;
  longestStreak: number;
  busiestWeekday: string | null;
  busiestHour: number | null; // 0-23 UTC
  topLanguages: { name: string; color: string | null; pct: number }[]; // max 5
  topRepo: { name: string; commits: number } | null;
  days: RawDay[];
}

export type Wrapped = Stats & { persona: Persona };
