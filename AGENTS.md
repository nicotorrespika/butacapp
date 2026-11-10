<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- Data reads/writes go from the browser client straight to the database; access control lives in RLS via `is_list_member`/`is_list_owner` security-definer helpers. Why: keeps the MVP simple while every list stays private to its members.
- External media search runs only in `src/lib/search.functions.ts` (auth-required server fn) with providers in `src/server/search-providers.ts`; each provider fails independently. Why: keeps API keys server-side and one slow API never breaks search.
- Movie and person details use authenticated functions with server-only provider helpers; list additions share one hook. Why: preserves secret boundaries and consistent add behavior.
- Movie details append credits and videos in one localized TMDB request; official YouTube trailers load only on demand, and inline list activity reuses ItemDrawer. Why: avoids extra initial requests and keeps rating/comment behavior consistent.
- List recommendations use an authenticated member-checked server function, streamed Lovable AI Responses structured output, and optional TMDB resolution. Why: private list context stays server-side and unresolved suggestions never fabricate catalog entries.
- Ratings use score_10 as the canonical score and review as the per-user critique; the old score is trigger-maintained for compatibility. Why: preserves existing ratings while moving to a ten-point scale.
- Live collaboration uses Postgres realtime on `list_items`, `ratings`, `comments`, `list_members` filtered by `list_id`, invalidating React Query caches. Why: instant updates without custom sockets.
- `ratings` and `comments` carry a denormalized `list_id` set by trigger from the item. Why: enables RLS and realtime filtering per list.
- Invites: token links via `get_invite`/`accept_invite` RPCs; email invites are rows auto-claimed by `claim_email_invites` on sign-in. Why: no outbound email service required.
- Social views share browser-safe query helpers and use database-enforced visibility; the feed paginates by timestamp plus ID. Why: keeps privacy centralized and pagination stable when activities share a timestamp.
- Personal movie state lives in movie_entries, independent of list ratings; list sheet selection lives in validated URL search state. Why: favorites need not be watched and browser Back restores the selected list panel.
- Betty uses authenticated structured-output server functions, verifies exact title/year matches in TMDB and stores user-owned thread history and feedback. Why: unverified catalog entries never reach recommendations and personal tastes remain private.
- Discovery stores queued/dismissed/watched choices in personal entries and normalizes catalog IDs before exclusion; UI offers gestures plus explicit buttons. Why: cross-surface choices stay consistent without requiring gestures.
- List covers reuse a shared poster strip; friends' added-item activities resolve the author's current list rating and subscribe to RLS-filtered realtime. Why: previews and activity stay consistent without duplicating stored scores.
- Cultural catalog details use authenticated server functions and shared list sheets; personal cultural state is independent of list ratings. Why: extends music/books without changing cinema behavior.
- Cultural feeds and events read persisted records collected by managed authenticated HTTP schedules; async research run IDs and leases persist server-side. Why: screen opens incur no research calls and pending jobs survive refreshes.
- Existing cultural entries update only changed fields and immediately refresh their query cache. Why: consecutive actions must not overwrite ratings, favorites or reviews.
- Movie research verifies source URLs against returned web results, derives aggregate ratings from explicit source labels, and caches public summaries separately from movie details. Why: independent review failures must not break cinema or fabricate scores.
- Music platform buttons use clearly labeled title/artist searches unless a catalog link has been verified. Why: search URLs must never masquerade as direct album or track IDs.

- Betty result screens use saved history IDs, with per-screen React Query and session storage state; view scroll uses router restoration. Why: returning from details must not rerun recommendations or discard refinements.
- Event images resolve private community photos with signed URLs and use a category/title plate on missing or broken images. Why: image failures must not leave blank agenda cards.
- Cinema venue records drive official-link discovery and scheduled event research; commercial listings reuse persisted Argentine TMDB releases. Why: viewing the agenda must not trigger research or invent showtimes.
- Private messages are participant-readable and only recipients can change read timestamps, enforced by a trigger. Why: client edits must never alter another person’s message or recipients.
- Content sharing uses one sheet and stable public SSR summary links; narrow summary RPCs expose only explicitly public data, and chat-card triggers check both participants' access. Why: social previews must work without exposing private lists or personal history.
- Similar recommendations are lazy, cached per work for three days, and catalog-verified; movie regional discovery uses TMDB origin filters, while cultural origin estimates are labeled. Why: recommendations must not invent works or confuse Spain with Latin America.
- Soundtracks persist movie/music relationships after MusicBrainz soundtrack and iTunes catalog matches; music navigation carries the movie context, community reports hide disputed contributions. Why: returning between cinema and music stays coherent without fabricating associations.
