import {it,expect} from "vitest";
import {verifiedUnique} from "./betty-types";
import type {SearchResult} from "./media";
const result=(id:string):SearchResult=>({externalId:id,source:"tmdb",title:id,year:2000,creator:null,imageUrl:null,kindLabel:"Película",externalUrl:null,mediaType:"movie"});
it("excludes watched titles and duplicates",()=>{expect(verifiedUnique([{result:result("movie-1"),reason:"a"},{result:result("movie-2"),reason:"b"},{result:result("movie-2"),reason:"c"}],["movie-1"]).map(m=>m.result.externalId)).toEqual(["movie-2"]);});
it("caps recommendations at eight",()=>{expect(verifiedUnique(Array.from({length:10},(_,i)=>({result:result(String(i)),reason:"a"})))).toHaveLength(8);});
it("treats movie:1 and movie-1 as the same watched title",()=>{expect(verifiedUnique([{result:result("movie:1"),reason:"a"}],["movie-1"])).toEqual([]);});