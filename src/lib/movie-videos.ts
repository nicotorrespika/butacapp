export interface MovieVideo {
  key: string;
  site: string;
  type: string;
  official?: boolean;
  iso_639_1?: string;
}

/** Only official YouTube trailers; prefer Spanish when several are available. */
export function selectTrailer(videos: MovieVideo[]): string | null {
  const eligible = videos.filter((v) => v.site === "YouTube" && v.type === "Trailer" && v.official === true && /^[\w-]{11}$/.test(v.key));
  return eligible.find((v) => v.iso_639_1 === "es")?.key ?? eligible[0]?.key ?? null;
}