import { expect, it } from 'vitest';
import { hasCrossConnections } from './cross-cache';
it('películas requieren conexiones de libros y música, no una caché vacía', () => {
  expect(hasCrossConnections({ movie: [], music: [], book: [] }, 'movie')).toBe(false);
  expect(hasCrossConnections({ music: [{}], book: [] }, 'movie')).toBe(false);
  expect(hasCrossConnections({ music: [{}], book: [{}] }, 'movie')).toBe(true);
});