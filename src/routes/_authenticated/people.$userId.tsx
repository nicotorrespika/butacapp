import { createFileRoute } from "@tanstack/react-router";
import { BackButton } from "@/components/BackButton";
import { ProfileView } from "@/components/ProfileView";
export const Route=createFileRoute("/_authenticated/people/$userId")({head:()=>({meta:[{title:"Perfil de cine — MOMENTO BUTACA"},{name:"description",content:"Películas favoritas, listas y reseñas de tu gente."},{property:"og:title",content:"Perfil de cine — MOMENTO BUTACA"},{property:"og:description",content:"Una mirada personal al cine."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),component:Page});
function Page(){const {userId}=Route.useParams();return <div className="px-4 py-6"><BackButton/><div className="mt-8"><ProfileView userId={userId}/></div></div>;}