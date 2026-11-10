# BUTACAPP: de listas compartidas a una red social de cine

## Qué cambia
- Renombrar la app a **BUTACAPP**, conservando la estética oscura, silenciosa y minimalista, las listas existentes y las notas de 1–10.
- Incorporar cinco pestañas: **Inicio, Buscar, Listas, Amigos, Perfil**. El nombre de la barra superior siempre vuelve al inicio.
- Mantener las funciones actuales de búsqueda, colaboración, críticas y recomendaciones con IA.

## Inicio
- Sin sesión: mosaico denso de pósters, oscurecido para que BUTACAPP, una frase breve y los botones **Entrar / Crear cuenta** sean legibles.
- Pósters de películas populares y mejor valoradas de TMDB, con movimiento muy lento y desactivado cuando la persona prefiera menos animaciones.
- Con sesión: actividad de amigos y accesos a las listas propias, con estados vacíos cuidados.

## Perfiles y amigos
- Ampliar los perfiles actuales con nombre de usuario único, nombre, bio y foto personalizable.
- Elegir y reordenar hasta cinco películas destacadas, con controles táctiles accesibles.
- Mostrar Favoritas, Listas, Reseñas, Vistas y Amigos, junto con estadísticas de películas vistas, promedio de notas y géneros más vistos.
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

## Limitación actual
TMDB y OMDb rechazaron las claves guardadas. La nueva estructura social se puede implementar, pero el mosaico real, las fichas, las filmografías y los géneros necesitan una clave TMDB válida; no se presentarán datos inventados como reales.

El archivo recibido termina al comienzo de la sección 6, en «Marcar como visto / escuchado / visitado». Para esa parte se conservan las reglas ya acordadas: estrellas de 1–10, una crítica por usuario y comentarios.