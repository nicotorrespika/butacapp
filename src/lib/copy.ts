/**
 * Textos centralizados por categoría. Ningún componente escribe "película",
 * "disco" o "autor" a mano: todo sale de acá para que cada categoría hable
 * con sus propias palabras y género gramatical correcto.
 */

export type TopKind = "movie" | "artist" | "album" | "song" | "author" | "book";
export type ProfileCategory = "movie" | "music" | "book";

export interface TopKindCopy {
  /** Título de sección, ej. "TOP 5 ARTISTAS". */
  title: string;
  single: string;
  plural: string;
  /** Mensaje cuando todavía no hay ninguno. */
  empty: string;
  /** Mensaje cuando ya hay 5 y se intenta agregar otro. */
  full: string;
  /** Confirmación al agregar. */
  added: string;
  duplicate: string;
  searchPlaceholder: string;
  searchTitle: string;
  /** Botón para empezar a elegir. */
  pickCta: string;
  /** Botón para sumar cuando ya hay alguno. */
  addCta: string;
}

export const TOP_KIND_COPY: Record<TopKind, TopKindCopy> = {
  movie: {
    title: "TOP 5 PELÍCULAS",
    single: "película",
    plural: "películas",
    empty: "Elegí tus 5 películas favoritas",
    full: "Ya tenés 5 películas. Quitá una para agregar otra.",
    added: "Agregada a tu Top películas",
    duplicate: "Ya está en tu Top 5",
    searchPlaceholder: "Buscá una película…",
    searchTitle: "Elegí tu Top 5 de películas",
    pickCta: "Elegir películas",
    addCta: "Sumar una película",
  },
  artist: {
    title: "TOP 5 ARTISTAS",
    single: "artista",
    plural: "artistas",
    empty: "Elegí tus 5 artistas favoritos",
    full: "Ya tenés 5 artistas. Quitá uno para agregar otro.",
    added: "Agregado a tu Top artistas",
    duplicate: "Ya está en tu Top 5",
    searchPlaceholder: "Buscá un artista o banda…",
    searchTitle: "Elegí tu Top 5 de artistas",
    pickCta: "Elegir artistas",
    addCta: "Sumar un artista",
  },
  album: {
    title: "TOP 5 DISCOS",
    single: "disco",
    plural: "discos",
    empty: "Elegí tus 5 discos favoritos",
    full: "Ya tenés 5 discos. Quitá uno para agregar otro.",
    added: "Agregado a tu Top discos",
    duplicate: "Ya está en tu Top 5",
    searchPlaceholder: "Buscá un disco…",
    searchTitle: "Elegí tu Top 5 de discos",
    pickCta: "Elegir discos",
    addCta: "Sumar un disco",
  },
  song: {
    title: "TOP 5 CANCIONES",
    single: "canción",
    plural: "canciones",
    empty: "Elegí tus 5 canciones favoritas",
    full: "Ya tenés 5 canciones. Quitá una para agregar otra.",
    added: "Agregada a tu Top canciones",
    duplicate: "Ya está en tu Top 5",
    searchPlaceholder: "Buscá una canción…",
    searchTitle: "Elegí tu Top 5 de canciones",
    pickCta: "Elegir canciones",
    addCta: "Sumar una canción",
  },
  author: {
    title: "TOP 5 AUTORES",
    single: "autor o autora",
    plural: "autores",
    empty: "Elegí tus 5 autores favoritos",
    full: "Ya tenés 5 autores. Quitá uno para agregar otro.",
    added: "Agregado a tu Top autores",
    duplicate: "Ya está en tu Top 5",
    searchPlaceholder: "Buscá un autor o autora…",
    searchTitle: "Elegí tu Top 5 de autores",
    pickCta: "Elegir autores",
    addCta: "Sumar un autor",
  },
  book: {
    title: "TOP 5 LIBROS",
    single: "libro",
    plural: "libros",
    empty: "Elegí tus 5 libros favoritos",
    full: "Ya tenés 5 libros. Quitá uno para agregar otro.",
    added: "Agregado a tu Top libros",
    duplicate: "Ya está en tu Top 5",
    searchPlaceholder: "Buscá un libro…",
    searchTitle: "Elegí tu Top 5 de libros",
    pickCta: "Elegir libros",
    addCta: "Sumar un libro",
  },
};

/** Sub-tipos de Top 5 que ofrece cada categoría del perfil. Eventos no tiene Top 5. */
export const TOP_KINDS_BY_CATEGORY: Record<ProfileCategory, { kind: TopKind; label: string }[]> = {
  movie: [{ kind: "movie", label: "Películas" }],
  music: [
    { kind: "artist", label: "Artistas" },
    { kind: "album", label: "Discos" },
    { kind: "song", label: "Canciones" },
  ],
  book: [
    { kind: "author", label: "Autores" },
    { kind: "book", label: "Libros" },
  ],
};

export interface CategoryCopy {
  singular: string;
  plural: string;
  verb: string;
  /** Estado completado, ej. "La vi". */
  done: string;
  /** Estado pendiente, ej. "Quiero verla". */
  want: string;
  /** Pestaña de completados en el perfil. */
  doneTab: string;
  favoritesTab: string;
  emptyDone: string;
}

export const CATEGORY_COPY: Record<ProfileCategory, CategoryCopy> = {
  movie: {
    singular: "película",
    plural: "películas",
    verb: "ver",
    done: "La vi",
    want: "Quiero verla",
    doneTab: "Vistas",
    favoritesTab: "Favoritas",
    emptyDone: "Todavía no hay películas acá.",
  },
  music: {
    singular: "disco",
    plural: "discos",
    verb: "escuchar",
    done: "Lo escuché",
    want: "Quiero escucharlo",
    doneTab: "Escuchados",
    favoritesTab: "Favoritos",
    emptyDone: "Todavía no hay música acá.",
  },
  book: {
    singular: "libro",
    plural: "libros",
    verb: "leer",
    done: "Lo leí",
    want: "Quiero leerlo",
    doneTab: "Leídos",
    favoritesTab: "Favoritos",
    emptyDone: "Todavía no hay libros acá.",
  },
};
