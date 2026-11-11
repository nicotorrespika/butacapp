# Butacapp

Quiero que construyas una web app mobile-first para armar listas colaborativas ("watchlists") de películas, música y arte.

## Concepto

Una app simple donde un grupo de personas arma listas compartidas de cosas para ver, escuchar o visitar, y las va marcando, puntuando y comentando entre todos.

## Plataforma

- Mobile-first: se usa principalmente desde el celular (viewport ~390px). Que también se vea bien en desktop, pero optimizá todo para pulgar y pantalla chica.

- Navegación inferior con 3 pestañas: Buscar, Mis listas, Perfil.

- Botones y áreas táctiles de mínimo 44px. Sin hover como única interacción.

- Una sola página (SPA), rápida, sin pasos innecesarios.

## Cuentas y colaboración

- Login con cuenta de usuario (email + contraseña o magic link; sumá Google si es simple).

- Cada usuario puede crear listas y invitar a otros por link o por email.

- Roles por lista: dueño y colaboradores (los colaboradores pueden agregar, puntuar y comentar).

- Cada lista tiene nombre, descripción corta y tipo (películas, música, arte o mixta).

## Buscador unificado

Una sola barra de búsqueda con filtros rápidos (chips): Todo / Películas / Música / Arte.

Tiene que entender todas estas variantes:

- Título de película, serie, álbum, canción u obra

- Nombre de autor: director, actor, artista, banda, pintor

- Año (ej: "1994") y combinaciones (ej: "Tarkovsky 1979", "Radiohead OK Computer")

- Resultados con portada/póster, título, autor/artista y año

- Búsqueda con debounce y resultados que aparecen mientras se escribe

- Botón "+" para agregar a una lista directamente desde el resultado

Fuentes de datos sugeridas (APIs gratuitas):

- Películas: TMDB

- Música: MusicBrainz + Cover Art Archive (o iTunes Search API)

- Arte: Art Institute of Chicago API y/o The Met Museum API

Si alguna requiere API key, dejá el lugar claro para configurarla y explicame cómo conseguirla.

## Cada título dentro de una lista

- Marcar como visto / escuchado / visitado (toggle)

- Poner nota (ej: 1 a 5 estrellas o 1 a 10), una por usuario, mostrando también el promedio del grupo

- Comentarios (hilo corto por título)

- Mostrar quién lo agregó y cuándo

- Ordenar y filtrar: pendientes / vistos, por nota, por fecha agregada, por quién lo agregó

## Diseño: oscuro, tipo cine

- Tema oscuro por defecto: fondos casi negros, texto claro, un solo color de acento cálido (ámbar o rojo cine).

- Portadas y pósters protagonistas, en grillas y carruseles.

- Tipografía con carácter: un serif elegante para títulos y una sans limpia para el resto.

- Detalles sutiles: viñetas, grano leve, transiciones suaves. Nada recargado.

- Estados vacíos, de carga y de error cuidados.

## Técnico

- Código limpio y bien comentado.

- Guardá usuarios, listas, ítems, notas y comentarios en un backend con base de datos en tiempo real (por ejemplo Supabase o Firebase) para que los cambios de otros colaboradores se vean al instante.

- Explicame paso a paso cómo configurarlo y cómo publicar la app.

## Alcance

Hacé primero una versión MVP funcional con: login, crear lista, buscar, agregar, marcar, puntuar y comentar. Después proponeme mejoras.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://butacapp.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ee4985fe-f925-5403-8972-ce32c2fdb9c7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
