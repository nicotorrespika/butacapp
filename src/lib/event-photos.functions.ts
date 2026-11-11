import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const signEventPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ path: z.string().min(1).max(300).regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}$/i) }).parse(d))
  .handler(async ({ data, context }) => {
    // Visibility checked as the caller (RLS applies): only published (verified or community) events.
    const { data: event } = await context.supabase
      .from("cultural_events")
      .select("id")
      .eq("image_url", `storage:${data.path}`)
      .or("verified.eq.true,community.eq.true")
      .limit(1)
      .maybeSingle();
    if (!event) return { url: null as string | null };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const r = await supabaseAdmin.storage.from("event-photos").createSignedUrl(data.path, 3600);
    return { url: r.data?.signedUrl ?? null };
  });
