import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { GuestCatalog } from '@/components/GuestCatalog';
export const Route = createFileRoute('/buscar')({
  staticData: { sitemap: true },
  validateSearch: z.object({ q: z.string().max(120).optional(), f: z.enum(['all', 'movie', 'music', 'book']).optional() }),
  head: () => ({ meta: [
    { title: 'Buscador sin cuenta — MOMENTO BUTACA' },
    { name: 'description', content: 'Buscá películas, discos y libros y consultá sus fichas sin iniciar sesión.' },
    { property: 'og:title', content: 'Descubrí cine, música y libros — MOMENTO BUTACA' },
    { property: 'og:description', content: 'Explorá el catálogo cultural sin crear una cuenta.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: () => { const params = Route.useSearch(); return <GuestCatalog key={`${params.q ?? ''}:${params.f ?? 'all'}`} initialQuery={params.q ?? ''} initialFilter={params.f ?? 'all'}/>; },
});