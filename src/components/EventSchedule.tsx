import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function EventSchedule({ id }: { id: string }) {
  const event = useQuery({
    queryKey: ["culture", "event-schedule", id],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const response = await supabase.from("cultural_events")
        .select("starts_at,ends_at,venue,address,city")
        .eq("id", id).maybeSingle();
      if (response.error) throw response.error;
      return response.data;
    },
  });
  const data = event.data;
  if (!data) return <p className="mt-3 text-xs text-muted-foreground">{event.isLoading ? "Cargando fecha y lugar…" : "Fecha, horario y lugar: consultá la fuente."}</p>;
  const start = new Date(data.starts_at);
  const end = data.ends_at ? new Date(data.ends_at) : null;
  const zone = "America/Argentina/Buenos_Aires";
  const day = (date: Date) => date.toLocaleDateString("es-AR", { timeZone: zone, weekday: "short", day: "numeric", month: "short" });
  const time = (date: Date) => date.toLocaleTimeString("es-AR", { timeZone: zone, hour: "2-digit", minute: "2-digit", hour12: false });
  return <dl className="mt-3 space-y-2 text-xs leading-5 text-muted-foreground">
    <div><dt className="cinema-meta">Día{end && day(end) !== day(start) ? "s" : ""}</dt><dd>{day(start)}{end && day(end) !== day(start) ? ` al ${day(end)}` : ""}</dd></div>
    <div><dt className="cinema-meta">Horario</dt><dd>{time(start)}{end && day(end) === day(start) ? `–${time(end)}` : ""} h</dd></div>
    <div><dt className="cinema-meta">Lugar</dt><dd className="break-words">{[data.venue, data.address, data.city].filter(Boolean).join(" · ")}</dd></div>
  </dl>;
}