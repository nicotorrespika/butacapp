# Roadmap

## Latest requests
- [x] Cambiar «Preguntale a Betty» por invitaciones por categoría: ver, leer y escuchar.
- [x] Acomodar libros y música como películas: portada compacta, acciones leído/escuchado, favorito y pendientes arriba, reseña pequeña, datos/canciones desplegables y recomendaciones por obra.
- [x] Recomendaciones latinas por género/temática, animación conservada y relevancia antes que país; caché renovada, 9 pruebas pasan y Coraline verificada con sesión real: Soy Frankelda, La casa lobo y otras animaciones.
- [x] Compactar encabezado, acciones, estrellas y promedios de película; títulos de cruces con la película y Reparto/Ficha técnica/Soundtrack desplegables debajo del tráiler. Rocky verificado con sesión real a 390 y 834 px, sin desborde; los tres despliegan y cierran.
- [x] Barra compacta Fecha / Tipo de evento / Ciudad con menús y calendario; sin filtro de precio/barrio visible, gratuitos en verde debajo de portada. Menús probados en móvil y 7 pruebas pasan.
- [x] Fotos pequeñas de eventos en novedades y recomendaciones; días, horario y lugar desde datos guardados. Die Walküre verificado en computadora y celular: 29/11, 17:00, Teatro Colón; sin desborde.
- [x] Acción de pendientes junto a vista/favorita, tres iconos alineados como la captura; selector de listas verificado con sesión real en móvil y pruebas del guardado existentes pasan, sin agregar obras de prueba a las listas del usuario.
- [x] Director debajo del título y ficha técnica con todos los créditos disponibles de TMDB, con fuente identificada.
- [x] Ficha más compacta: estrellas sin título, promedios reales por fuente y reseña pequeña tras el tráiler; sin Comentarios de tu gente.
- [x] Ficha de película: soundtrack como disco navegable sin canciones desplegadas; tráiler después de sinopsis y nota personal más arriba.
- [x] Fotos específicas para Favero, Félix San Martín, Santiago Alonso (disco), Lovro Pogorelić, La Tempestad y Die Walküre, con créditos; otros eventos conservan ilustración cuando falta foto.
- [x] Portadas de eventos: ilustraciones locales por categoría y título cuando falta o falla la foto original.
- [x] Recomendaciones por búsquedas: consultas estables y fichas abiertas desde resultados alimentan intereses privados, reutilizan controles de pausa/borrado y el orden de Para vos; Rayuela y apertura de ficha verificados con sesión real, 14 pruebas pasan.
- [x] Top 5 por categoría: películas, artistas/discos/canciones (MusicBrainz + iTunes) y autores/libros (Open Library), tabla top_five_entries con posiciones, selector en perfil, buscador acotado por tipo y textos por categoría; verificado agregar 5 artistas, mensaje de Top lleno y perfil
- [x] Textos centralizados en src/lib/copy.ts (Top 5, verbos y estados por categoría); CulturalProfile y TasteEditor los usan
- [ ] Barrido fino de textos: quedan menciones de "película/peli" solo en contextos de cine (Betty cinéfila, listas de pelis, SEO); ListRecommendations habla de pelis porque solo se muestra en listas de cine
- [x] Onboarding de gustos también para login con Google (taste_settings.onboarding_done, sin parpadeo) y gustos iniciales sin recorte de 6
- [x] confirm()/prompt() nativos reemplazados por diálogos propios (ShareButton, ItemDrawer, lista, reporte de evento y de canción)
- [x] Ciudades normalizadas (tildes/mayúsculas/alias) con selector rápido en EventAgenda, EventForm y personalization; eventos community incluidos en "Para vos"
- [x] Avisos: caché de notificaciones por usuario; Mensajes: último mensaje real por amigo, realtime acotado al usuario y links internos con navegación del router
- [x] Saludo de Betty con tildes; recomendaciones de Betty usan solo críticas cacheadas (Parallel queda bajo demanda en MovieReviews)
- [ ] Verificar en preview: login Google → onboarding, modales de reporte/borrado en móvil, bandeja de mensajes y link compartido dentro del chat
- [x] Personalization foundation: private activity signals, weighted/decaying tastes, daily managed schedule and two-call creative budget
- [x] Mis gustos, editable chips, feedback, pause/reset/export/delete and privacy/terms; add/remove chip and pause persistence verified with requesting account
- [x] Cached Para vos on home/category tabs, varied ordering and exclusions; real cached music/movie/event recommendations and persistent rejection verified
- [x] Catalog-verified Betty cross-category connections; Moon Palace → Bocanada/Smoke/Medianeras verified and saved; detail anchor blocks implemented
- [ ] Film-high-rating → cross-category acceptance check: daily two-call creative budget reached during validation, retry after daily reset; no successful movie anchor output claimed
- [ ] Complete personalization: close-friend weighted signals, richer theme/person/place metadata, cited adaptation/mentioned-work connections, topic matching for cross-category events and full five-flow verification; these requested pieces are not implemented yet
- [ ] New-account onboarding verification: initial five/six tastes and Top 5 prompts implemented, but no new real account created or hosted signup settings checked
- [x] Soundtrack persisted albums/tracks, progressive fill and daily schedule, platform searches, music/back links, existing audio previews, community suggestions/reports and profile collection; Midnight in Paris album/tracks and round trip verified
- [ ] Soundtrack completeness: IMDb/Wikidata association, cited web song lookup through Betty, album report control and reliable release-year correction; source fallback verified but provider reports an inconsistent album date
- [x] Similar blocks on movie/book/music details, lazy three-day cache, verified catalog results, origin estimates labeled, Argentina-first region alternatives; Hollywood horror and Argentine movie scenarios verified
- [ ] Similar completeness: author/artist detail pages and additional book/English-band live checks; music catalog sometimes returns fewer verified matches and MusicBrainz returns 503
- [x] Unified Compartir on details, feeds, lists, movie reviews, profiles, Betty and discovery; friend selection, WhatsApp/copy/native, undo and permission checks; real sender chat card, WhatsApp message/copy and private-list warning verified
- [x] Stable public share pages with server-rendered metadata, 1200x630 branded cover, invitation attribution storage and share counts; signed-out public page verified
- [ ] Sharing remaining checks: recipient session, native share menu and actual WhatsApp preview require a recipient/device and publishing; add inviter greeting/friend suggestion and cultural-review sharing
- [x] Social navigation: four tabs, Avisos/Mensajes/Amigos, private friend messaging, sharing and count
- [ ] Social completion: message requests, reactions/typing, grouped content notifications, block/mute/report, QR and mutual-friend suggestions; remaining implementation not verified
- [x] Saved Betty result routes and history; cached/session screen state; app/browser Back verified
- [ ] Verify native phone back gesture and fresh AI round trip plus scroll equality; no native-device session
- [x] Event images/fallbacks, private community photo upload, stored cinema venues, cinema sections and cached commercial TMDB listings
- [ ] Confirm new scheduled cinema research results across every venue; Village/current chain URL pending confirmation
- [x] Spotify: user chose title/artist search links instead of direct catalog/Odesli integration; stage two stays unimplemented pending confirmation
- [x] Real cited movie criticism and Betty enrichment; Stalker source links verified, scores omitted unless explicitly found
- [x] Show each friend movie poster beside its feed title


## Cultural expansion requested November 10, 2026
- [ ] New home header and category search: Inicio / Cine / Música / Libros / Eventos with user's exact questions and contextual Betty
- [ ] Category mini feeds with saved items, likes/comments/sharing; scheduled collection only, persisted daily news/releases/recommendations and six-hour events with daily expiry cleanup
- [ ] Show actual update time; retain prior data on source failure; never fetch external feed sources on screen open
- [ ] Replace standalone Arte with Eventos; preserve legacy art items without exposing art creation/search/discovery/Top 5
- [ ] Eventos: official Buenos Aires agenda first, city preference and location consent, date/interest/free-paid filters, list/calendar, verified details and directions
- [ ] Eventos: community submissions/reports, Voy / Me interesa, personal agenda, friend activity/invitations and verified Betty suggestions
- [ ] Home tabs Todo / Cine / Música / Libros / Eventos, remembered selection and category-filtered friends activity; preserve existing cinema flows
- [ ] Books: verified search, full details, list panels, personal state and category Top 5
- [ ] Music: album details, tracklist, available audio previews, personal state and category Top 5
- [ ] Cultural news/events with cited short summaries and persistent cache; backend web search requires an authorized connection
- [ ] Category-specific Sorprendeme, Descubrir and verified Betty recommendations, including list context
- [ ] Run cinema regressions and authenticated mobile checks at each stage


- [x] Replace Betty introduction with user's literal greeting ending “negri.”

- [x] Soften the overly bright orange to a restrained muted copper accent

- [x] Show first movie posters below list names on home and profile (home shows three real posters)

- [x] Public/private list owner controls saved and reloaded; existing collaborator invitations retained
- [ ] Verify invitation read/collaborate end-to-end with a second account; blocker: no second authorized test session
- [ ] Verify friends' additions and ratings end-to-end; implementation and realtime configured, blocker: requesting account has no accepted friends

- [x] Apply author-cinema typography, softened copper, numbered Top 5 and paper review tickets; mobile home and list verified

- [x] Betty inside existing lists uses their movies, ratings and critiques; live recommendation verified
- [ ] Enrich Betty and movie pages with cited criticism, verified ratings, Criterion confirmation and related books; cache movie research for several days, tolerate independent source failures, verify suggested titles with TMDB
- [ ] Configure valid OMDb credentials and backend web-search source; blocked: web-search connection declined and OMDb update stopped; key instructions delivered

- [x] Argentine localization: es-AR/AR TMDB, Argentine cinema priority and home collection, viewing providers in Argentina
- [x] Add Sorprendeme on Inicio and swipe/button discovery with filters, watched/queued/passed exclusions and undo (pointer handlers verified; native touch swipe remains unverified)
- [x] Optional popcorn ratings preference in profile (saved after reload)

- [x] Add Buscar/Descubrir/Betty modes, verified natural-language recommendations, refinements, pending-list actions, feedback and saved Betty history (live request and follow-up verified)

- [x] Adjust movie interactions: list poster opens quick sheet; sheet title opens full detail and Back restores sheet; personal watched/rating/review/favorite controls outside lists. Mobile navigation and favorite persistence verified.

- [x] Review uploaded TMDB Daily ID Exports documentation: ID-only exports do not replace API credentials or full movie details
- [x] Review TMDB image URL documentation: current poster/backdrop URLs already combine image base, size and returned path

- [x] Replace TMDB key securely; API and authenticated mobile UI verified with Stalker and Tarkovski filmography
- [ ] Expand to BUTACAPP: only Inicio/Buscar/Perfil fixed navigation; lists and friends inside home/profile; poster-mosaic home
- [ ] Build “En qué andan” friends feed: newest-first infinite loading, pull-to-refresh, likes, replies, activity filter and clear friend-search empty state
- [ ] Apply intuitive UX: labeled large controls, visible back navigation, one primary action, confirmations with undo and username-only profile onboarding
- [ ] Add social profiles: username, bio, photo, reorderable top 5, profile tabs and viewing statistics
- [ ] Add friends: member search, requests/acceptance, profiles and privacy-aware activity
- [ ] Add list visibility (private/friends/public), friend collaborator invitations and comments on lists/reviews/friend profiles
- [x] Implement movie detail: official YouTube trailer, Spanish/English synopsis, 8 cast members, direct list entry and inline list activity; live TMDB UI verified
- [x] Apply quiet Letterboxd direction: blue-gray near-black surfaces, DM Sans + Newsreader, sole amber accent, subtle posters and transitions
- [x] Align filmographies and suggestion rows with the quiet minimal movie-page style (live TMDB checks blocked below)
- [x] Add member-only AI Gateway recommendations from a description and the list's movies/ratings; real request returned five recommendations. Direct additions require catalog resolution; unavailable titles link to search.
- [x] Simplify the visual style: quieter dark surfaces, unframed list covers, discreet navigation and minimal search controls
- [x] Refine the interface toward an indie/cult film festival aesthetic inspired by Letterboxd

- [ ] Movie catalogue and director search: implemented; director-search verification pending
- [x] Movie synopsis, cast, filmographies and suggestions: real TMDB content verified through authenticated mobile UI
- [x] Access movie pages from search results or a list item's title; direct IMDb fallback available
- [x] Ratings 1–10 shown as stars + one written review per user per item (persisted after reload)
- [x] Explain the native iOS/App Store path and its requirements (not just home-screen installation)
- [x] Direct IMDb access, including when internal detail fetching fails
- [ ] External IMDb/Rotten Tomatoes/Metacritic scores blocked by rejected OMDb key; TMDB key now works
- [x] Autor/artista en ficha de libro/música abre su perfil con obra (como directores)
- [x] Similares visibles automáticamente en libros y música
- [x] Cruce de universos "Porque viste/escuchaste/leíste…" en fichas
- [ ] Autores similares en página de autor; sección latina en libros; descripciones de libros en español
