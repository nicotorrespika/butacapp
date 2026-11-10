import {it,expect} from "vitest";
import {isLatin,regionalOrder,type SimilarItem} from "./similar";
const item=(country:string,id:string):SimilarItem=>({country,estimated:false,reason:"",result:{source:"tmdb",externalId:id,mediaType:"movie",title:id,year:null,creator:null,imageUrl:null,kindLabel:"Película",externalUrl:null}});
it("Spain is not Latin American",()=>expect(isLatin("ES")).toBe(false));
it("unknown origin is not classified as Latin American",()=>expect(isLatin(null)).toBe(false));
it("prioritizes Argentina before the rest of Latin America",()=>expect(regionalOrder([item("BR","1"),item("AR","2"),item("MX","3")],"US").map(i=>i.country)).toEqual(["AR","BR","MX"]));
it("a Latin American work recommends other countries in the region",()=>expect(regionalOrder([item("AR","1"),item("UY","2")],"AR").map(i=>i.country)).toEqual(["UY"]));