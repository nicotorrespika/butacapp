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
