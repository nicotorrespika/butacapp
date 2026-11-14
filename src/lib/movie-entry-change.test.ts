import {expect,it} from 'vitest';
import {movieEntryChange} from './movie-entry-change';
it('queues a movie in personal Watchlist without changing watched, favorite or review',()=>{
 const previous={watched:false,favorite:true,score_10:8,review:'Mi crítica',queued:false};
 expect({...previous,...movieEntryChange({queued:true})}).toEqual({...previous,queued:true});
 expect(movieEntryChange({queued:true})).toEqual({queued:true});
});