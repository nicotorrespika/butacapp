import {useScreenState} from "@/hooks/use-screen-state";
import { useEffect,useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link,useNavigate } from "@tanstack/react-router";
import { Glasses,Library,LogIn,Search,UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { myListsQuery } from "@/lib/queries";
import { homeCategories,type HomeCategory } from "@/lib/culture";
import { Button } from "./ui/button";
import { ListCoverStrip } from "./ListCoverStrip";
import { FriendsFeed } from "./FriendsFeed";
import { DiscoveryDeck } from "./DiscoveryDeck";
import { CultureDiscovery } from "./CultureDiscovery";
import { CultureFeed } from "./CultureFeed";
import { BettySearch } from "./BettySearch";
import { CultureBetty } from "./CultureBetty";
import { EventAgenda } from "./EventAgenda";
import { EventBetty } from "./EventBetty";
import { TasteRecommendations } from "./TasteRecommendations";
import { TasteEditor } from "./TasteEditor";
import { useTastes } from "@/hooks/use-tastes";
const headlines={all:"¿QUÉ VAMOS A BUSCAR HOY?",movie:"¿QUÉ PELI VAMOS A VER?",music:"¿QUÉ TENÉS GANAS DE ESCUCHAR?",book:"¿ALGÚN LIBRO NUEVO QUE TE PUEDA INTERESAR?",event:"VEAMOS QUÉ PLANES HAY EN TU CIUDAD"};
const placeholders={all:"Título, artista, libro o plan…",movie:"Título, director, actor o año",music:"Artista, disco, canción o género",book:"Título, autor o tema",event:"Evento, lugar, artista o ciclo"};
const labels={all:"Inicio",movie:"Cine",music:"Música",book:"Libros",event:"Eventos"};
export function HomeExperience(){const {user}=useAuth();const navigate=useNavigate();const tastes=useTastes();const [category,setCategory]=useScreenState<HomeCategory>("home:category","all");const [text,setText]=useState("");const [betty,setBetty]=useScreenState("home:betty",false);const [eventQuery,setEventQuery]=useState("");const lists=useQuery({...myListsQuery,enabled:!!user});
 useEffect(()=>{const saved=localStorage.getItem("butacapp-home-category");if(homeCategories.some(c=>c===saved))setCategory(saved as HomeCategory);},[]);
 function choose(c:HomeCategory){setCategory(c);setText("");setBetty(false);localStorage.setItem("butacapp-home-category",c);}
 return <div className="w-full max-w-full overflow-x-hidden"><header className="w-full max-w-full px-4 pb-5 pt-8"><Link to="/" className="cinema-heading text-xl text-primary">BUTACAPP</Link><h1 className="mt-7 max-w-3xl break-words font-heading text-3xl font-bold uppercase leading-tight sm:text-5xl md:text-6xl">{headlines[category]}</h1><form className="mt-7 flex w-full max-w-full flex-col gap-2 sm:flex-row" onSubmit={e=>{e.preventDefault();if(!text.trim())return;if(category==="event"){setEventQuery(text);return;}void navigate({to:"/search",search:{q:text,f:category==="all"?undefined:category}});}}><input aria-label="Buscar desde Inicio" type="search" placeholder={placeholders[category]} value={text} onChange={e=>setText(e.target.value)} className="h-14 w-full min-w-0 flex-1 rounded-sm border border-input bg-card px-4 text-base"/><Button type="submit" className="h-14 w-full shrink-0 sm:w-auto"><Search className="mr-2 size-4"/>Buscar</Button></form><div role="tablist" aria-label="Categorías de Inicio" className="-mx-4 mt-5 flex gap-1 overflow-x-auto px-4 scrollbar-none">{homeCategories.map(c=><Button variant="ghost" role="tab" aria-selected={category===c} key={c} onClick={()=>choose(c)} className={`shrink-0 rounded-none border-b px-4 ${category===c?"border-primary text-primary":"border-transparent text-muted-foreground"}`}>{labels[c]}</Button>)}</div>{user?<Button variant="outline" className="mt-5" onClick={()=>setBetty(!betty)}><Glasses/>Preguntale a Betty</Button>:<div className="mt-5 flex flex-wrap gap-3"><Button asChild><Link to="/auth"><LogIn className="mr-2 size-4"/>Entrar</Link></Button><Button asChild variant="outline"><Link to="/auth" search={{mode:"signup"}}><UserPlus className="mr-2 size-4"/>Crear cuenta</Link></Button></div>}</header>
 {user&&<>{tastes.settings.isSuccess&&!tastes.settings.data?.onboarding_done&&<div className="px-4 py-6"><TasteEditor onboarding category={category}/></div>}<TasteRecommendations category={category}/>{betty&&(category==="event"?<EventBetty/>:category==="music"||category==="book"?<CultureBetty key={category} type={category}/>:category==="all"?<CultureBetty type="all"/>:<BettySearch contextual/>)}{category==="event"?<EventAgenda key={eventQuery} initialQuery={eventQuery}/>:<><section className="px-4 pt-6"><div className="flex items-center justify-between"><h2 className="cinema-heading text-3xl">Mis listas</h2><Button asChild variant="ghost"><Link to="/lists"><Library/>Ver listas</Link></Button></div><div className="mt-3 flex gap-5 overflow-x-auto scrollbar-none">{lists.data?.filter(l=>category==="all"?l.kind!=="art":l.kind==="mixed"||l.kind===(category==="movie"?"movies":category==="book"?"books":"music")).slice(0,6).map(l=><Link key={l.id} to="/lists/$listId" params={{listId:l.id}} className="w-40 shrink-0 py-3 font-display text-xl text-primary"><span>{l.name}</span><ListCoverStrip covers={l.covers} name={l.name}/></Link>)}</div></section>{category==="movie"?<DiscoveryDeck surprise/>:category==="music"||category==="book"?<CultureDiscovery key={category} type={category} surprise/>:null}<CultureFeed category={category}/></>}<FriendsFeed category={category}/></>}
 <p className="px-4 py-6 text-[10px] text-muted-foreground">Datos de cine: TMDB. Este producto usa la API de TMDB y no está avalado ni certificado por TMDB.</p></div>;
}