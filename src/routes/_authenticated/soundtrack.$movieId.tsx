import { createFileRoute } from '@tanstack/react-router';
import { BackButton } from '@/components/BackButton';
import { Soundtrack } from '@/components/Soundtrack';

export const Route = createFileRoute('/_authenticated/soundtrack/$movieId')({
  head: () => ({ meta: [
    { title: 'Soundtrack y canciones — BUTACAPP' },
    { name: 'description', content: 'Discos y canciones de la banda sonora de una película.' },
    { property: 'og:title', content: 'Soundtrack y canciones — BUTACAPP' },
    { property: 'og:description', content: 'Explorá la banda sonora y sus canciones.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: SoundtrackPage,
});

function SoundtrackPage() {
  const { movieId } = Route.useParams();
  return <div className="space-y-8 py-5"><div className="px-4"><BackButton /></div><Soundtrack id={movieId} title="esta película" poster={null} expanded /></div>;
}