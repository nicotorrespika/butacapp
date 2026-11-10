import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getPublicShare } from "@/lib/share.functions";
import { APP_ORIGIN, shareRefSchema, sharePath } from "@/lib/sharing";
import { PublicSharePage } from "@/components/PublicSharePage";

export const Route=createFileRoute("/compartir/$kind/$id")({
  validateSearch:z.object({de:z.string().uuid().optional()}),
  loader:async({params})=>{const ref=shareRefSchema.parse(params);return {ref,summary:await getPublicShare({data:ref})};},
  head:({loaderData})=>{const s=loaderData?.summary;const title=s?`${s.title} — BUTACAPP`:"Contenido privado — BUTACAPP";const description=s?.description ?? "Entrá a BUTACAPP para ver este contenido si tenés acceso.";const url=loaderData?`${APP_ORIGIN}${sharePath(loaderData.ref)}`:undefined;const image=loaderData&&s?.image?.startsWith("https://")?`${APP_ORIGIN}/api/public/portada/${loaderData.ref.kind}/${encodeURIComponent(loaderData.ref.id)}`:undefined;return {
    meta:[{title},{name:"description",content:description},{property:"og:title",content:title},{property:"og:description",content:description},{property:"og:type",content:"article"},{name:"twitter:card",content:"summary_large_image"},...(url?[{property:"og:url",content:url}]:[]),...(image?[{property:"og:image",content:image},{name:"twitter:image",content:image}]:[]),...(!s?[{name:"robots",content:"noindex"}]:[])],
    links:url?[{rel:"canonical",href:url}]:[],
  };},
  component:SharedPage,
});
function SharedPage(){const {ref,summary}=Route.useLoaderData();const {de}=Route.useSearch();return <PublicSharePage refData={ref} summary={summary} {...(de?{inviter:de}:{})}/>;}