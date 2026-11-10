CREATE TABLE public.movie_entries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 source text NOT NULL, external_id text NOT NULL, title text NOT NULL,
 year integer, image_url text, genres text[] NOT NULL DEFAULT '{}',
 watched boolean NOT NULL DEFAULT false, favorite boolean NOT NULL DEFAULT false,
 score_10 integer CHECK(score_10 BETWEEN 1 AND 10), review text NOT NULL DEFAULT '' CHECK(length(review)<=3000),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id,source,external_id)
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.movie_entries TO authenticated;
GRANT ALL ON public.movie_entries TO service_role;
ALTER TABLE public.movie_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY entries_read ON public.movie_entries FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.are_friends(auth.uid(),user_id));
CREATE POLICY entries_insert ON public.movie_entries FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid());
CREATE POLICY entries_update ON public.movie_entries FOR UPDATE TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
CREATE POLICY entries_delete ON public.movie_entries FOR DELETE TO authenticated USING(user_id=auth.uid());
INSERT INTO public.movie_entries(user_id,source,external_id,title,year,image_url,genres,watched,score_10,review) SELECT user_id,source,external_id,title,year,image_url,genres,true,score_10,review FROM public.watched_movies ON CONFLICT(user_id,source,external_id) DO NOTHING;
CREATE INDEX movie_entries_catalog ON public.movie_entries(source,external_id);