import { createFileRoute } from '@tanstack/react-router';
import { FirstSteps } from '@/components/FirstSteps';

export const Route = createFileRoute('/_authenticated/primeros-pasos')({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: 'Tus primeros pasos — MOMENTO BUTACA' },
    { name: 'description', content: 'Elegí tus películas, música y escritores para empezar a cruzar tus gustos artísticos.' },
    { property: 'og:title', content: 'Tu primera fila — MOMENTO BUTACA' },
    { property: 'og:description', content: 'Una bienvenida a tu medida: cine, música y libros que te gustan.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: FirstSteps,
});