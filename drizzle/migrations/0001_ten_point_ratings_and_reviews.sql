ALTER TABLE public.ratings ADD COLUMN score_10 smallint;
ALTER TABLE public.ratings ADD COLUMN review text NOT NULL DEFAULT '';
UPDATE public.ratings SET score_10 = score * 2;
ALTER TABLE public.ratings ADD CONSTRAINT ratings_score_10_range CHECK (score_10 BETWEEN 1 AND 10);
ALTER TABLE public.ratings ADD CONSTRAINT ratings_review_length CHECK (char_length(review) <= 3000);
COMMENT ON COLUMN public.ratings.score IS 'DEPRECATED: compatibility field; use score_10 for ratings on a 1 to 10 scale';
CREATE OR REPLACE FUNCTION public.sync_rating_scales() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.score_10 IS NULL THEN
    NEW.score_10 := NEW.score * 2;
  END IF;
  NEW.score := greatest(1, least(5, ceil(NEW.score_10::numeric / 2)::smallint));
  RETURN NEW;
END;
$$;
CREATE TRIGGER sync_rating_scales BEFORE INSERT OR UPDATE ON public.ratings FOR EACH ROW EXECUTE FUNCTION public.sync_rating_scales();