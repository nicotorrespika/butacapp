CREATE TABLE public.culture_jobs(key text PRIMARY KEY,lease_until timestamptz NOT NULL DEFAULT '1970-01-01',paused_reason text,run_id text,last_completed_at timestamptz);
GRANT SELECT ON public.culture_jobs TO authenticated;
GRANT ALL ON public.culture_jobs TO service_role;
ALTER TABLE public.culture_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY jobs_read_owner ON public.culture_jobs FOR SELECT TO authenticated USING(false);
CREATE FUNCTION public.acquire_culture_job(job_key text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE acquired boolean; BEGIN INSERT INTO public.culture_jobs(key) VALUES(job_key) ON CONFLICT DO NOTHING; UPDATE public.culture_jobs SET lease_until=now()+interval '5 minutes' WHERE key=job_key AND lease_until<now() AND paused_reason IS NULL; GET DIAGNOSTICS acquired=ROW_COUNT; RETURN acquired; END $$;
REVOKE ALL ON FUNCTION public.acquire_culture_job(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.acquire_culture_job(text) TO service_role;