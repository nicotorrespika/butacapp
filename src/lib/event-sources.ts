export const EVENT_DISCOVERY_SOURCES = [
  { name: "Time Out Buenos Aires", url: "https://www.timeout.com/es/buenos-aires/agenda-semana" },
  { name: "Vuenos Airez", url: "https://www.vuenosairez.com" },
  { name: "Agenda Cultural de Buenos Aires", url: "https://buenosaires.gob.ar/cultura" },
] as const;

export function eventSourceInstructions() {
  return `Además de las fuentes oficiales y salas existentes, buscar eventos en estas páginas: ${EVENT_DISCOVERY_SOURCES.map(source => `${source.name}: ${source.url}`).join("; ")}. Time Out y Vuenos Airez son fuentes editoriales de descubrimiento, no sitios oficiales de los organizadores. Usar sus notas para descubrir propuestas y corroborar fecha, hora y lugar en la página del organizador o en la agenda oficial antes de incluirlas como verificadas. Conservar source_name y source_url de la página concreta que confirma los datos, nunca una portada o agenda genérica. Si una fuente no está disponible, continuar con las demás sin inventar resultados. Para ciudades fuera de Buenos Aires, usar estas páginas solo si publican eventos en la ciudad solicitada.`;
}