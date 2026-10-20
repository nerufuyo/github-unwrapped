import type { RawData } from './types';

export class NotFoundError extends Error {}
export class RateLimitError extends Error {}

export const YEAR_START = '2026-01-01T00:00:00Z';
const REVALIDATE = 3600;

const QUERY = `
query($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    login name avatarUrl
    contributionsCollection(from: $from, to: $to) {
      totalCommitContributions
      totalPullRequestContributions
      totalIssueContributions
      totalPullRequestReviewContributions
      contributionCalendar { weeks { contributionDays { date contributionCount } } }
      commitContributionsByRepository(maxRepositories: 100) {
        repository { nameWithOwner primaryLanguage { name color } }
        contributions(first: 1) { totalCount }
      }
    }
  }
}`;

function headers() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is not set');
  return { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' };
}

function checkRate(res: Response) {
  if (res.status === 429 || (res.status === 403 && res.headers.get('x-ratelimit-remaining') === '0')) {
    throw new RateLimitError('GitHub rate limit reached');
  }
}

// Commit timestamps are not in GraphQL; sample up to 300 recent commits via REST search (UTC hours).
async function fetchCommitHours(login: string): Promise<number[] | null> {
  try {
    const hours = Array<number>(24).fill(0);
    for (let page = 1; page <= 3; page++) {
      const q = encodeURIComponent(`author:${login} author-date:>=2026-01-01`);
      const res = await fetch(
        `https://api.github.com/search/commits?q=${q}&sort=author-date&order=desc&per_page=100&page=${page}`,
        { headers: headers(), next: { revalidate: REVALIDATE } },
      );
      if (!res.ok) return null;
      const json = (await res.json()) as { items: { commit: { author: { date: string } } }[] };
      for (const it of json.items) hours[new Date(it.commit.author.date).getUTCHours()]++;
      if (json.items.length < 100) break;
    }
    return hours;
  } catch {
    return null;
  }
}

export async function fetchRaw(login: string): Promise<RawData> {
  const hourStep = 3600_000;
  const to = new Date(Math.floor(Date.now() / hourStep) * hourStep).toISOString(); // stable per hour => cacheable
  const [res, commitHours] = await Promise.all([
    fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: QUERY, variables: { login, from: YEAR_START, to } }),
      next: { revalidate: REVALIDATE },
    }),
    fetchCommitHours(login),
  ]);
  checkRate(res);
  if (!res.ok) throw new Error(`GitHub GraphQL ${res.status}`);

  const json = await res.json();
  if (json.errors?.some((e: { type?: string }) => e.type === 'RATE_LIMITED')) throw new RateLimitError('GitHub rate limit reached');
  const u = json.data?.user;
  if (!u) throw new NotFoundError(`No GitHub user "${login}"`);

  const c = u.contributionsCollection;
  const days = c.contributionCalendar.weeks
    .flatMap((w: { contributionDays: { date: string; contributionCount: number }[] }) => w.contributionDays)
    .map((d: { date: string; contributionCount: number }) => ({ date: d.date, count: d.contributionCount }))
    .filter((d: { date: string }) => d.date >= YEAR_START.slice(0, 10));

  return {
    user: { login: u.login, name: u.name, avatarUrl: u.avatarUrl },
    totals: {
      commits: c.totalCommitContributions,
      prs: c.totalPullRequestContributions,
      issues: c.totalIssueContributions,
      reviews: c.totalPullRequestReviewContributions,
    },
    days,
    repos: c.commitContributionsByRepository.map(
      (r: { repository: { nameWithOwner: string; primaryLanguage: { name: string; color: string | null } | null }; contributions: { totalCount: number } }) => ({
        name: r.repository.nameWithOwner,
        commits: r.contributions.totalCount,
        language: r.repository.primaryLanguage,
      }),
    ),
    commitHours,
  };
}

export function httpStatus(e: unknown): number {
  if (e instanceof NotFoundError) return 404;
  if (e instanceof RateLimitError) return 429;
  return 500;
}
