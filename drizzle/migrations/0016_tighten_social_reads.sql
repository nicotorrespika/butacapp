DROP POLICY IF EXISTS feed_comments_read ON public.culture_feed_comments;
CREATE POLICY feed_comments_read ON public.culture_feed_comments FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.are_friends(auth.uid(), user_id));
DROP POLICY IF EXISTS feed_likes_read ON public.culture_feed_likes;
CREATE POLICY feed_likes_read ON public.culture_feed_likes FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.are_friends(auth.uid(), user_id));

DROP POLICY IF EXISTS "Profiles visible to signed-in users" ON public.profiles;
CREATE POLICY "Profiles visible to related users" ON public.profiles FOR SELECT TO authenticated USING (
  id = auth.uid() OR share_visibility = 'public'
  OR EXISTS (SELECT 1 FROM public.friendships f WHERE (f.sender_id = auth.uid() AND f.receiver_id = profiles.id) OR (f.receiver_id = auth.uid() AND f.sender_id = profiles.id))
  OR EXISTS (SELECT 1 FROM public.list_members a JOIN public.list_members b ON a.list_id = b.list_id WHERE a.user_id = auth.uid() AND b.user_id = profiles.id)
);

CREATE OR REPLACE FUNCTION public.search_people(term text)
RETURNS TABLE(id uuid, display_name text, username text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.display_name, p.username, p.avatar_url FROM public.profiles p
  WHERE auth.uid() IS NOT NULL AND length(trim(term)) >= 2 AND p.id <> auth.uid()
    AND (p.username ILIKE '%' || term || '%' OR p.display_name ILIKE '%' || term || '%')
  LIMIT 20
$$;
REVOKE ALL ON FUNCTION public.search_people(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_people(text) TO authenticated;

DROP POLICY IF EXISTS event_photos_read ON storage.objects;
CREATE POLICY event_photos_read ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'event-photos' AND (
    (storage.foldername(name))[1] = (auth.uid())::text
    OR EXISTS (SELECT 1 FROM public.cultural_events e WHERE e.image_url = 'storage:' || objects.name AND (e.verified OR e.community))
  )
);