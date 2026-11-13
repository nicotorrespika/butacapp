import {describe,it,expect} from 'vitest';
import {collectionMatch} from './profile-collections';
describe('profile collections',()=>{
 it('Vistas contains only watched works',()=>{expect(collectionMatch('Vistas',{consumed:false,queued:true,favorite:false})).toBe(false);expect(collectionMatch('Vistas',{consumed:true,queued:false,favorite:false})).toBe(true);});
 it('Watchlist excludes consumed works',()=>{expect(collectionMatch('Watchlist',{consumed:true,queued:true,favorite:false})).toBe(false);expect(collectionMatch('Watchlist',{consumed:false,queued:true,favorite:false})).toBe(true);});
 it('Favoritas need not be consumed',()=>{expect(collectionMatch('Favoritas',{consumed:false,queued:false,favorite:true})).toBe(true);expect(collectionMatch('Favoritas',{consumed:true,queued:false,favorite:false})).toBe(false);});
});