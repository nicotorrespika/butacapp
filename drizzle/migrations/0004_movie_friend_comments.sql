CREATE TABLE public.movie_comments(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, source text NOT NULL, external_id text NOT NULL, body text NOT NULL CHECK(length(body) BETWEEN 1 AND 1000), created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT,DELETE ON public.movie_comments TO authenticated;
GRANT ALL ON public.movie_comments TO service_role;
ALTER TABLE public.movie_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY movie_comments_read ON public.movie_comments FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.are_friends(auth.uid(),user_id));
CREATE POLICY movie_comments_insert ON public.movie_comments FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid());
CREATE POLICY movie_comments_delete ON public.movie_comments FOR DELETE TO authenticated USING(user_id=auth.uid());
CREATE INDEX movie_comments_lookup ON public.movie_comments(source,external_id,created_at);
CREATE FUNCTION public.record_movie_entry_activity() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF TG_OP='UPDATE' AND NEW.watched IS NOT DISTINCT FROM OLD.watched AND NEW.score_10 IS NOT DISTINCT FROM OLD.score_10 AND NEW.review IS NOT DISTINCT FROM OLD.review THEN RETURN NEW; END IF;
IF NEW.watched OR NEW.score_10 IS NOT NULL OR NEW.review<>'' THEN INSERT INTO public.activity(user_id,kind,source,external_id,title,image_url,score_10,body) VALUES(NEW.user_id,CASE WHEN TG_OP='INSERT' AND NEW.watched THEN 'watched' WHEN TG_OP='UPDATE' AND NEW.watched AND NOT OLD.watched THEN 'watched' WHEN NEW.review<>'' THEN 'reviewed' ELSE 'rated' END,NEW.source,NEW.external_id,NEW.title,NEW.image_url,NEW.score_10,NEW.review); END IF; RETURN NEW; END $$;
CREATE TRIGGER movie_entry_activity AFTER INSERT OR UPDATE ON public.movie_entries FOR EACH ROW EXECUTE FUNCTION public.record_movie_entry_activity();