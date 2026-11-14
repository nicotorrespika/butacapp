import {expect,it} from 'vitest';
import {artistAlbums,verifiedSpotifyArtist,type ArtistAlbum} from './artist-discography';
it('orders albums by popularity or chronologically with popular albums first within each year',()=>{
 const rows=[{title:'new',year:2020,popularity:1},{title:'old',year:1980,popularity:10},{title:'same year',year:1980,popularity:20}] as ArtistAlbum[];
 expect(artistAlbums(rows,'popular').map(r=>r.title)).toEqual(['same year','old','new']);
 expect(artistAlbums(rows,'year').map(r=>r.title)).toEqual(['same year','old','new']);
});
it('never presents search URLs or unrelated hosts as direct Spotify artist profiles',()=>{
 expect(verifiedSpotifyArtist('https://open.spotify.com/artist/123abc')).toBe('https://open.spotify.com/artist/123abc');
 expect(verifiedSpotifyArtist('https://open.spotify.com/search/Charly')).toBeNull();
 expect(verifiedSpotifyArtist('https://example.com/artist/123abc')).toBeNull();
});