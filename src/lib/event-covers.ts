import favero from '@/assets/event-favero.jpg.asset.json';
import felix from '@/assets/event-felix.jpg.asset.json';
import lovro from '@/assets/event-lovro.webp.asset.json';
import tempestad from '@/assets/event-tempestad.webp.asset.json';
import walkure from '@/assets/event-walkure.webp.asset.json';
import santiago from '@/assets/event-santiago.jpg.asset.json';

const covers = [
  { match: 'alberto favero', url: favero.url, credit: 'Néstor Grassi · Noticias / Perfil', source: 'https://noticias.perfil.com/noticias/personajes/alberto-favero-la-belleza-es-un-acto-de-libertad-en-un-mundo-que-tiende-a-la-brutalidad.phtml' },
  { match: 'felix san martin', url: felix.url, credit: 'Difusión · ISOS Córdoba', source: 'https://isoscba.com.ar/felix-san-martin-mis-discos-de-dirijen-hacia-lo-electronico/' },
  { match: 'lovro pogorelic', url: lovro.url, credit: 'Difusión Teatro Colón · Índice Cultural', source: 'https://indicecultural.com.ar/buenos-aires/propuesta/lovro-pogorelic-piano-festival-chopiniana-teatro-colon' },
  { match: 'la tempestad', url: tempestad.url, credit: 'Difusión Teatro Colón · Índice Cultural', source: 'https://indicecultural.com.ar/buenos-aires/propuesta/la-tempestad-teatro-colon' },
  { match: 'die walkure', url: walkure.url, credit: 'Difusión Teatro Colón · Índice Cultural', source: 'https://indicecultural.com.ar/buenos-aires/propuesta/die-walkure-teatro-colon' },
  { match: 'santiago alonso', url: santiago.url, credit: 'El Salto · portada del disco / iTunes', source: 'https://music.amazon.es/albums/B0DZRJZ7LB' },
];

export function eventCover(title: string) {
  const normalized = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return covers.find(cover => normalized.includes(cover.match));
}