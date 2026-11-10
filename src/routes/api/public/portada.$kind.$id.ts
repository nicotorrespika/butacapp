import {createFileRoute} from "@tanstack/react-router";
import {getPublicShare} from "@/lib/share.functions";
import {shareRefSchema} from "@/lib/sharing";
export const Route=createFileRoute("/api/public/portada/$kind/$id")({server:{handlers:{GET:async({params})=>{
  const parsed=shareRefSchema.safeParse(params);if(!parsed.success)return new Response("Unavailable",{status:404});
  const summary=await getPublicShare({data:parsed.data});if(!summary?.image?.startsWith("https://"))return new Response("Unavailable",{status:404});
  try{const {shareImage}=await import("@/server/share-image");const jpeg=await shareImage(summary.image);return new Response(new Uint8Array(jpeg),{headers:{"Content-Type":"image/jpeg","Cache-Control":"public, max-age=3600"}});}catch{return Response.redirect(summary.image,302);}
}}}});