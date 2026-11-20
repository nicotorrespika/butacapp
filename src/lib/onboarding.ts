import type { SearchResult } from './media';

export type OnboardingCategory = 'movie' | 'music' | 'book';
export type OnboardingChoices = Record<OnboardingCategory, SearchResult[]>;
export const INITIAL_CHOICE_COUNT = 3;
export const emptyChoices = (): OnboardingChoices => ({ movie: [], music: [], book: [] });
export const choiceKey = (r: SearchResult) => `${r.source}:${r.externalId}`;

export function toggleChoice(choices: SearchResult[], result: SearchResult): SearchResult[] {
  const key = choiceKey(result);
  if (choices.some(r => choiceKey(r) === key)) return choices.filter(r => choiceKey(r) !== key);
  return choices.length < INITIAL_CHOICE_COUNT ? [...choices, result] : choices;
}

export function stepComplete(choices: OnboardingChoices, category: OnboardingCategory): boolean {
  return choices[category].length === INITIAL_CHOICE_COUNT && choices[category].every(r => r.mediaType === category);
}

export function onboardingComplete(choices: OnboardingChoices): boolean {
  return (['movie', 'music', 'book'] as const).every(c => stepComplete(choices, c));
}

export function initialTopKind(r: SearchResult): 'movie' | 'artist' | 'album' | 'author' {
  return r.mediaType === 'movie' ? 'movie' : r.mediaType === 'book' ? 'author' : r.externalId.startsWith('artist:') ? 'artist' : 'album';
}

/** Invalid or stale browser drafts never count as completed selections. */
export function readOnboardingDraft(raw: string | null): OnboardingChoices {
  const out = emptyChoices();
  if (!raw) return out;
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== 'object') return out;
    for (const category of ['movie', 'music', 'book'] as const) {
      const list = (data as Record<string, unknown>)[category];
      if (!Array.isArray(list)) continue;
      for (const item of list) {
        if (item && typeof item === 'object' && item.mediaType === category && typeof item.title === 'string' && typeof item.source === 'string' && typeof item.externalId === 'string') {
          out[category] = toggleChoice(out[category], item as SearchResult);
        }
      }
    }
  } catch { /* A broken draft starts fresh, without touching saved tastes. */ }
  return out;
}