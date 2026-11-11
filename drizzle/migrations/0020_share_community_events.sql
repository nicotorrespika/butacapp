CREATE OR REPLACE FUNCTION public.share_access(k text, cid text, viewer uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$ BEGIN
 IF k IN ('movie','culture') THEN RETURN true; END IF;
 IF k='list' THEN RETURN public.can_read_list(cid::uuid,viewer); END IF;
 IF k='profile' THEN RETURN EXISTS(SELECT 1 FROM public.profiles WHERE id=cid::uuid AND (share_visibility='public' OR id=viewer OR public.are_friends(id,viewer))); END IF;
 IF k='review' THEN RETURN EXISTS(SELECT 1 FROM public.movie_entries e JOIN public.profiles p ON p.id=e.user_id WHERE e.id=cid::uuid AND (p.share_visibility='public' OR e.user_id=viewer OR public.are_friends(e.user_id,viewer))); END IF;
 IF k='activity' THEN RETURN EXISTS(SELECT 1 FROM public.activity a WHERE a.id=cid::uuid AND (a.user_id=viewer OR public.are_friends(a.user_id,viewer)) AND (a.list_id IS NULL OR public.can_read_list(a.list_id,viewer))); END IF;
 IF k='event' THEN RETURN EXISTS(SELECT 1 FROM public.cultural_events WHERE id=cid::uuid AND (verified OR community)); END IF;
 IF k='feed' THEN RETURN EXISTS(SELECT 1 FROM public.culture_feed WHERE id=cid::uuid); END IF;
 IF k='betty' THEN RETURN EXISTS(SELECT 1 FROM public.betty_history h WHERE id=cid::uuid AND (user_id=viewer OR public.are_friends(user_id,viewer))); END IF;
 RETURN false; EXCEPTION WHEN invalid_text_representation THEN RETURN false; END $function$;

CREATE OR REPLACE FUNCTION public.public_share_summary(k text, cid text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$ DECLARE result jsonb; BEGIN
 IF k='list' THEN SELECT jsonb_build_object('title',name,'description',description,'image',(SELECT image_url FROM public.list_items WHERE list_id=l.id ORDER BY created_at LIMIT 1),'year',null,'category','Lista') INTO result FROM public.lists l WHERE id=cid::uuid AND visibility='public';
 ELSIF k='profile' THEN SELECT jsonb_build_object('title',display_name,'description',bio,'image',avatar_url,'year',null,'category','Perfil') INTO result FROM public.profiles WHERE (id::text=cid OR username=cid) AND share_visibility='public';
 ELSIF k='review' THEN SELECT jsonb_build_object('title',e.title,'description',left(e.review,280),'image',e.image_url,'year',e.year,'category','Reseña') INTO result FROM public.movie_entries e JOIN public.profiles p ON p.id=e.user_id WHERE e.id=cid::uuid AND p.share_visibility='public';
 ELSIF k='event' THEN SELECT jsonb_build_object('title',title,'description',left(description,280),'image',CASE WHEN image_url LIKE 'https://%' THEN image_url ELSE null END,'year',extract(year from starts_at),'category','Evento') INTO result FROM public.cultural_events WHERE id=cid::uuid AND (verified OR community);
 ELSIF k='feed' THEN SELECT jsonb_build_object('title',title,'description',left(summary,280),'image',image_url,'year',null,'category','Novedad') INTO result FROM public.culture_feed WHERE id=cid::uuid;
 END IF; RETURN result; EXCEPTION WHEN invalid_text_representation THEN RETURN null; END $function$;