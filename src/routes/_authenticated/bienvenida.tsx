import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { TasteEditor } from '@/components/TasteEditor';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';

export const Route = createFileRoute('/_authenticated/bienvenida')({
  head: () => ({ meta: [
    { title: 'Bienvenida — BUTACAPP' },
    { name: 'description', content: 'Contanos tus gustos antes de empezar y te recomendamos mejor.' },
    { property: 'og:title', content: 'Bienvenida — BUTACAPP' },
    { property: 'og:description', content: 'Tu primera fila en BUTACAPP.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: Welcome,
});

function Welcome() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const done = async () => { await qc.invalidateQueries({ queryKey: ['tastes'] }); void navigate({ to: '/' }); };
  const skip = async () => { if (user) await supabase.from('taste_settings').upsert({ user_id: user.id, onboarding_done: true }); await done(); };
  return <main className="space-y-6 px-4 py-8">
    <TasteEditor onboarding onDone={() => void done()} />
    <Button variant="ghost" onClick={() => void skip()}>Saltar por ahora</Button>
  </main>;
}
