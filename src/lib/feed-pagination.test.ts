import { expect, it } from 'vitest';
import { NEWS_PAGE_SIZE, newsPageEnd } from './feed-pagination';
it('muestra seis novedades por carga', () => {
  expect(NEWS_PAGE_SIZE).toBe(6);
  expect(newsPageEnd(0)).toBe(5);
  expect(newsPageEnd(6)).toBe(11);
});