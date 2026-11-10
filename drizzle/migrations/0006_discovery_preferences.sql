ALTER TABLE public.movie_entries ADD COLUMN queued boolean NOT NULL DEFAULT false;
ALTER TABLE public.movie_entries ADD COLUMN dismissed boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN rating_style text NOT NULL DEFAULT 'stars' CHECK(rating_style IN ('stars','popcorn'));