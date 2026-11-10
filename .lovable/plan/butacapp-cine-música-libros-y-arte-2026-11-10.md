# BUTACAPP: Cine, Música, Libros y Arte

## Objetivo
Ampliar BUTACAPP a cuatro categorías culturales sin cambiar la experiencia que ya funciona para películas. Mantener el diseño actual, el cobre sobrio, las tipografías, el voseo y la barra inferior con **Inicio / Buscar / Perfil**.

## 1. Inicio y actividad por categoría
- Agregar arriba las pestañas deslizables **Todo / Cine / Música / Libros / Arte**, con selección destacada y recordada.
- **Todo** reúne la actividad de amigos de todas las categorías; las noticias se incorporan en el paso 5.
- **Cine** conserva las listas, Sorprendeme y cine argentino actuales. Las fichas, filmografías, notas, comentarios, Descubrir y Betty de películas siguen igual.
- Filtrar la actividad antes de paginar y mostrar un ícono discreto de categoría en cada fila. Conservar likes, respuestas y actualización.
- Las otras pestañas muestran contenido real a medida que se completa cada categoría, sin noticias ni recomendaciones ficticias.

## 2. Libros
- Integrar Open Library para buscar por título, autor y año, con resultados agrupados en Todo y filtro Libros.
- Ficha con portada, autor, año, sinopsis, temas y datos de edición cuando estén disponibles. Páginas y enlaces para conseguirlo corresponden a una edición identificada; no inventar disponibilidad en Argentina.
- Incorporar listas de libros y mixtas, panel rápido dentro de la lista y ficha completa al tocar el título. Volver restaura el panel.
- Guardar estado personal, favorita, nota de 1–10 y reseña; conservar notas y comentarios del grupo por lista.
- Agregar Top 5 de libros y filtros de categoría en el perfil. Acciones con verbos como **Lo leí / Quiero leerlo**.

## 3. Música
- Reutilizar la búsqueda iTunes existente y ampliar sus datos con la consulta de álbum y canciones.
- Ficha con portada, artista, año, géneros, tracklist y discográfica solo si la fuente la informa.
- Reproducir un fragmento únicamente cuando exista una URL autorizada por el proveedor; cargarlo al pedirlo, sin reproducción automática.
- Reutilizar el recorrido lista → panel → ficha, estado personal, notas, reseñas, comentarios y Top 5 de discos.
- Acciones **La escuché / Quiero escucharlo**, ajustadas a álbum o canción.

## 4. Arte
- Ampliar las fuentes ya integradas, Art Institute of Chicago y The Met, con fichas de obras verificadas.
- Mostrar imagen, artista, año, técnica, colección y descripción disponible, con enlace a la fuente.
- Reutilizar paneles, listas, notas, reseñas, comentarios, estado personal y Top 5 de obras.
- Distinguir descubrir una obra de visitar una exposición: no presentar obras del catálogo como muestras vigentes.
- Incorporar otras fuentes, como Rijksmuseum, solo si su acceso está disponible y aporta datos necesarios.

## 5. Novedades, noticias y eventos
- Cine: sumar cartelera y próximos estrenos desde TMDB, región AR, sin reemplazar la colección argentina.
- Evaluar RSS culturales argentinos e internacionales accesibles y adecuados para cada categoría.
- Cada noticia muestra titular, una línea resumida con palabras propias, fuente, fecha y enlace. Nunca reproducir artículos completos.
- Mostrar conciertos, ferias y exposiciones solo con fechas y lugar comprobados; no confundir recomendaciones de catálogo con novedades o eventos.
- Conservar resultados en caché durante seis horas y refrescar al vencer, con fallas independientes por fuente.
- La búsqueda web desde la app requiere conectar un servicio autorizado. Si no se habilita, los RSS accesibles siguen funcionando y la búsqueda web queda explícitamente pendiente.

## 6. Sorprendeme, Descubrir y Betty
- Agregar versiones por categoría usando portadas y resultados reales, con filtros respaldados por cada fuente.
- Conservar gestos y botones explícitos, Deshacer y respeto por movimiento reducido.
- Excluir lo ya consumido, guardado o descartado en esa categoría.
- Betty recomienda cine, discos, libros y obras; cada resultado se verifica contra su catálogo antes de mostrarlo.
- Dentro de una lista, Betty considera su tipo y contenido; en listas mixtas puede proponer las cuatro categorías.
- Mantener su saludo, humor seco, historial, feedback y avisos de bettiadas. No inventar obras, autores, puntuaciones, eventos ni motivos atribuidos a críticos.

## Detalles técnicos
- Ampliar los tipos de medios y los validadores de búsqueda con libros; mantener los identificadores y enlaces existentes de películas.
- Reutilizar adición a listas, paneles, estrellas y comentarios; crear fichas específicas para álbum, libro y obra, cada una con título y metadatos propios.
- Cambios de datos aditivos: admitir libros en listas e ítems; agregar estado personal para los nuevos medios y Top 5 por categoría sin reemplazar `movie_entries` ni el Top 5 de cine existente.
- Agregar categoría a la actividad, completar la de registros existentes desde ítems/listas/fuentes verificables y conservar la privacidad y permisos actuales. Las listas mixtas siguen siendo mixtas; no atribuirles una categoría falsa.
- Las consultas de usuario siguen desde el cliente con RLS. Proveedores externos y Betty permanecen en funciones autenticadas, con secretos solo del lado servidor.
- Caché persistente para noticias y respuestas públicas de catálogos; no compartir gustos, historial ni contexto privado de listas entre usuarios.
- Preferir APIs sin clave para las nuevas categorías. Si se necesita una credencial adicional, solicitarla mediante el formulario seguro y explicar cómo obtenerla.

## Comprobación en cada paso
- Ejecutar pruebas de regresión de Cine y nuevas pruebas para tipos de listas, notas, filtros de categoría, exclusiones y verificación de catálogos.
- Comprobar con sesión real en celular: buscar → agregar a lista → abrir panel → puntuar/comentar → abrir ficha → volver al panel → recargar y confirmar persistencia.
- Para Cine, revisar también filmografía, tráiler, Sorprendeme, Descubrir y Betty; no declarar comprobado un flujo sin probarlo.
- Revisar Inicio y Perfil en celular y escritorio, pestaña recordada, tres accesos inferiores y ausencia de errores al navegar.
- El feed colaborativo entre dos personas requiere dos cuentas autorizadas con amistad aceptada; si no están disponibles, indicar esa comprobación pendiente.

## Orden de entrega
1. Pestañas y feed por categoría.
2. Libros.
3. Música.
4. Arte.
5. Noticias y eventos.
6. Sorprendeme, Descubrir y Betty multicategoría.

Cada paso incluye su comprobación de Cine antes de avanzar. La ampliación no incluye una versión nativa para App Store ni resuelve por sí sola las credenciales pendientes de crítica y búsqueda web.