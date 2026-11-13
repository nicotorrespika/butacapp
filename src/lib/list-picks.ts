import type {SearchResult} from './media';
import {tasteKey} from './tastes';
import type {ShelfCategory} from './home-shelves';
export type ListAnchor={source:string;external_id:string;title:string;creator:string|null;media_type:string;added_by:string};
export function listAnchors(items:ListAnchor[],category:ShelfCategory){
 const rows=items.filter(i=>i.media_type===category);const authors=new Set<string>();const picked:ListAnchor[]=[];
 for(const r of rows){if(!authors.has(r.added_by)){picked.push(r);authors.add(r.added_by);}if(picked.length===3)break;}
 for(const r of rows){if(picked.length===3)break;if(!picked.includes(r))picked.push(r);}
 return picked;
}
export function listPicks(groups:SearchResult[][],items:ListAnchor[],category:ShelfCategory){
 const excluded=new Set(items.map(i=>tasteKey(i.source,i.external_id)));const seen=new Set<string>();const picks:SearchResult[]=[];
 const length=Math.max(0,...groups.map(g=>g.length));
 for(let i=0;i<length;i++)for(const group of groups){const r=group[i];if(!r||r.mediaType!==category)continue;const key=tasteKey(r.source,r.externalId);if(excluded.has(key)||seen.has(key))continue;seen.add(key);picks.push(r);}
 return picks.slice(0,10);
}