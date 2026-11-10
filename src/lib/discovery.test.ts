import {it,expect} from "vitest";
import {discoveryExclusions} from "./discovery";
it.each(["watched","queued","dismissed"] as const)("excludes a user's %s film",flag=>{const ids=discoveryExclusions([{external_id:"movie:1",user_id:"me",watched:false,queued:false,dismissed:false,[flag]:true}],[],"me");expect(ids.has("movie-1")).toBe(true);});
it("excludes items saved in a member list",()=>{expect(discoveryExclusions([],[{external_id:"movie:8"}],"me").has("movie-8")).toBe(true);});
it("does not exclude a friend's queued movie",()=>{expect(discoveryExclusions([{external_id:"movie:1",user_id:"friend",watched:false,queued:true,dismissed:false}],[],"me").has("movie-1")).toBe(false);});