import { z } from 'zod';
export const guestSearchSchema = z.object({ q: z.string().trim().min(2).max(120), filter: z.enum(['all', 'movie', 'music', 'book']) });
export const guestDetailSchema = z.discriminatedUnion('source', [
  z.object({ source: z.literal('tmdb'), id: z.string().regex(/^(movie|tv):\d+$/) }),
  z.object({ source: z.literal('openlibrary'), id: z.string().regex(/^\/works\/OL\d+W$/) }),
  z.object({ source: z.literal('deezer'), id: z.string().regex(/^(album|song|artist):\d+$/) }),
  z.object({ source: z.literal('itunes'), id: z.string().regex(/^(album|song):\d+$/) }),
  z.object({ source: z.literal('musicbrainz'), id: z.string().regex(/^(album|song|artist):[a-f0-9-]{36}$/) }),
]);