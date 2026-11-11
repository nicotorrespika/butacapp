CREATE OR REPLACE FUNCTION public.claim_personalization(uid uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF auth.uid() IS NOT NULL AND auth.uid()<>uid THEN RAISE EXCEPTION 'Forbidden'; END IF;
 IF EXISTS(SELECT 1 FROM taste_settings WHERE user_id=uid AND(paused OR NOT recording_enabled)) THEN RETURN false; END IF;
 INSERT INTO personalization_jobs(user_id) VALUES(uid) ON CONFLICT(user_id) DO NOTHING;
 UPDATE personalization_jobs SET lease_until=now()+interval '5 minutes' WHERE user_id=uid AND lease_until<now() AND paused_reason IS NULL;
 RETURN FOUND;
END; $$;
CREATE OR REPLACE FUNCTION public.reserve_taste_ai(uid uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF auth.uid() IS NOT NULL AND auth.uid()<>uid THEN RAISE EXCEPTION 'Forbidden'; END IF;
 IF EXISTS(SELECT 1 FROM taste_settings WHERE user_id=uid AND(paused OR NOT recording_enabled)) THEN RETURN false; END IF;
 UPDATE personalization_jobs SET ai_calls=CASE WHEN ai_day=current_date THEN ai_calls+1 ELSE 1 END,ai_day=current_date WHERE user_id=uid AND paused_reason IS NULL AND(ai_day<>current_date OR ai_calls<2);
 RETURN FOUND;
END; $$;
REVOKE ALL ON FUNCTION public.reserve_taste_ai(uuid) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.reserve_taste_ai(uuid) TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.resume_taste_job() RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Forbidden'; END IF;
 UPDATE personalization_jobs SET paused_reason=NULL,pending=true WHERE user_id=auth.uid() AND NOT terminal_denial;
 RETURN FOUND;
END; $$;
REVOKE ALL ON FUNCTION public.resume_taste_job() FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.resume_taste_job() TO authenticated;
CREATE OR REPLACE FUNCTION public.taste_chip_changed() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF EXISTS(SELECT 1 FROM taste_settings WHERE user_id=NEW.user_id AND(paused OR NOT recording_enabled)) THEN RETURN NULL; END IF;
 INSERT INTO personalization_jobs(user_id) VALUES(NEW.user_id) ON CONFLICT(user_id) DO UPDATE SET pending=true,updated_at=now();
 RETURN NULL;
END; $$;
CREATE TRIGGER taste_chip_change AFTER INSERT OR UPDATE ON public.taste_chips FOR EACH ROW EXECUTE FUNCTION public.taste_chip_changed();