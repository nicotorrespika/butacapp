ALTER TABLE public.list_items ADD COLUMN IF NOT EXISTS position integer;
UPDATE public.list_items li SET position = s.rn FROM (SELECT id, row_number() OVER (PARTITION BY list_id ORDER BY created_at) rn FROM public.list_items) s WHERE s.id = li.id;
CREATE OR REPLACE FUNCTION public.set_item_position() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.position IS NULL THEN
    SELECT coalesce(max(position),0)+1 INTO NEW.position FROM public.list_items WHERE list_id = NEW.list_id;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS list_items_position ON public.list_items;
CREATE TRIGGER list_items_position BEFORE INSERT ON public.list_items FOR EACH ROW EXECUTE FUNCTION public.set_item_position();
CREATE INDEX IF NOT EXISTS list_items_list_position_idx ON public.list_items(list_id, position);