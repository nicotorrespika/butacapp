import { expect, it } from 'vitest';
import { NEWS_PAGE_SIZE, newsPageEnd } from './feed-pagination';
it('muestra cinco novedades por carga', () => {
  expect(NEWS_PAGE_SIZE).toBe(5);
  expect(newsPageEnd(0)).toBe(4);
  expect(newsPageEnd(5)).toBe(9);
});