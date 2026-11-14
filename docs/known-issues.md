# Problemas conocidos

## El mapa se aleja tras calcular una ruta (no reproducido)

**Qué se vio.** El 14-11-2026, en desarrollo con el servidor de Vite y la capa CTX a 1440×900, el mapa quedó unos niveles más lejos justo después de pulsar "Calcular ruta": los marcadores de la base y las paradas aparecían muy juntos. Ocurrió una sola vez y no se pudo repetir.

**Qué se probó sin éxito.** En todos los casos el zoom se mantuvo en el nivel 12 y la distancia entre las paradas 1 y 4 en 441 px:
- Calcular la ruta tras una carga limpia, en modo a pie y en rover, con una parada desplegada o sin ella.
- Calcular a los 0.1 s de cargar la página, con los tiles aún llegando.
- Provocar hot reload de `styles.css`, `MarsMap.jsx`, `App.jsx`, `layers.js` y `format.js` con la ruta visible.
- Cambiar el tamaño de la ventana con la ruta visible: 1440×900, 1024×768, 390×844 y de vuelta.
- Alejar con el control del mapa y volver a calcular (el zoom se mantiene en el nuevo nivel).

**Qué se sabe del comportamiento.**
- La vista inicial se calcula una sola vez, al crear el mapa, con `fitBounds(AREA.bounds)` en `MarsMap.jsx`. Depende del tamaño del contenedor: la zona de 5.9 km queda en el nivel 12 con 1068×900 px y en el nivel 11 con 390 px de ancho. Es el comportamiento esperado.
- Al calcular una ruta aparece la franja inferior, el mapa se reduce de alto y `ResizeWatcher` llama a `invalidateSize()`. Esto mueve el encuadre pero no cambia el zoom (comprobado).
- Hipótesis sin confirmar: que el `MapContainer` se haya vuelto a crear (por ejemplo por un hot reload parcial en desarrollo) mientras el contenedor tenía otro tamaño, con lo que `fitBounds` eligió otro nivel. No se ha visto ocurrir en producción (`npm run build`).

**Cómo vigilarlo.**
1. Durante los ensayos de la demo, usar el build de producción (`npm run build` y `npm run preview`) en lugar del servidor de desarrollo. Si no aparece ahí, es un efecto del hot reload.
2. Si vuelve a ocurrir, anotar: tamaño de ventana, capa base, si había una parada desplegada, qué se pulsó justo antes y si hubo ediciones de código en ese momento.
3. En la consola del navegador, para ver el nivel de zoom en cada cambio de tiles:
   ```js
   new MutationObserver(() => console.log('zoom', [...new Set([...document.querySelectorAll('img.leaflet-tile')].map(t => t.src.split('/').slice(-3)[0]))].join(','))).observe(document.querySelector('.leaflet-tile-pane'), { childList: true, subtree: true });
   ```
4. Para encontrar quién cambia el zoom, añadir de forma temporal dentro de `MarsMap.jsx`, en un componente hijo de `MapContainer`: `useMapEvents({ zoomend: (event) => console.trace('zoomend', event.target.getZoom()) })`. La traza indica qué código lo provocó. Quitarlo después.
5. Si se confirma que el mapa se vuelve a crear, el síntoma sería que `MapContainer` se desmonta: comprobarlo con un `useEffect` de limpieza en `MarsMap`.

No se aplicó ninguna corrección, porque no hay una causa confirmada.

## Otras limitaciones de la interfaz
- La fuente Archivo se carga desde Google Fonts. Sin conexión se usa la fuente del sistema: la app funciona igual, con otro aspecto. El mapa necesita internet de todas formas.
- En tablets pequeñas (hasta 1180 px) la franja de la ruta ocupa cerca del 40 % de la altura. Se puede ocultar el perfil con el botón "Ocultar perfil".
- No se probó con un dispositivo táctil real ni con un lector de pantalla.
