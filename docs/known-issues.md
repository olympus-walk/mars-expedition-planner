# Problemas conocidos

## El mapa se aleja tras calcular una ruta (resuelto)

**Causa.** Al abrir el HUD se desmontaba toda la aplicación, mapa incluido. Al salir, el mapa se creaba de nuevo y `fitBounds(AREA.bounds)` elegía el zoom con la franja de la ruta ya abierta: a 1440×900 el mapa medía 625 px de alto en lugar de 900 y quedaba en el nivel 11 en vez del 12. Se reproducía siempre con estos pasos: calcular ruta, abrir HUD, salir del HUD.

**Corrección.** El HUD se dibuja encima de la aplicación y el mapa sigue montado (`App.jsx`), así que al volver conserva el zoom y la posición.

**Comportamiento actual al calcular una ruta.** El mapa se centra en la ruta sin acercarse (`RouteFocus` en `MarsMap.jsx`). Solo se aleja un nivel si la ruta no cabe sobre la franja: ocurre en ventanas de menos de unos 715 px de alto con el diseño de escritorio, por ejemplo 1366×650.

## Otras limitaciones de la interfaz
- La fuente Archivo se carga desde Google Fonts. Sin conexión se usa la fuente del sistema: la app funciona igual, con otro aspecto. El mapa necesita internet de todas formas.
- En tablets pequeñas (hasta 1180 px) la franja de la ruta ocupa cerca del 40 % de la altura. Se puede ocultar el perfil con el botón "Ocultar perfil".
- No se probó con un dispositivo táctil real ni con un lector de pantalla.
- Viking, MOLA y THEMIS tienen entre 100 y 463 m por píxel. En la zona de trabajo (5.9 km) se ven ampliados entre 8 y 64 veces: el mapa lo indica con una nota y no añade detalle. Para planificar se recomienda CTX.
- `GROUPS` y el campo `group` de `layers.js` ya no se usan en el panel, que separa las capas en "Mapa base" y "Sobre el mapa".
