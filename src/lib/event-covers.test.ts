import { describe, expect, it } from 'vitest';
import { eventCover } from './event-covers';

describe('event photos match the named performer or production', () => {
  it('uses Alberto Favero’s portrait for his concert', () => {
    expect(eventCover('Canciones de colección, con Alberto Favero')?.url).toContain('event-favero.jpg');
  });
  it('uses Félix San Martín’s own portrait', () => {
    expect(eventCover('Tardes de canciones: Félix San Martín')?.url).toContain('event-felix.jpg');
  });
  it('does not assign a different performer to an unknown event', () => {
    expect(eventCover('Tardes de canciones: otra persona')).toBeUndefined();
  });
});