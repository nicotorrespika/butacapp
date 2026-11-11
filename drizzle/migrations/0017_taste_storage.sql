CREATE TABLE public.taste_settings(user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,paused boolean NOT NULL DEFAULT false,recording_enabled boolean NOT NULL DEFAULT true,reset_at timestamptz NOT NULL DEFAULT '1970-01-01',onboarding_done boolean NOT NULL DEFAULT false,updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT,UPDATE,DELETE ON public.taste_settings TO authenticated; GRANT ALL ON public.taste_settings TO service_role;
ALTER TABLE public.taste_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY taste_settings_own ON public.taste_settings TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
CREATE TABLE public.taste_signals(user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,signal_key text NOT NULL,category text NOT NULL,source text NOT NULL DEFAULT '',external_id text NOT NULL DEFAULT '',title text NOT NULL DEFAULT '',tags text[] NOT NULL DEFAULT '{}',weight numeric NOT NULL DEFAULT 1,excluded boolean NOT NULL DEFAULT false,reason text,occurred_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(user_id,signal_key));
GRANT SELECT,INSERT,UPDATE,DELETE ON public.taste_signals TO authenticated; GRANT ALL ON public.taste_signals TO service_role;
ALTER TABLE public.taste_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY taste_signals_own ON public.taste_signals TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
CREATE TABLE public.taste_chips(user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,label text NOT NULL,weight numeric NOT NULL DEFAULT 1,manual boolean NOT NULL DEFAULT false,suppressed boolean NOT NULL DEFAULT false,updated_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(user_id,label));
GRANT SELECT,INSERT,UPDATE,DELETE ON public.taste_chips TO authenticated; GRANT ALL ON public.taste_chips TO service_role;
ALTER TABLE public.taste_chips ENABLE ROW LEVEL SECURITY;
CREATE POLICY taste_chips_own ON public.taste_chips TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
CREATE TABLE public.taste_recommendations(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,category text NOT NULL,source text NOT NULL,external_id text NOT NULL,title text NOT NULL,creator text,year integer,image_url text,external_url text,tags text[] NOT NULL DEFAULT '{}',reason text NOT NULL,anchor_source text NOT NULL DEFAULT '',anchor_id text NOT NULL DEFAULT '',anchor_title text,score numeric NOT NULL DEFAULT 0,exploration boolean NOT NULL DEFAULT false,evidence_url text,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(user_id,source,external_id,anchor_source,anchor_id));
GRANT SELECT,DELETE ON public.taste_recommendations TO authenticated; GRANT ALL ON public.taste_recommendations TO service_role;
ALTER TABLE public.taste_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY taste_recommendations_read ON public.taste_recommendations FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY taste_recommendations_delete ON public.taste_recommendations FOR DELETE TO authenticated USING(user_id=auth.uid());
CREATE TABLE public.personalization_jobs(user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,pending boolean NOT NULL DEFAULT true,lease_until timestamptz NOT NULL DEFAULT '1970-01-01',ai_day date NOT NULL DEFAULT current_date,ai_calls integer NOT NULL DEFAULT 0,paused_reason text,terminal_denial boolean NOT NULL DEFAULT false,updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.personalization_jobs TO authenticated; GRANT ALL ON public.personalization_jobs TO service_role;
ALTER TABLE public.personalization_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY personalization_jobs_own ON public.personalization_jobs FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE OR REPLACE FUNCTION public.rebuild_tastes(uid uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE cutoff timestamptz; is_paused boolean; recording boolean;
BEGIN
 IF auth.uid() IS NOT NULL AND auth.uid()<>uid THEN RAISE EXCEPTION 'Forbidden'; END IF;
 SELECT reset_at,paused,recording_enabled INTO cutoff,is_paused,recording FROM taste_settings WHERE user_id=uid;
 IF is_paused OR recording=false THEN RETURN; END IF;
 cutoff:=coalesce(cutoff,'1970-01-01');
 DELETE FROM taste_chips WHERE user_id=uid AND NOT manual AND NOT suppressed;
 INSERT INTO taste_chips(user_id,label,weight)
 SELECT uid,lower(trim(tag)),sum(s.weight*power(0.5,greatest(0,extract(epoch FROM(now()-s.occurred_at))/86400)/90)) FROM taste_signals s CROSS JOIN LATERAL unnest(s.tags) tag WHERE s.user_id=uid AND s.occurred_at>=cutoff AND length(trim(tag)) BETWEEN 2 AND 80 GROUP BY lower(trim(tag))
 ON CONFLICT(user_id,label) DO UPDATE SET weight=EXCLUDED.weight,updated_at=now() WHERE NOT taste_chips.manual AND NOT taste_chips.suppressed;
END; $$;
REVOKE ALL ON FUNCTION public.rebuild_tastes(uuid) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.rebuild_tastes(uuid) TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.record_taste_signal(k text,cat text,src text,eid text,work_title text,work_tags text[],points numeric,is_excluded boolean DEFAULT false,why text DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid();
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Forbidden'; END IF;
 IF length(k)>300 OR length(work_title)>300 OR cardinality(work_tags)>30 OR cat NOT IN('movie','music','book','event','all') THEN RAISE EXCEPTION 'Invalid signal'; END IF;
 IF EXISTS(SELECT 1 FROM taste_settings WHERE user_id=uid AND(paused OR NOT recording_enabled)) THEN RETURN; END IF;
 INSERT INTO taste_signals(user_id,signal_key,category,source,external_id,title,tags,weight,excluded,reason) VALUES(uid,k,cat,left(src,80),left(eid,200),work_title,work_tags,greatest(-10,least(10,points)),is_excluded,left(why,120)) ON CONFLICT(user_id,signal_key) DO UPDATE SET tags=EXCLUDED.tags,weight=EXCLUDED.weight,excluded=EXCLUDED.excluded,reason=EXCLUDED.reason,occurred_at=now();
 PERFORM rebuild_tastes(uid);
 INSERT INTO personalization_jobs(user_id) VALUES(uid) ON CONFLICT(user_id) DO UPDATE SET pending=true,updated_at=now();
END; $$;
REVOKE ALL ON FUNCTION public.record_taste_signal(text,text,text,text,text,text[],numeric,boolean,text) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.record_taste_signal(text,text,text,text,text,text[],numeric,boolean,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.clear_my_tastes(disable_recording boolean DEFAULT false) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Forbidden'; END IF;
 INSERT INTO taste_settings(user_id,reset_at,recording_enabled,paused,onboarding_done) VALUES(uid,now(),NOT disable_recording,disable_recording,true) ON CONFLICT(user_id) DO UPDATE SET reset_at=now(),recording_enabled=NOT disable_recording,paused=disable_recording,updated_at=now();
 DELETE FROM taste_signals WHERE user_id=uid; DELETE FROM taste_chips WHERE user_id=uid; DELETE FROM taste_recommendations WHERE user_id=uid; DELETE FROM personalization_jobs WHERE user_id=uid;
END; $$;
REVOKE ALL ON FUNCTION public.clear_my_tastes(boolean) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.clear_my_tastes(boolean) TO authenticated;
CREATE OR REPLACE FUNCTION public.claim_personalization(uid uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF auth.uid() IS NOT NULL AND auth.uid()<>uid THEN RAISE EXCEPTION 'Forbidden'; END IF;
 IF EXISTS(SELECT 1 FROM taste_settings WHERE user_id=uid AND(paused OR NOT recording_enabled)) THEN RETURN false; END IF;
 INSERT INTO personalization_jobs(user_id) VALUES(uid) ON CONFLICT(user_id) DO NOTHING;
 UPDATE personalization_jobs SET lease_until=now()+interval '5 minutes',ai_calls=CASE WHEN ai_day=current_date THEN ai_calls+1 ELSE 1 END,ai_day=current_date WHERE user_id=uid AND lease_until<now() AND paused_reason IS NULL AND(ai_day<>current_date OR ai_calls<2);
 RETURN FOUND;
END; $$;
REVOKE ALL ON FUNCTION public.claim_personalization(uuid) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.claim_personalization(uuid) TO authenticated,service_role;
CREATE INDEX taste_signals_recent ON public.taste_signals(user_id,occurred_at DESC);