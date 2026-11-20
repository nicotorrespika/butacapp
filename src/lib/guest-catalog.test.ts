import { expect, it } from 'vitest';
import { guestDetailSchema, guestSearchSchema } from './guest-catalog';
it('allows searches without a user or account identifier', () => {
  expect(guestSearchSchema.parse({ q: 'Coraline', filter: 'movie' })).toEqual({ q: 'Coraline', filter: 'movie' });
  expect(guestSearchSchema.safeParse({ q: 'x', filter: 'movie' }).success).toBe(false);
});
it('restricts guest lookup to public catalog IDs, never arbitrary URLs or lists', () => {
  expect(guestDetailSchema.safeParse({ source: 'tmdb', id: 'movie:14836' }).success).toBe(true);
  expect(guestDetailSchema.safeParse({ source: 'openlibrary', id: '/works/OL123W' }).success).toBe(true);
  expect(guestDetailSchema.safeParse({ source: 'lists', id: 'private-list' }).success).toBe(false);
  expect(guestDetailSchema.safeParse({ source: 'openlibrary', id: 'https://example.com' }).success).toBe(false);
});