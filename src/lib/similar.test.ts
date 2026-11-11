import {it,expect} from "vitest";
import {isLatin,regionalOrder,movieAffinity,movieKeywords,type SimilarItem} from "./similar";
const item=(country:string,id:string):SimilarItem=>({country,estimated:false,reason:"",result:{source:"tmdb",externalId:id,mediaType:"movie",title:id,year:null,creator:null,imageUrl:null,kindLabel:"Película",externalUrl:null}});
it("Spain is not Latin American",()=>expect(isLatin("ES")).toBe(false));
it("unknown origin is not classified as Latin American",()=>expect(isLatin(null)).toBe(false));
it("prioritizes Argentina before the rest of Latin America",()=>expect(regionalOrder([item("BR","1"),item("AR","2"),item("MX","3")],"US").map(i=>i.country)).toEqual(["AR","BR","MX"]));
it("a Latin American work recommends other countries in the region",()=>expect(regionalOrder([item("AR","1"),item("UY","2")],"AR").map(i=>i.country)).toEqual(["UY"]));
const coraline={genres:[{id:16,name:"Animación"},{id:14,name:"Fantasía"},{id:10751,name:"Familia"}],keywords:{keywords:[{id:1299,name:"parallel world"}]}};
it("Coraline excludes live-action Latin picks even when their themes match",()=>expect(movieAffinity(coraline,{genres:[{id:18,name:"Drama"}],keywords:coraline.keywords})).toBeNull());
it("Coraline accepts Latin animation without requiring every genre",()=>expect(movieAffinity(coraline,{genres:[{id:16,name:"Animación"}]})).toMatchObject({score:1,genres:["animación"]}));
it("Coraline ranks animated fantasy and shared themes ahead of generic animation",()=>{
  const close=movieAffinity(coraline,{genres:coraline.genres,keywords:coraline.keywords});
  const broad=movieAffinity(coraline,{genres:[{id:16,name:"Animación"}]});
  expect(close?.score).toBe(11);expect(broad?.score).toBe(1);
});
it("geography alone cannot qualify an unrelated recommendation",()=>expect(movieAffinity({genres:[{id:878,name:"Ciencia ficción"}]},{genres:[{id:35,name:"Comedia"}]})).toBeNull());
it("TV thematic matching reads the provider results field",()=>expect(movieKeywords({keywords:{results:[{id:1299,name:"parallel world"}]}})).toEqual([{id:1299,name:"parallel world"}]));