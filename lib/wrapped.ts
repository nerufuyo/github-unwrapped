import { fetchRaw, NotFoundError } from './github';
import { pickPersona } from './persona';
import { computeStats } from './stats';
import type { Wrapped } from './types';

// GitHub login rules: alphanumeric or single hyphens, 1-39 chars. Guards the REST search query.
const LOGIN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export async function getWrapped(login: string): Promise<Wrapped> {
  if (!LOGIN.test(login)) throw new NotFoundError(`Invalid username "${login}"`);
  const stats = computeStats(await fetchRaw(login));
  return { ...stats, persona: pickPersona(stats) };
}
