import { describe, expect, it } from 'vitest';
import { searchTaste, searchOpenTaste } from './search-tastes';
import { tasteScore, workTags } from './tastes';
import type { SearchResponse, SearchResult } from './media';

const book: SearchResult = {source:'openlibrary',externalId:'/works/OL1W',mediaType:'book',title:'Rayuela',creator:'Julio Cortázar',year:1963,imageUrl:null,externalUrl:null,kindLabel:'Libro'};
const response: SearchResponse = {book:[book],movie:[],music:[],art:[],people:[],movieProvider:'tmdb',warnings:[]};
describe('intereses por búsquedas', () => {
  it('una búsqueda de libro incorpora su autor como interés similar', () => {
    const signal = searchTaste('Rayuela','book',response);
    expect(signal?.work_tags).toContain('Julio Cortázar');
    expect(tasteScore(workTags({...book,title:'Bestiario'}), [{label:'Julio Cortázar',weight:signal?.points ?? 0,suppressed:false}])).toBe(0.5);
  });
  it('los resultados no coincidentes no se asumen gustos', () => {
    expect(searchTaste('terror','book',response)?.work_tags).toEqual(['terror']);
  });
  it('buscar no marca una obra como vista ni favorita', () => {
    expect(searchOpenTaste(book).is_excluded).toBe(false);
    expect(searchOpenTaste(book).points).toBe(2);
    expect(searchOpenTaste(book).k).toBe('search-open:openlibrary:/works/OL1W');
  });
  it('normaliza consultas repetidas sin acumular señales duplicadas', () => {
    expect(searchTaste(' CORTÁZAR ', 'book')?.k).toBe(searchTaste('cortazar','book')?.k);
  });
  it('ignora consultas incompletas de un carácter', () => expect(searchTaste('r','book')).toBeNull());
  it('una búsqueda por título aumenta la afinidad de candidatos con ese título', () => {
    expect(tasteScore(workTags(book),[{label:'Rayuela',weight:0.5,suppressed:false}])).toBe(0.5);
  });
});