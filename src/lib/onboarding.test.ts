import { describe, expect, it } from 'vitest';
import { emptyChoices, initialTopKind, onboardingComplete, readOnboardingDraft, stepComplete, toggleChoice } from './onboarding';
import type { SearchResult } from './media';

const result = (mediaType: 'movie' | 'music' | 'book', id: number): SearchResult => ({ source: 'catalog', externalId: String(id), mediaType, title: `Work ${id}`, creator: null, year: null, imageUrl: null, kindLabel: '', externalUrl: null });
describe('initial three-by-three choices', () => {
  it('requires exactly three movies', () => {
    const choices = emptyChoices();
    choices.movie = [result('movie', 1), result('movie', 2)];
    expect(stepComplete(choices, 'movie')).toBe(false);
    choices.movie.push(result('movie', 3));
    expect(stepComplete(choices, 'movie')).toBe(true);
    expect(toggleChoice(choices.movie, result('movie', 4))).toHaveLength(3);
  });
  it('accepts three artists or albums in music', () => {
    const choices = emptyChoices();
    choices.music = [{ ...result('music', 1), externalId: 'artist:1' }, { ...result('music', 2), externalId: 'album:2' }];
    expect(stepComplete(choices, 'music')).toBe(false);
    choices.music.push({ ...result('music', 3), externalId: 'artist:3' });
    expect(stepComplete(choices, 'music')).toBe(true);
    expect(initialTopKind({ ...result('music', 1), externalId: 'artist:1' })).toBe('artist');
    expect(initialTopKind({ ...result('music', 2), externalId: 'album:2' })).toBe('album');
  });
  it('requires three writers in the book step', () => {
    const choices = emptyChoices();
    choices.book = [result('book', 1), result('book', 2)];
    expect(stepComplete(choices, 'book')).toBe(false);
    choices.book.push(result('book', 3));
    expect(stepComplete(choices, 'book')).toBe(true);
    expect(initialTopKind(result('book', 1))).toBe('author');
  });
  it('finishes only after all three categories are complete', () => {
    const choices = emptyChoices();
    choices.movie = [1, 2, 3].map(i => result('movie', i));
    choices.music = [1, 2, 3].map(i => result('music', i));
    expect(onboardingComplete(choices)).toBe(false);
    choices.book = [1, 2, 3].map(i => result('book', i));
    expect(onboardingComplete(choices)).toBe(true);
  });
  it('removes a repeated selection instead of duplicating it', () => {
    expect(toggleChoice([result('book', 1)], result('book', 1))).toEqual([]);
  });
  it('restores drafts without counting other categories or broken data', () => {
    expect(readOnboardingDraft('{')).toEqual(emptyChoices());
    expect(readOnboardingDraft(JSON.stringify({ movie: [result('book', 1)] })).movie).toEqual([]);
    expect(readOnboardingDraft(JSON.stringify({ movie: [result('movie', 1)] })).movie).toHaveLength(1);
  });
});