export function collectionMatch(tab:string, row:{queued:boolean; consumed:boolean; favorite:boolean}) {
  if(tab==="Watchlist") return row.queued&&!row.consumed;
  if(tab==="Favoritas") return row.favorite;
  return row.consumed;
}