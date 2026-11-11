/** Ciudades principales de Argentina para el selector rápido de la agenda. */
export const MAIN_CITIES = [
  "Ciudad de Buenos Aires",
  "Córdoba",
  "Rosario",
  "Mendoza",
  "La Plata",
  "Mar del Plata",
  "San Miguel de Tucumán",
  "Salta",
  "Santa Fe",
  "Neuquén",
  "Bariloche",
  "Bahía Blanca",
  "Paraná",
  "Posadas",
  "San Juan",
  "San Luis",
  "Ushuaia",
];

const fold = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, " ");


const ALIASES: Record<string, string> = {
  "caba": "Ciudad de Buenos Aires",
  "buenos aires": "Ciudad de Buenos Aires",
  "capital federal": "Ciudad de Buenos Aires",
  "ciudad autonoma de buenos aires": "Ciudad de Buenos Aires",
  "cordoba": "Córdoba",
  "tucuman": "San Miguel de Tucumán",
  "san miguel de tucuman": "San Miguel de Tucumán",
  "san carlos de bariloche": "Bariloche",
  "neuquen": "Neuquén",
  "parana": "Paraná",
};

/** Normaliza un nombre de ciudad (tildes, mayúsculas, alias) para evitar agendas duplicadas. */
export function normalizeCity(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if (!trimmed) return trimmed;
  const f = fold(trimmed);
  if (ALIASES[f]) return ALIASES[f];
  const known = MAIN_CITIES.find((c) => fold(c) === f);
  if (known) return known;
  return trimmed.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Variantes aceptadas al filtrar, para convivir con filas guardadas antes de la normalización. */
export function cityVariants(city: string): string[] {
  return [...new Set([city.trim(), normalizeCity(city)].filter(Boolean))];
}
