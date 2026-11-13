DROP POLICY IF EXISTS follows_read ON public.user_follows;
CREATE POLICY follows_read ON public.user_follows FOR SELECT TO authenticated
USING (follower_id = auth.uid() OR followed_id = auth.uid());