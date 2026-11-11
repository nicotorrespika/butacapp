CREATE OR REPLACE FUNCTION public.capture_taste_activity() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r jsonb; uid uuid; src text; eid text; cat text; tags text[]; w numeric; is_excluded boolean; k text; itemdata jsonb;
BEGIN
 r:=CASE WHEN TG_OP='DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
 uid:=coalesce((r->>'user_id')::uuid,(r->>'added_by')::uuid);
 IF uid IS NULL OR EXISTS(SELECT 1 FROM taste_settings WHERE user_id=uid AND(paused OR NOT recording_enabled)) THEN RETURN NULL; END IF;
 k:=TG_TABLE_NAME||':'||coalesce(r->>'id',r->>'item_id',r->>'event_id');
 IF TG_OP='DELETE' THEN DELETE FROM taste_signals WHERE user_id=uid AND signal_key=k; PERFORM rebuild_tastes(uid); RETURN NULL; END IF;
 IF TG_TABLE_NAME='ratings' THEN SELECT to_jsonb(i) INTO itemdata FROM list_items i WHERE id=(r->>'item_id')::uuid; r:=itemdata||r; END IF;
 IF TG_TABLE_NAME='event_attendance' THEN SELECT to_jsonb(e) INTO itemdata FROM cultural_events e WHERE id=(r->>'event_id')::uuid; r:=itemdata||r; END IF;
 src:=coalesce(r->>'source',CASE WHEN TG_TABLE_NAME='event_attendance' THEN 'events' ELSE '' END);
 eid:=coalesce(r->>'external_id',r->>'event_id');
 cat:=CASE WHEN TG_TABLE_NAME='movie_entries' THEN 'movie' WHEN TG_TABLE_NAME='event_attendance' THEN 'event' ELSE coalesce(r->>'media_type','movie') END;
 SELECT coalesce(array_agg(value),'{}') INTO tags FROM jsonb_array_elements_text(coalesce(r->'genres','[]'::jsonb));
 IF nullif(r->>'creator','') IS NOT NULL THEN tags:=array_append(tags,r->>'creator'); END IF;
 IF nullif(r->>'year','') IS NOT NULL THEN tags:=array_append(tags,((r->>'year')::integer/10*10)::text||'s'); END IF;
 IF TG_TABLE_NAME='event_attendance' THEN tags:=tags||ARRAY[r->>'interest',r->>'venue',r->>'city']; END IF;
 is_excluded:=coalesce((r->>'dismissed')::boolean,false) OR coalesce((r->>'watched')::boolean,false) OR coalesce((r->>'consumed')::boolean,false);
 w:=CASE WHEN coalesce((r->>'dismissed')::boolean,false) THEN -6 ELSE
 CASE WHEN coalesce((r->>'favorite')::boolean,false) THEN 8 ELSE 0 END +
 CASE WHEN coalesce((r->>'score_10')::numeric,0)>=8 THEN 6 WHEN coalesce((r->>'score_10')::numeric,5)<=3 THEN -4 ELSE 0 END +
 CASE WHEN coalesce((r->>'watched')::boolean,false) OR coalesce((r->>'consumed')::boolean,false) THEN 1 ELSE 0 END +
 CASE WHEN coalesce((r->>'queued')::boolean,false) OR TG_TABLE_NAME='list_items' THEN 3 ELSE 0 END +
 CASE WHEN TG_TABLE_NAME='event_attendance' THEN CASE WHEN r->>'status'='going' THEN 5 ELSE 3 END ELSE 0 END END;
 INSERT INTO taste_signals(user_id,signal_key,category,source,external_id,title,tags,weight,excluded) VALUES(uid,k,cat,coalesce(src,''),coalesce(eid,''),coalesce(r->>'title',''),tags,w,is_excluded)
 ON CONFLICT(user_id,signal_key) DO UPDATE SET tags=EXCLUDED.tags,weight=EXCLUDED.weight,excluded=EXCLUDED.excluded,occurred_at=now();
 PERFORM rebuild_tastes(uid);
 INSERT INTO personalization_jobs(user_id) VALUES(uid) ON CONFLICT(user_id) DO UPDATE SET pending=true,updated_at=now();
 RETURN NULL;
END; $$;
CREATE TRIGGER taste_movie_activity AFTER INSERT OR UPDATE OR DELETE ON public.movie_entries FOR EACH ROW EXECUTE FUNCTION public.capture_taste_activity();
CREATE TRIGGER taste_culture_activity AFTER INSERT OR UPDATE OR DELETE ON public.cultural_entries FOR EACH ROW EXECUTE FUNCTION public.capture_taste_activity();
CREATE TRIGGER taste_list_activity AFTER INSERT OR UPDATE OR DELETE ON public.list_items FOR EACH ROW EXECUTE FUNCTION public.capture_taste_activity();
CREATE TRIGGER taste_rating_activity AFTER INSERT OR UPDATE OR DELETE ON public.ratings FOR EACH ROW EXECUTE FUNCTION public.capture_taste_activity();
CREATE TRIGGER taste_event_activity AFTER INSERT OR UPDATE OR DELETE ON public.event_attendance FOR EACH ROW EXECUTE FUNCTION public.capture_taste_activity();
CREATE OR REPLACE FUNCTION public.capture_top_tastes() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE work jsonb;
BEGIN
 IF EXISTS(SELECT 1 FROM taste_settings WHERE user_id=NEW.id AND(paused OR NOT recording_enabled)) THEN RETURN NULL; END IF;
 DELETE FROM taste_signals WHERE user_id=NEW.id AND signal_key LIKE 'top:%';
 FOR work IN SELECT value FROM jsonb_array_elements(NEW.top_five) UNION ALL SELECT value FROM jsonb_array_elements(coalesce(NEW.cultural_top_five->'music','[]')) UNION ALL SELECT value FROM jsonb_array_elements(coalesce(NEW.cultural_top_five->'book','[]')) LOOP
 INSERT INTO taste_signals(user_id,signal_key,category,source,external_id,title,tags,weight) VALUES(NEW.id,'top:'||coalesce(work->>'source','')||':'||coalesce(work->>'externalId',''),coalesce(work->>'mediaType','movie'),coalesce(work->>'source',''),coalesce(work->>'externalId',''),coalesce(work->>'title',''),array_remove(ARRAY[work->>'creator',CASE WHEN nullif(work->>'year','') IS NOT NULL THEN ((work->>'year')::integer/10*10)::text||'s' END],NULL),10) ON CONFLICT(user_id,signal_key) DO NOTHING;
 END LOOP;
 PERFORM rebuild_tastes(NEW.id);
 INSERT INTO personalization_jobs(user_id) VALUES(NEW.id) ON CONFLICT(user_id) DO UPDATE SET pending=true;
 RETURN NULL;
END; $$;
CREATE TRIGGER taste_top_activity AFTER UPDATE OF top_five,cultural_top_five ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.capture_top_tastes();