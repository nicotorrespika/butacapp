# BUTACAPP: de listas compartidas a una red social de cine

## Qué cambia
- Renombrar la app a **BUTACAPP**, conservando la estética oscura, silenciosa y minimalista, las listas existentes y las notas de 1–10.
- Incorporar solo tres botones inferiores grandes, con ícono y texto: **Inicio, Buscar, Perfil**. No agregar otros botones fijos. El logo BUTACAPP siempre vuelve al inicio.
- Listas y amigos se acceden desde Inicio y Perfil. Todas las pantallas internas tienen un botón visible **Atrás**.
- Mantener las funciones actuales de búsqueda, colaboración, críticas y recomendaciones con IA.

## Inicio
- Sin sesión: mosaico denso de pósters, oscurecido para que BUTACAPP, una frase breve y los botones **Entrar / Crear cuenta** sean legibles.
- Pósters de películas populares y mejor valoradas de TMDB, con movimiento muy lento y desactivado cuando la persona prefiera menos animaciones.
- Con sesión: collage de bienvenida, accesos rápidos a mis listas y el feed **En qué andan** debajo.

## Feed «En qué andan»
- Lista vertical de actividad de amigos, de más reciente a más antigua, con carga automática al llegar al final y tirar para refrescar; ofrecer también un control visible de actualización.
- Filas compactas sin tarjetas ni sombras: avatar, usuario y tiempo; póster pequeño siempre en el mismo lado; separación con espacio y una línea muy tenue.
- Actividades: vio y puntuó, reseñó con extracto y **Ver más**, creó una lista con 3–4 mini pósters, agregó una película y comentó en película o lista.
- Título de película en serif y enlaces a la ficha; nombre enlazado al perfil del amigo.
- Likes y respuestas con corazón/comentario acompañados de texto, respetando el pedido de controles claros. Acento solo en estrellas y likes activos.
- Filtros **Todo / Solo vistas y notas**.
- Sin amigos: mensaje breve y botón grande **Buscar amigos**, no un feed vacío.

## Uso simple
- Una sola acción principal destacada por pantalla; el resto discreto, sin menús escondidos.
- Botones grandes con ícono y texto; ninguna acción depende de entender un ícono solo o descubrir un gesto.
- Flujos frecuentes de agregar o marcar una película en no más de dos toques desde su selección.
- Confirmaciones cortas con **Deshacer** para cambios reversibles, estados vacíos con una acción clara y errores amables que indiquen qué hacer.
- Al crear la cuenta, pedir solo nombre de usuario como dato de perfil; luego ofrecer Top 5 sin obligar. Mantener email/contraseña o Google como credenciales de acceso.

## Perfiles y amigos
- Ampliar los perfiles actuales con nombre de usuario único, nombre, bio y foto personalizable.
- Elegir y reordenar hasta cinco películas destacadas, con controles táctiles accesibles.
- Mostrar Listas, Favoritas, Reseñas, Vistas y Amigos, junto con estadísticas de películas vistas, promedio de notas y géneros más vistos. Desde Perfil se puede crear una lista con **+ Nueva lista** y agregar amigos.
- Buscar personas por nombre o usuario, enviar solicitudes, aceptarlas o rechazarlas y ver perfiles de amigos.
- Permitir comentarios en el perfil de amigos y en reseñas y listas, conservando los comentarios actuales de películas.

## Privacidad y colaboración
- Agregar visibilidad **privada / solo amigos / pública**. Todas las listas existentes siguen privadas.
- Ver una lista no convierte a nadie en colaborador: solo dueño y miembros invitados pueden agregar, marcar, puntuar o comentar dentro de ella.
- Invitar amigos desde una lista, sin quitar las invitaciones actuales por enlace o email.
- La actividad de amigos respeta la privacidad original: ningún evento de una lista privada se muestra a personas sin acceso.

## Detalles técnicos
- Extender Lovable Cloud de forma aditiva para amistades, favoritas, actividad y comentarios sociales, sin borrar datos existentes.
- Reutilizar la autenticación y los perfiles actuales; no crear un segundo sistema de cuentas.
- Conservar las consultas habituales desde el cliente y el control de acceso en las reglas de la base de datos. APIs externas y claves permanecen en funciones autenticadas cuando corresponda.
- Mantener TanStack Router y agregar pantallas reales para inicio, amigos y perfiles visitables; las páginas públicas tendrán títulos y descripciones propios.
- Las estadísticas personales no se deducen del estado grupal «visto»: usar un registro personal de visualizaciones para evitar atribuir a todos lo que vio una sola persona.
- Guardar géneros desde TMDB para estadísticas cuando el proveedor esté disponible, sin inventarlos.

## Verificación
- Probar navegación en celular y escritorio, edición de perfil y reordenamiento del top 5.
- Probar solicitudes entre dos cuentas, aceptación, invitación a una lista y lectura de actividad.
- Agregar pruebas de acceso para listas privadas, de amigos y públicas, y comprobar que ver no permita editar.
- Verificar persistencia después de recargar y conservar las pruebas actuales de notas, búsqueda y recomendaciones.
- Verificar paginación y refresco del feed, likes y respuestas, enlaces a perfiles/fichas, filtros y estado sin amigos.

## Limitación actual
TMDB y OMDb rechazaron las claves guardadas. La nueva estructura social se puede implementar, pero el mosaico real, las fichas, las filmografías y los géneros necesitan una clave TMDB válida; no se presentarán datos inventados como reales.

El archivo recibido termina al comienzo de la sección 6, en «Marcar como visto / escuchado / visitado». Para esa parte se conservan las reglas ya acordadas: estrellas de 1–10, una crítica por usuario y comentarios.