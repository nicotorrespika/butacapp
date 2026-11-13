import {describe,it,expect} from 'vitest';
import {listAnchors,listPicks} from './list-picks';
import type {SearchResult} from './media';
const item=(id:string,by:string,type='book')=>({source:'openlibrary',external_id:id,title:id,creator:'Autor',media_type:type,added_by:by});
const result=(id:string,type='book')=>({source:'openlibrary',externalId:id,title:id,mediaType:type} as SearchResult);
describe('list suggestions',()=>{
 it('uses additions from different collaborators',()=>{expect(listAnchors([item('a','one'),item('b','one'),item('c','two')],'book').map(i=>i.external_id)).toEqual(['a','c','b']);});
 it('excludes existing works and other categories',()=>{expect(listPicks([[result('saved'),result('new'),result('film','movie')]],[item('saved','one')],'book').map(i=>i.externalId)).toEqual(['new']);});
 it('mixes anchors without duplicate works',()=>{expect(listPicks([[result('a'),result('same')],[result('b'),result('same')]],[],'book').map(i=>i.externalId)).toEqual(['a','b','same']);});
});