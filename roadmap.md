# Roadmap

- [ ] Argentine localization: es-AR/AR TMDB, Argentine cinema priority and home collection, viewing providers in Argentina
- [ ] Add Sorprendeme on Inicio and swipe/button discovery with filters, watched/queued/passed exclusions and undo
- [ ] Optional popcorn ratings preference in profile

- [ ] Add Buscar/Descubrir/Betty modes, verified natural-language recommendations, refinements, pending-list actions, feedback and saved Betty history

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
