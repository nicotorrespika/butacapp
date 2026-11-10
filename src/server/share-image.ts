import { decode, encode } from "jpeg-js";
import frame from "@/assets/share-frame.json";

export async function shareImage(url:string){
  const base=decode(Uint8Array.from(atob(frame.jpeg),c=>c.charCodeAt(0)),{useTArray:true});
  const response=await fetch(url,{signal:AbortSignal.timeout(7000)});
  if(!response.ok)throw new Error("Cover unavailable");
  const bytes=new Uint8Array(await response.arrayBuffer());
  if(bytes.length>5_000_000)throw new Error("Cover too large");
  let source:{width:number;height:number;data:ArrayLike<number>;channels?:number};
  if(bytes[0]===137){const png=await import("fast-png");source=png.decode(bytes);}else source=decode(bytes,{useTArray:true,maxResolutionInMP:8});
  const width=Math.min(720,Math.round(460*source.width/source.height));const height=460;const x0=Math.floor((1200-width)/2),y0=130;const channels=source.channels ?? 4;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const i=(Math.floor(y*source.height/height)*source.width+Math.floor(x*source.width/width))*channels;const out=((y+y0)*1200+x+x0)*4;
    for(let c=0;c<3;c++)base.data[out+c]=source.data[i+c] ?? 0;
  }
  return encode(base,85).data;
}