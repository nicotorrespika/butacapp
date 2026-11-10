-- =========================================================
-- Watchlists colaborativas: perfiles, listas, miembros, invitaciones,
-- ítems, notas (ratings) y comentarios.
-- =========================================================

-- ---------- PROFILES ----------
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles visible to signed-in users" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'display_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'name', ''),
      split_part(COALESCE(NEW.email, 'usuario'), '@', 1)
    ),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Generic updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- LISTS ----------
CREATE TABLE public.lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 280),
  kind text NOT NULL DEFAULT 'mixed' CHECK (kind IN ('movies','music','art','mixed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lists TO authenticated;
GRANT ALL ON public.lists TO service_role;

-- ---------- LIST MEMBERS ----------
CREATE TABLE public.list_members (
  list_id uuid NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'collaborator' CHECK (role IN ('owner','collaborator')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (list_id, user_id)
);
CREATE INDEX list_members_user_idx ON public.list_members(user_id);
GRANT SELECT, DELETE ON public.list_members TO authenticated;
GRANT ALL ON public.list_members TO service_role;

-- Membership helpers (SECURITY DEFINER avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.is_list_member(_list_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.list_members WHERE list_id = _list_id AND user_id = _user_id)
$$;
CREATE OR REPLACE FUNCTION public.is_list_owner(_list_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.lists WHERE id = _list_id AND owner_id = _user_id)
$$;

ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read lists" ON public.lists
  FOR SELECT TO authenticated USING (public.is_list_member(id, auth.uid()) OR owner_id = auth.uid());
CREATE POLICY "Users create own lists" ON public.lists
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owner updates list" ON public.lists
  FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owner deletes list" ON public.lists
  FOR DELETE TO authenticated USING (owner_id = auth.uid());
CREATE TRIGGER lists_updated_at BEFORE UPDATE ON public.lists
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.list_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members see co-members" ON public.list_members
  FOR SELECT TO authenticated USING (public.is_list_member(list_id, auth.uid()));
CREATE POLICY "Owner removes members or user leaves" ON public.list_members
  FOR DELETE TO authenticated USING (
    (user_id = auth.uid() AND role <> 'owner')
    OR (public.is_list_owner(list_id, auth.uid()) AND role <> 'owner')
  );

-- Owner becomes a member automatically
CREATE OR REPLACE FUNCTION public.handle_new_list()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.list_members (list_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_list_created AFTER INSERT ON public.lists
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_list();

-- ---------- INVITES ----------
CREATE TABLE public.list_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  email text,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.list_invites TO authenticated;
GRANT ALL ON public.list_invites TO service_role;
ALTER TABLE public.list_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read invites" ON public.list_invites
  FOR SELECT TO authenticated USING (public.is_list_member(list_id, auth.uid()));
CREATE POLICY "Members create invites" ON public.list_invites
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() AND public.is_list_member(list_id, auth.uid()));
CREATE POLICY "Owner or creator deletes invites" ON public.list_invites
  FOR DELETE TO authenticated USING (created_by = auth.uid() OR public.is_list_owner(list_id, auth.uid()));

-- Public-ish preview of an invite (only via token)
CREATE OR REPLACE FUNCTION public.get_invite(_token text)
RETURNS TABLE (list_id uuid, name text, description text, kind text, owner_name text, member_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT l.id, l.name, l.description, l.kind, p.display_name,
         (SELECT count(*) FROM public.list_members m WHERE m.list_id = l.id)
  FROM public.list_invites i
  JOIN public.lists l ON l.id = i.list_id
  LEFT JOIN public.profiles p ON p.id = l.owner_id
  WHERE i.token = _token
$$;

-- Accept an invite link
CREATE OR REPLACE FUNCTION public.accept_invite(_token text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _list uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT list_id INTO _list FROM public.list_invites WHERE token = _token;
  IF _list IS NULL THEN RAISE EXCEPTION 'invite not found'; END IF;
  INSERT INTO public.list_members (list_id, user_id, role)
  VALUES (_list, auth.uid(), 'collaborator')
  ON CONFLICT DO NOTHING;
  RETURN _list;
END;
$$;

-- Join every list that invited the signed-in user's email
CREATE OR REPLACE FUNCTION public.claim_email_invites()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _email text := lower(coalesce(auth.jwt()->>'email', ''));
        _n integer;
BEGIN
  IF auth.uid() IS NULL OR _email = '' THEN RETURN 0; END IF;
  WITH ins AS (
    INSERT INTO public.list_members (list_id, user_id, role)
    SELECT DISTINCT i.list_id, auth.uid(), 'collaborator'
    FROM public.list_invites i
    WHERE lower(i.email) = _email
    ON CONFLICT DO NOTHING
    RETURNING 1
  ) SELECT count(*) INTO _n FROM ins;
  RETURN _n;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_invite(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.accept_invite(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.claim_email_invites() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_invite(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_invite(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_email_invites() TO authenticated;

-- ---------- LIST ITEMS ----------
CREATE TABLE public.list_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  media_type text NOT NULL CHECK (media_type IN ('movie','music','art')),
  source text NOT NULL,
  external_id text NOT NULL,
  title text NOT NULL,
  creator text,
  year integer,
  image_url text,
  kind_label text,
  external_url text,
  added_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  done boolean NOT NULL DEFAULT false,
  done_by uuid,
  done_at timestamptz,
  UNIQUE (list_id, source, external_id)
);
CREATE INDEX list_items_list_idx ON public.list_items(list_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.list_items TO authenticated;
GRANT ALL ON public.list_items TO service_role;
ALTER TABLE public.list_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read items" ON public.list_items
  FOR SELECT TO authenticated USING (public.is_list_member(list_id, auth.uid()));
CREATE POLICY "Members add items" ON public.list_items
  FOR INSERT TO authenticated WITH CHECK (added_by = auth.uid() AND public.is_list_member(list_id, auth.uid()));
CREATE POLICY "Members update items" ON public.list_items
  FOR UPDATE TO authenticated USING (public.is_list_member(list_id, auth.uid()))
  WITH CHECK (public.is_list_member(list_id, auth.uid()));
CREATE POLICY "Owner or adder deletes items" ON public.list_items
  FOR DELETE TO authenticated USING (added_by = auth.uid() OR public.is_list_owner(list_id, auth.uid()));

-- ---------- RATINGS (1..5, one per user per item) ----------
CREATE TABLE public.ratings (
  item_id uuid NOT NULL REFERENCES public.list_items(id) ON DELETE CASCADE,
  list_id uuid NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  score smallint NOT NULL CHECK (score BETWEEN 1 AND 5),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (item_id, user_id)
);
CREATE INDEX ratings_list_idx ON public.ratings(list_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ratings TO authenticated;
GRANT ALL ON public.ratings TO service_role;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read ratings" ON public.ratings
  FOR SELECT TO authenticated USING (public.is_list_member(list_id, auth.uid()));
CREATE POLICY "Members rate" ON public.ratings
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND public.is_list_member(list_id, auth.uid()));
CREATE POLICY "Users update own rating" ON public.ratings
  FOR UPDATE TO authenticated USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND public.is_list_member(list_id, auth.uid()));
CREATE POLICY "Users delete own rating" ON public.ratings
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ---------- COMMENTS ----------
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.list_items(id) ON DELETE CASCADE,
  list_id uuid NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX comments_item_idx ON public.comments(item_id, created_at);
CREATE INDEX comments_list_idx ON public.comments(list_id);
GRANT SELECT, INSERT, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read comments" ON public.comments
  FOR SELECT TO authenticated USING (public.is_list_member(list_id, auth.uid()));
CREATE POLICY "Members comment" ON public.comments
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND public.is_list_member(list_id, auth.uid()));
CREATE POLICY "Author or owner deletes comment" ON public.comments
  FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_list_owner(list_id, auth.uid()));

-- Keep list_id on ratings/comments consistent with the item's list
CREATE OR REPLACE FUNCTION public.sync_item_list_id()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  SELECT list_id INTO NEW.list_id FROM public.list_items WHERE id = NEW.item_id;
  IF NEW.list_id IS NULL THEN RAISE EXCEPTION 'item not found'; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER ratings_sync_list BEFORE INSERT OR UPDATE ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION public.sync_item_list_id();
CREATE TRIGGER comments_sync_list BEFORE INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.sync_item_list_id();
CREATE TRIGGER ratings_updated_at BEFORE UPDATE ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- REALTIME ----------
ALTER TABLE public.list_items REPLICA IDENTITY FULL;
ALTER TABLE public.ratings REPLICA IDENTITY FULL;
ALTER TABLE public.comments REPLICA IDENTITY FULL;
ALTER TABLE public.list_members REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.list_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ratings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.list_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lists;
