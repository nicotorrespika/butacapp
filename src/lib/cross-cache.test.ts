import { expect, it, vi } from 'vitest';
import { crossMovieId, hasCrossConnections } from './cross-cache';
it('películas requieren conexiones de libros y música, no una caché vacía', () => {
  expect(hasCrossConnections({ movie: [], music: [], book: [] }, 'movie')).toBe(false);
  expect(hasCrossConnections({ music: [{}], book: [] }, 'movie')).toBe(false);
  expect(hasCrossConnections({ music: [{}], book: [{}] }, 'movie')).toBe(true);
});
it.each(['movie-2654', 'movie:2654', '2654'])('cualquier acceso a %s usa la misma película y caché', async id => {
  const lookup = vi.fn();
  expect(await crossMovieId(id, lookup)).toBe('movie-2654');
  expect(lookup).not.toHaveBeenCalled();
});
it('resuelve cualquier película IMDb, no un título especial', async () => {
  const lookup = vi.fn().mockResolvedValue({movie_results:[{id:2654}],tv_results:[]});
  expect(await crossMovieId('tt0116683', lookup)).toBe('movie-2654');
  expect(lookup).toHaveBeenCalledWith('tt0116683');
});
it('no inventa una película cuando el catálogo no la reconoce', async () => {
  const lookup = vi.fn().mockResolvedValue({movie_results:[],tv_results:[]});
  expect(await crossMovieId('tt0000000', lookup)).toBeNull();
  expect(await crossMovieId('unknown', lookup)).toBeNull();
});