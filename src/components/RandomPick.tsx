import { useState } from "react";
import { Shuffle } from "lucide-react";
import { Button } from "./ui/button";
import { Drawer,DrawerContent,DrawerHeader,DrawerTitle } from "./ui/drawer";
import { DiscoveryDeck } from "./DiscoveryDeck";
import { CultureDiscovery } from "./CultureDiscovery";
export function RandomPick({category}:{category:"movie"|"music"|"book"}){
 const [open,setOpen]=useState(false);const title=category==="movie"?"¿Una peli random?":category==="music"?"Disco random":"¿Libro random?";
 return <div className="min-w-0"><Button variant="outline" className="h-auto min-h-11 w-full whitespace-normal px-3 text-left" onClick={()=>setOpen(true)}><Shuffle className="shrink-0"/>{title}</Button><p className="mt-2 text-xs leading-5 text-muted-foreground">Descubrí {category==="movie"?"una peli":category==="music"?"un disco":"un libro"} al azar, cerca de tus búsquedas.</p><Drawer open={open} onOpenChange={setOpen}><DrawerContent className="max-h-[88dvh] overflow-y-auto"><DrawerHeader><DrawerTitle>{title}</DrawerTitle></DrawerHeader>{open&&(category==="movie"?<DiscoveryDeck surprise autoReveal/>:<CultureDiscovery type={category} surprise autoReveal/>)}</DrawerContent></Drawer></div>;
}