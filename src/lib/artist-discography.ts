import type {SearchResult} from './media';
export type ArtistAlbum=SearchResult & {popularity?:number};
export function artistAlbums(albums:ArtistAlbum[],order:'popular'|'year'){
 return [...albums].sort((a,b)=>order==='popular'?(b.popularity ?? 0)-(a.popularity ?? 0)||(b.year ?? 0)-(a.year ?? 0):(a.year ?? 9999)-(b.year ?? 9999)||(b.popularity ?? 0)-(a.popularity ?? 0));
}
export function verifiedSpotifyArtist(url:string){
 try{const parsed=new URL(url);return parsed.protocol==='https:'&&parsed.hostname==='open.spotify.com'&&/^\/artist\/[a-zA-Z0-9]+\/?$/.test(parsed.pathname)?parsed.href:null;}catch{return null;}
}