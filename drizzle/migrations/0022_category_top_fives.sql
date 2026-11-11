CREATE TABLE public.top_five_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('movie','artist','album','song','author','book')),
  position INT NOT NULL CHECK (position BETWEEN 1 AND 5),
  source TEXT NOT NULL,
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  creator TEXT,
  year INT,
  image_url TEXT,
  external_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind, position),
  UNIQUE (user_id, kind, source, external_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.top_five_entries TO authenticated;
GRANT ALL ON public.top_five_entries TO service_role;
ALTER TABLE public.top_five_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Top fives are readable by members" ON public.top_five_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users add their own top fives" ON public.top_five_entries FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update their own top fives" ON public.top_five_entries FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete their own top fives" ON public.top_five_entries FOR DELETE TO authenticated USING (user_id = auth.uid());
INSERT INTO public.top_five_entries (user_id, kind, position, source, external_id, title, creator, year, image_url)
SELECT p.id, 'movie', t.ord::int, t.e->>'source', t.e->>'externalId', t.e->>'title', t.e->>'creator', NULLIF(t.e->>'year','')::int, t.e->>'imageUrl'
FROM public.profiles p,
LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(p.top_five)='array' THEN p.top_five ELSE '[]'::jsonb END) WITH ORDINALITY t(e, ord)
WHERE t.ord <= 5 AND t.e->>'source' IS NOT NULL AND t.e->>'externalId' IS NOT NULL
ON CONFLICT DO NOTHING;
INSERT INTO public.top_five_entries (user_id, kind, position, source, external_id, title, creator, year, image_url)
SELECT p.id, CASE g.key WHEN 'music' THEN 'album' ELSE 'book' END, t.ord::int, t.e->>'source', t.e->>'externalId', t.e->>'title', t.e->>'creator', NULLIF(t.e->>'year','')::int, t.e->>'imageUrl'
FROM public.profiles p,
LATERAL jsonb_each(CASE WHEN jsonb_typeof(p.cultural_top_five)='object' THEN p.cultural_top_five ELSE '{}'::jsonb END) g,
LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(g.value)='array' THEN g.value ELSE '[]'::jsonb END) WITH ORDINALITY t(e, ord)
WHERE g.key IN ('music','book') AND t.ord <= 5 AND t.e->>'source' IS NOT NULL AND t.e->>'externalId' IS NOT NULL
ON CONFLICT DO NOTHING;