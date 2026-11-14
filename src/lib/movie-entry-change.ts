export function movieEntryChange(change: {queued?:boolean;watched?:boolean;favorite?:boolean;score_10?:number|null;review?:string}) {
  return {...change};
}