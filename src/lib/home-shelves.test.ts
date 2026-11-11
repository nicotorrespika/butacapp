import { describe, expect, it } from 'vitest';
import { chooseShelfAnchor, consumedFriendActivity, uniqueShelfItems } from './home-shelves';
import type { SearchResult } from './media';
describe('Inicio por categoría', () => {
  it('prioriza favoritos sobre consumos recientes', () => {
    const consumed = { source: 'tmdb', externalId: 'movie:1', title: 'Rocky', creator: null, consumed: true, favorite: false };
    const favorite = { ...consumed, externalId: 'movie:2', title: 'Coraline', favorite: true };
    expect(chooseShelfAnchor([consumed, favorite])?.title).toBe('Coraline');
  });
  it('no mezcla libros con cine ni música', () => {
    const book: SearchResult = { source: 'openlibrary', externalId: 'OL1W', mediaType: 'book', title: 'Rayuela', creator: null, year: null, imageUrl: null, externalUrl: null, kindLabel: 'Libro' };
    expect(uniqueShelfItems([book], 'movie', new Set())).toEqual([]);
    expect(uniqueShelfItems([book], 'music', new Set())).toEqual([]);
    expect(uniqueShelfItems([book], 'book', new Set())).toEqual([book]);
  });
  it('excluye consumidos y descartados', () => {
    const movie: SearchResult = { source: 'tmdb', externalId: 'movie:1', mediaType: 'movie', title: 'Rocky', creator: null, year: null, imageUrl: null, externalUrl: null, kindLabel: 'Película' };
    expect(uniqueShelfItems([movie], 'movie', new Set(['tmdb:movie:1']))).toEqual([]);
  });
  it('solo dice que amigos consumieron cuando hay actividad de consumo de esa categoría', () => {
    expect(consumedFriendActivity({ category: 'music', kind: 'watched' }, 'music')).toBe(true);
    expect(consumedFriendActivity({ category: 'music', kind: 'added' }, 'music')).toBe(false);
    expect(consumedFriendActivity({ category: 'book', kind: 'watched' }, 'music')).toBe(false);
  });
});