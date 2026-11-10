ALTER TABLE public.direct_messages ADD COLUMN shared_card jsonb;
ALTER TABLE public.profiles ADD COLUMN share_visibility text NOT NULL DEFAULT 'private' CHECK (share_visibility IN ('private','public'));
CREATE TABLE public.content_shares (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL,kind text NOT NULL CHECK(kind IN ('movie','culture','event','list','profile','review','activity','feed','betty')),content_id text NOT NULL CHECK(length(content_id) BETWEEN 1 AND 200),channel text NOT NULL CHECK(channel IN ('chat','whatsapp','copy','native')),created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT ON public.content_shares TO authenticated; GRANT ALL ON public.content_shares TO service_role;
ALTER TABLE public.content_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY shares_own_read ON public.content_shares FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY shares_own_insert ON public.content_shares FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid());
CREATE TABLE public.share_referrals (user_id uuid PRIMARY KEY,invited_by uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),CHECK(user_id<>invited_by));
GRANT SELECT,INSERT ON public.share_referrals TO authenticated; GRANT ALL ON public.share_referrals TO service_role;
ALTER TABLE public.share_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY referrals_own_read ON public.share_referrals FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY referrals_own_insert ON public.share_referrals FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid() AND EXISTS(SELECT 1 FROM public.profiles WHERE id=invited_by));
CREATE OR REPLACE FUNCTION public.share_access(k text,cid text,viewer uuid) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF k IN ('movie','culture') THEN RETURN true; END IF;
 IF k='list' THEN RETURN public.can_read_list(cid::uuid,viewer); END IF;
 IF k='profile' THEN RETURN EXISTS(SELECT 1 FROM public.profiles WHERE id=cid::uuid AND (share_visibility='public' OR id=viewer OR public.are_friends(id,viewer))); END IF;
 IF k='review' THEN RETURN EXISTS(SELECT 1 FROM public.movie_entries e JOIN public.profiles p ON p.id=e.user_id WHERE e.id=cid::uuid AND (p.share_visibility='public' OR e.user_id=viewer OR public.are_friends(e.user_id,viewer))); END IF;
 IF k='activity' THEN RETURN EXISTS(SELECT 1 FROM public.activity a WHERE a.id=cid::uuid AND (a.user_id=viewer OR public.are_friends(a.user_id,viewer)) AND (a.list_id IS NULL OR public.can_read_list(a.list_id,viewer))); END IF;
 IF k='event' THEN RETURN EXISTS(SELECT 1 FROM public.cultural_events WHERE id=cid::uuid AND verified); END IF;
 IF k='feed' THEN RETURN EXISTS(SELECT 1 FROM public.culture_feed WHERE id=cid::uuid); END IF;
 IF k='betty' THEN RETURN EXISTS(SELECT 1 FROM public.betty_history h WHERE id=cid::uuid AND (user_id=viewer OR public.are_friends(user_id,viewer))); END IF;
 RETURN false; EXCEPTION WHEN invalid_text_representation THEN RETURN false; END $$;
REVOKE ALL ON FUNCTION public.share_access(text,text,uuid) FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.share_access(text,text,uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.validate_shared_card() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF NEW.shared_card IS NOT NULL THEN
 IF jsonb_typeof(NEW.shared_card)<>'object' OR length(NEW.shared_card::text)>5000 OR NOT public.share_access(NEW.shared_card->>'kind',NEW.shared_card->>'id',NEW.sender_id) OR NOT public.share_access(NEW.shared_card->>'kind',NEW.shared_card->>'id',NEW.recipient_id) THEN RAISE EXCEPTION 'No permission to share this content'; END IF;
 END IF; RETURN NEW; END $$;
CREATE TRIGGER shared_card_access BEFORE INSERT ON public.direct_messages FOR EACH ROW EXECUTE FUNCTION public.validate_shared_card();
CREATE OR REPLACE FUNCTION public.protect_message_update() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN IF NEW.sender_id IS DISTINCT FROM OLD.sender_id OR NEW.recipient_id IS DISTINCT FROM OLD.recipient_id OR NEW.body IS DISTINCT FROM OLD.body OR NEW.shared_url IS DISTINCT FROM OLD.shared_url OR NEW.shared_title IS DISTINCT FROM OLD.shared_title OR NEW.shared_card IS DISTINCT FROM OLD.shared_card OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN RAISE EXCEPTION 'Only read state can be updated'; END IF; RETURN NEW; END $$;
CREATE POLICY messages_sender_undo ON public.direct_messages FOR DELETE TO authenticated USING(sender_id=auth.uid() AND read_at IS NULL AND created_at>now()-interval '2 minutes');
GRANT DELETE ON public.direct_messages TO authenticated;
CREATE OR REPLACE FUNCTION public.public_share_summary(k text,cid text) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$ DECLARE result jsonb; BEGIN
 IF k='list' THEN SELECT jsonb_build_object('title',name,'description',description,'image',(SELECT image_url FROM public.list_items WHERE list_id=l.id ORDER BY created_at LIMIT 1),'year',null,'category','Lista') INTO result FROM public.lists l WHERE id=cid::uuid AND visibility='public';
 ELSIF k='profile' THEN SELECT jsonb_build_object('title',display_name,'description',bio,'image',avatar_url,'year',null,'category','Perfil') INTO result FROM public.profiles WHERE (id::text=cid OR username=cid) AND share_visibility='public';
 ELSIF k='review' THEN SELECT jsonb_build_object('title',e.title,'description',left(e.review,280),'image',e.image_url,'year',e.year,'category','Reseña') INTO result FROM public.movie_entries e JOIN public.profiles p ON p.id=e.user_id WHERE e.id=cid::uuid AND p.share_visibility='public';
 ELSIF k='event' THEN SELECT jsonb_build_object('title',title,'description',left(description,280),'image',CASE WHEN image_url LIKE 'https://%' THEN image_url ELSE null END,'year',extract(year from starts_at),'category','Evento') INTO result FROM public.cultural_events WHERE id=cid::uuid AND verified;
 ELSIF k='feed' THEN SELECT jsonb_build_object('title',title,'description',left(summary,280),'image',image_url,'year',null,'category','Novedad') INTO result FROM public.culture_feed WHERE id=cid::uuid;
 END IF; RETURN result; EXCEPTION WHEN invalid_text_representation THEN RETURN null; END $$;
REVOKE ALL ON FUNCTION public.public_share_summary(text,text) FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.public_share_summary(text,text) TO anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION public.shared_betty_results(hid uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT movies FROM public.betty_history WHERE id=hid AND (user_id=auth.uid() OR EXISTS(SELECT 1 FROM public.direct_messages WHERE recipient_id=auth.uid() AND shared_card->>'kind'='betty' AND shared_card->>'id'=hid::text)) $$;
REVOKE ALL ON FUNCTION public.shared_betty_results(uuid) FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.shared_betty_results(uuid) TO authenticated;